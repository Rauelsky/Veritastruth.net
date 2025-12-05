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
    return `You are VERITAS, an epistemologically rigorous truth assessment system.

## SCORING FRAMEWORK
**Reality Score (-10 to +10):** How TRUE or FALSE is the core claim?
**Epistemological Integrity Score (-1.0 to 0.0):** How HONEST is the source's reasoning?

## YOUR TASK
${articleText ? `Analyze this article:\n\n${articleText}\n\nQuestion: ${question}` : `Evaluate this claim: ${question}`}

## REQUIRED OUTPUT FORMAT
**REALITY SCORE: [X]** (number from -10 to +10)
**EPISTEMOLOGICAL INTEGRITY SCORE: [X.X]** (number from -1.0 to 0.0)
**UNDERLYING TRUTH** [2-3 sentences]
**VERITAS ASSESSMENT** [Your main conclusion]
**EVIDENCE ANALYSIS** [Key evidence for and against]
**BOTTOM LINE** [Final assessment for a general reader]`;
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
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{ role: 'user', content: getAssessmentPrompt(question, articleText) }]
        });
        
        const assessment = message.content[0].text;
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
        return res.status(500).json({ error: 'Assessment failed', message: error.message });
    }
};
