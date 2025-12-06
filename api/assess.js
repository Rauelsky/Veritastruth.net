const Anthropic = require('@anthropic-ai/sdk');

const rateLimitMap = new Map();
const FREE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

function getRateLimitKey(req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
    return 'rate:' + ip;
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

function buildPrompt(question, articleText) {
    var prompt = 'You are VERITAS, an epistemologically rigorous truth assessment system. Your purpose is to evaluate claims with intellectual honesty, transparent reasoning, and appropriate epistemic humility.\n\n';
    
    prompt += '## CRITICAL INSTRUCTION: VERIFY WITH CURRENT SOURCES\n';
    prompt += 'Before making any assessment, you MUST search the web to:\n';
    prompt += '1. Find current, authoritative sources on the topic\n';
    prompt += '2. Verify any factual claims with multiple sources\n';
    prompt += '3. Check if recent developments have changed the situation\n';
    prompt += '4. Look for expert consensus and dissenting views\n\n';
    prompt += 'Do NOT rely solely on your training data. Always search for current information first.\n\n';
    
    prompt += '## SCORING FRAMEWORK\n\n';
    prompt += '**Reality Score (-10 to +10):** How TRUE or FALSE is the core claim?\n';
    prompt += '- +10: Definitively true, overwhelming evidence\n';
    prompt += '- +7 to +9: Strong evidence supports this\n';
    prompt += '- +4 to +6: More likely true than not\n';
    prompt += '- +1 to +3: Slightly more evidence for than against\n';
    prompt += '- 0: Genuinely uncertain, evidence balanced\n';
    prompt += '- -1 to -3: Slightly more evidence against\n';
    prompt += '- -4 to -6: More likely false than true\n';
    prompt += '- -7 to -9: Strong evidence contradicts this\n';
    prompt += '- -10: Definitively false, overwhelming counter-evidence\n\n';
    
    prompt += '**Epistemological Integrity Score (-1.0 to 0.0):** How HONEST is the source reasoning?\n';
    prompt += '- 0.0: Exemplary intellectual honesty\n';
    prompt += '- -0.1 to -0.3: Minor issues (slight bias, minor omissions)\n';
    prompt += '- -0.4 to -0.6: Significant problems (cherry-picking, misleading framing)\n';
    prompt += '- -0.7 to -1.0: Severe manipulation (deliberate deception, bad faith)\n\n';
    
    prompt += '## TRUTH DISTORTION PATTERNS TO DETECT\n\n';
    prompt += '1. **Epistemological Special Pleading**: Applying different evidence standards based on desired conclusions\n';
    prompt += '2. **Weaponized Uncertainty**: Exploiting complexity to avoid inconvenient conclusions\n';
    prompt += '3. **Tribal Reasoning**: Evaluating claims based on who makes them rather than merit\n\n';
    
    prompt += '## YOUR TASK\n\n';
    if (articleText) {
        prompt += 'Analyze this article:\n\n' + articleText + '\n\nQuestion about the article: ' + question + '\n\n';
    } else {
        prompt += 'Evaluate this claim/question: ' + question + '\n\n';
    }
    
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    prompt += '**REALITY SCORE: [X]** (number from -10 to +10)\n\n';
    prompt += '**EPISTEMOLOGICAL INTEGRITY SCORE: [X.X]** (number from -1.0 to 0.0)\n\n';
    prompt += '**UNDERLYING TRUTH**\n[2-3 sentences on what is actually true about this topic]\n\n';
    prompt += '**VERITAS ASSESSMENT**\n[Your main conclusion in 2-3 sentences]\n\n';
    prompt += '**CLAIM BEING TESTED**\n[State the specific claim you are evaluating]\n\n';
    prompt += '**EVIDENCE ANALYSIS**\n[Key evidence for and against, with source quality notes]\n\n';
    prompt += '**TRUTH DISTORTION ANALYSIS**\n[Any patterns detected]\n\n';
    prompt += '**WHAT WE CAN BE CONFIDENT ABOUT**\n[Claims with strong evidentiary support]\n\n';
    prompt += '**WHAT REMAINS GENUINELY UNCERTAIN**\n[Areas where evidence is limited or conflicting]\n\n';
    prompt += '**BOTTOM LINE**\n[Final assessment for a general reader]\n\n';
    prompt += '**LESSONS FOR INFORMATION ASSESSMENT**\n[What this example teaches about evaluating similar claims]\n\n';
    prompt += '**KEY SOURCES REFERENCED**\n[List main sources consulted]';
    
    return prompt;
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
        var body = req.body;
        if (!body) {
            return res.status(400).json({ error: 'No request body' });
        }
        
        var question = body.question || '';
        var articleText = body.articleText || '';
        var userApiKey = body.userApiKey || '';
        
        if (!question && !articleText) {
            return res.status(400).json({ error: 'Please provide a question or article text' });
        }
        
        var apiKey = userApiKey;
        if (!apiKey) {
            var rateCheck = checkRateLimit(getRateLimitKey(req));
            if (!rateCheck.allowed) {
                return res.status(429).json({ error: 'Daily free limit reached. Add your own API key for unlimited use.', resetAt: rateCheck.resetAt });
            }
            apiKey = process.env.ANTHROPIC_API_KEY;
        }
        
        if (!apiKey) {
            return res.status(500).json({ error: 'No API key configured' });
        }
        
        var anthropic = new Anthropic({ apiKey: apiKey });
        var prompt = buildPrompt(question, articleText);
        var message;
        
        try {
            message = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                tools: [{
                    type: 'web_search_20250305',
                    name: 'web_search'
                }],
                messages: [{ role: 'user', content: prompt }]
            });
        } catch (toolErr) {
            message = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                messages: [{ role: 'user', content: prompt }]
            });
        }
        
        var assessment = '';
        for (var i = 0; i < message.content.length; i++) {
            if (message.content[i].type === 'text') {
                assessment += message.content[i].text;
            }
        }
        
        if (!assessment) {
            return res.status(500).json({ error: 'No assessment generated' });
        }
        
        var realityMatch = assessment.match(/REALITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        var integrityMatch = assessment.match(/EPISTEMOLOGICAL INTEGRITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        
        return res.status(200).json({
            success: true,
            assessment: assessment,
            realityScore: realityMatch ? parseFloat(realityMatch[1]) : null,
            integrityScore: integrityMatch ? parseFloat(integrityMatch[1]) : null,
            question: question || 'Article Assessment'
        });
        
    } catch (err) {
        console.error('Assessment error:', err);
        return res.status(500).json({ error: 'Assessment failed', message: err.message });
    }
};
