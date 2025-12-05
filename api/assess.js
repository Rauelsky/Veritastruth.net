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
Before making any assessment, you MUST search the web to:
1. Find current, authoritative sources on the topic
2. Verify any factual claims with multiple sources
3. Check if recent developments have changed the situation
4. Look for expert consensus and dissenting views

Do NOT rely solely on your training data. Always search for current information first.

## SCORING FRAMEWORK

**Reality Score (-10 to +10):** How TRUE or FALSE is the core claim?
- +10: Definitively true, overwhelming evidence
- +7 to +9: Strong evidence supports this
- +4 to +6: More likely true than not
- +1 to +3: Slightly more evidence for than against
- 0: Genuinely uncertain, evidence balanced
- -1 to -3: Slightly more evidence against
- -4 to -6: More likely false than true
- -7 to -9: Strong evidence contradicts this
- -10: Definitively false, overwhelming counter-evidence

**Epistemological Integrity Score (-1.0 to 0.0):** How HONEST is the source's reasoning?
- 0.0: Exemplary intellectual honesty
- -0.1 to -0.3: Minor issues (slight bias, minor omissions)
- -0.4 to -0.6: Significant problems (cherry-picking, misleading framing)
- -0.7 to -1.0: Severe manipulation (deliberate deception, bad faith)

## TRUTH DISTORTION PATTERNS TO DETECT

1. **Epistemological Special Pleading**: Applying different evidence standards based on desired conclusions
2. **Weaponized Uncertainty**: Exploiting complexity to avoid inconvenient conclusions  
3. **Tribal Reasoning**: Evaluating claims based on who makes them rather than merit

## YOUR TASK

${articleText ? `Analyze this article:\n\n${articleText}\n\nQuestion about the article: ${question}` : `Evaluate this claim/question: ${question}`}

## REQUIRED OUTPUT FORMAT

**REALITY SCORE: [X]** (number from -10 to +10)

**EPISTEMOLOGICAL INTEGRITY SCORE: [X.X]** (number from -1.0 to 0.0)

**UNDERLYING TRUTH**
[2-3 sentences on what's actually true about this topic]

**VERITAS ASSESSMENT**
[Your main conclusion in 2-3 sentences]

**CLAIM BEING TESTED**
[State the specific claim you're evaluating]

**EVIDENCE ANALYSIS**
[Key evidence for and against, with source quality notes]

**TRUTH DISTORTION ANALYSIS**
[Any patterns detected]

**WHAT WE CAN BE CONFIDENT ABOUT**
[Claims with strong evidentiary support]

**WHAT REMAINS GENUINELY UNCERTAIN**
[Areas where evidence is limited or conflicting]

**BOTTOM LINE**
[Final assessment for a general reader]

**LESSONS FOR INFORMATION ASSESSMENT**
[What this example teaches about evaluating similar claims]

**KEY SOURCES REFERENCED**
[List main sources consulted]`;
}

module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { question, articleText, userApiKey } = req.body || {};
        
        if (!question && !articleText) {
            return res.status(400).json({ error: 'Please provide a question or article text' });
        }
        
        let apiKey = userApiKey;
        if (!apiKey) {
            const rateLimit = checkRateLimit(getRateLimitKey(req));
            if (!rateLimit.allowed) {
                return res.status(429).json({ error: 'Daily free limit reached', resetAt: rateLimit.resetAt });
            }
            apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) {
                return res.status(500).json({ error: 'Platform API key not configured' });
            }
        }
        
        const anthropic = new Anthropic({ apiKey });
        
        // Try with web search tool
        let message;
        let usedWebSearch = false;
        
        try {
            message = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                tools: [{
                    type: "web_search_20250305",
                    name: "web_search"
                }],
                messages: [{ role: 'user', content: getAssessmentPrompt(question, articleText) }]
            });
            usedWebSearch = true;
        } catch (toolError) {
            // Fallback: try without web search
            console.log('Web search tool failed, using fallback:', toolError.message);
            message = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                messages: [{ role: 'user', content: getAssessmentPrompt(question, articleText) }]
            });
        }
        
        // Extract text from response
        let assessment = '';
        for (const block of message.content) {
            if (block.type === 'text') {
                assessment += block.text;
            }
        }
        
        if (!assessment) {
            return res.status(500).json({ error: 'No assessment text generated' });
        }
        
        const realityMatch = assessment.match(/REALITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        const integrityMatch = assessment.match(/EPISTEMOLOGICAL INTEGRITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        
        return res.status(200).json({
            success: true,
            assessment,
            realityScore: realityMatch ? parseFloat(realityMatch[1]) : null,
            integrityScore: integrityMatch ? parseFloat(integrityMatch[1]) : null,
            question: question || 'Article Assessment',
            webSearchUsed: usedWebSearch
        });
        
    } catch (error) {
        console.error('Assessment error:', error);
        return res.status(500).json({ 
            error: 'Assessment failed', 
            message: error.message 
        });
    }
};
