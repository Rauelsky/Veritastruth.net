const Anthropic = require('@anthropic-ai/sdk');

const rateLimitMap = new Map();
const FREE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

function getRateLimitKey(req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
    return `rate:${ip}`;
}

function checkRateLimit(key) {
    const now = Date.now();
    const record = rateLimitMap.get(key);
    if (!record || (now - record.windowStart) > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: FREE_LIMIT - 1 };
    }
    if (record.count >= FREE_LIMIT) {
        return { allowed: false, remaining: 0, resetAt: new Date(record.windowStart + RATE_LIMIT_WINDOW).toISOString() };
    }
    record.count++;
    return { allowed: true, remaining: FREE_LIMIT - record.count };
}

function getAssessmentPrompt(question, articleText) {
    return `You are VERITAS, an epistemologically rigorous truth assessment system. Your purpose is to evaluate claims with intellectual honesty, transparent reasoning, and appropriate epistemic humility.

## CRITICAL INSTRUCTION: VERIFY WITH CURRENT SOURCES
Before making any assessment, you MUST use web search to:
1. Find current, authoritative sources on the topic
2. Verify any factual claims with multiple sources
3. Check if recent developments have changed the situation
4. Look for expert consensus and dissenting views

Do NOT rely solely on your training data. Always search for current information.

## SCORING FRAMEWORK

**Reality Score (-10 to +10):** How TRUE or FALSE is the core claim?
- +10: Definitively true, overwhelming evidence from multiple authoritative sources
- +7 to +9: Strong evidence supports this across reliable sources
- +4 to +6: More likely true than not, preponderance of evidence
- +1 to +3: Slightly more evidence for than against
- 0: Genuinely uncertain, evidence balanced or insufficient
- -1 to -3: Slightly more evidence against
- -4 to -6: More likely false than true
- -7 to -9: Strong evidence contradicts this
- -10: Definitively false, overwhelming counter-evidence

**Epistemological Integrity Score (-1.0 to 0.0):** How HONEST is the source's reasoning?
- 0.0: Exemplary intellectual honesty, acknowledges uncertainty appropriately
- -0.1 to -0.3: Minor issues (slight bias, minor omissions)
- -0.4 to -0.6: Significant problems (cherry-picking, misleading framing)
- -0.7 to -1.0: Severe manipulation (deliberate deception, bad faith arguments)

## TRUTH DISTORTION PATTERNS TO DETECT

1. **Epistemological Special Pleading**: Applying different evidence standards based on whether conclusions are desired. Watch for cherry-picking studies, dismissing inconvenient evidence, or accepting weak evidence for preferred conclusions.

2. **Weaponized Uncertainty**: Exploiting genuine complexity to avoid inconvenient conclusions. Watch for "just asking questions," false balance, manufactured doubt, or demanding impossible certainty.

3. **Tribal Reasoning**: Evaluating claims based on who makes them rather than their merit. Watch for ad hominem, genetic fallacy, or automatically accepting/rejecting claims based on political alignment.

## YOUR TASK

${articleText ? `Analyze this article:\n\n${articleText}\n\nQuestion about the article: ${question}` : `Evaluate this claim/question: ${question}`}

## REQUIRED PROCESS

1. **SEARCH FIRST**: Use web search to find current, authoritative information on this topic
2. **IDENTIFY THE CORE CLAIM**: What specific, testable assertion is being made?
3. **GATHER EVIDENCE**: What do authoritative sources say? Note source quality.
4. **CHECK YOUR REASONING**: Are you applying consistent standards? Would you reach the same conclusion if the political valence were reversed?
5. **ACKNOWLEDGE UNCERTAINTY**: What don't we know? What would change your assessment?

## REQUIRED OUTPUT FORMAT

**REALITY SCORE: [X]** (number from -10 to +10)

**EPISTEMOLOGICAL INTEGRITY SCORE: [X.X]** (number from -1.0 to 0.0)

**UNDERLYING TRUTH**
[2-3 sentences on what's actually true about this topic, regardless of how the question is framed. This should be the objective reality that any honest observer would acknowledge.]

**VERITAS ASSESSMENT**
[Your main conclusion in 2-3 sentences. Be direct about what the evidence shows.]

**CLAIM BEING TESTED**
[State the specific claim you're evaluating - make it precise and testable]

**EVIDENCE ANALYSIS**
[Key evidence for and against the claim. Note source quality (peer-reviewed, official statistics, expert consensus vs. opinion pieces, partisan sources, anecdotes). Include what you found from web searches.]

**TRUTH DISTORTION ANALYSIS**
[Identify any patterns of epistemological special pleading, weaponized uncertainty, or tribal reasoning in how this topic is typically discussed. Be specific about which distortions are present.]

**WHAT WE CAN BE CONFIDENT ABOUT**
[Claims with strong evidentiary support from multiple authoritative sources]

**WHAT REMAINS GENUINELY UNCERTAIN**
[Areas where evidence is limited, conflicting, or where reasonable experts disagree]

**BOTTOM LINE**
[Clear, direct assessment for a general reader. Don't hedge excessively - give them a straight answer while noting key caveats.]

**LESSONS FOR INFORMATION ASSESSMENT**
[What does this example teach about evaluating similar claims? What red flags or good practices does it illustrate?]

**KEY SOURCES REFERENCED**
[List the main sources you consulted, noting their type and reliability]`;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { question, articleText, userApiKey } = req.body;
        if (!question && !articleText) return res.status(400).json({ error: 'Please provide a question or article text' });
        
        let apiKey = userApiKey;
        if (!apiKey) {
            const rateLimit = checkRateLimit(getRateLimitKey(req));
            if (!rateLimit.allowed) return res.status(429).json({ error: 'Daily free limit reached', resetAt: rateLimit.resetAt });
            apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) return res.status(500).json({ error: 'Platform API key not configured' });
        }
        
        const anthropic = new Anthropic({ apiKey });
        
        // Use web search tool for current information
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            tools: [
                {
                    type: "web_search_20250305",
                    name: "web_search",
                    max_uses: 5
                }
            ],
            messages: [{ role: 'user', content: getAssessmentPrompt(question, articleText) }]
        });
        
        // Extract the text response (may include tool use blocks)
        let assessment = '';
        for (const block of message.content) {
            if (block.type === 'text') {
                assessment += block.text;
            }
        }
        
        const realityMatch = assessment.match(/REALITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        const integrityMatch = assessment.match(/EPISTEMOLOGICAL INTEGRITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        
        return res.status(200).json({
            success: true,
            assessment,
            realityScore: realityMatch ? parseFloat(realityMatch[1]) : null,
            integrityScore: integrityMatch ? parseFloat(integrityMatch[1]) : null,
            question: question || 'Article Assessment'
        });
    } catch (error) {
        console.error('Assessment error:', error);
        return res.status(500).json({ error: 'Assessment failed', message: error.message });
    }
};
