// VERITAS Assessment API - Vercel Serverless Function
// Handles freemium rate limiting and API calls

const Anthropic = require('@anthropic-ai/sdk');

// Simple in-memory rate limiting (resets on cold start, but good enough for low traffic)
// For production, use Vercel KV or Upstash Redis
const rateLimitMap = new Map();
const FREE_LIMIT = 5; // assessments per day
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

function getRateLimitKey(req) {
    // Use IP address or forwarded IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               'unknown';
    return `rate:${ip}`;
}

function checkRateLimit(key) {
    const now = Date.now();
    const record = rateLimitMap.get(key);
    
    if (!record || (now - record.windowStart) > RATE_LIMIT_WINDOW) {
        // New window
        rateLimitMap.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: FREE_LIMIT - 1 };
    }
    
    if (record.count >= FREE_LIMIT) {
        const resetTime = new Date(record.windowStart + RATE_LIMIT_WINDOW);
        return { 
            allowed: false, 
            remaining: 0, 
            resetAt: resetTime.toISOString() 
        };
    }
    
    record.count++;
    return { allowed: true, remaining: FREE_LIMIT - record.count };
}

// VERITAS Assessment Prompt (condensed from v3.7.1)
function getAssessmentPrompt(question, articleText) {
    return `You are VERITAS, an epistemologically rigorous truth assessment system. Your purpose is to evaluate claims with intellectual honesty, transparent reasoning, and appropriate epistemic humility.

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

1. **Epistemological Special Pleading**: Applying different evidence standards based on whether conclusions are desired
2. **Weaponized Uncertainty**: Exploiting genuine complexity to avoid inconvenient conclusions
3. **Tribal Reasoning**: Evaluating claims based on who makes them rather than their merit

## YOUR TASK

${articleText ? `Analyze this article:\n\n${articleText}\n\nQuestion about the article: ${question}` : `Evaluate this claim/question: ${question}`}

## REQUIRED OUTPUT FORMAT

**REALITY SCORE: [X]** (number from -10 to +10)

**EPISTEMOLOGICAL INTEGRITY SCORE: [X.X]** (number from -1.0 to 0.0)

**UNDERLYING TRUTH**
[2-3 sentences on what's actually true about this topic, regardless of how the question is framed]

**VERITAS ASSESSMENT**
[Your main conclusion in 2-3 sentences]

**CLAIM BEING TESTED**
[State the specific claim you're evaluating]

**EVIDENCE ANALYSIS**
[Key evidence for and against, with source quality notes]

**TRUTH DISTORTION ANALYSIS**
[Any patterns of epistemological special pleading, weaponized uncertainty, or tribal reasoning detected]

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
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { question, articleText, userApiKey } = req.body;
        
        if (!question && !articleText) {
            return res.status(400).json({ error: 'Please provide a question or article text' });
        }
        
        // Determine which API key to use
        let apiKey = userApiKey;
        let usingUserKey = !!userApiKey;
        
        if (!apiKey) {
            // Check rate limit for free tier
            const rateLimitKey = getRateLimitKey(req);
            const rateLimit = checkRateLimit(rateLimitKey);
            
            if (!rateLimit.allowed) {
                return res.status(429).json({
                    error: 'Daily free limit reached',
                    message: `You've used your ${FREE_LIMIT} free assessments for today. You can either wait until ${rateLimit.resetAt} or enter your own Anthropic API key to continue.`,
                    resetAt: rateLimit.resetAt,
                    upgradeOption: true
                });
            }
            
            // Use the platform API key
            apiKey = process.env.ANTHROPIC_API_KEY;
            
            if (!apiKey) {
                return res.status(500).json({ error: 'Platform API key not configured' });
            }
            
            res.setHeader('X-Rate-Limit-Remaining', rateLimit.remaining);
        }
        
        // Initialize Anthropic client
        const anthropic = new Anthropic({ apiKey });
        
        // Make the assessment call
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{
                role: 'user',
                content: getAssessmentPrompt(question, articleText)
            }]
        });
        
        const assessment = message.content[0].text;
        
        // Extract scores from the response
        const realityMatch = assessment.match(/REALITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        const integrityMatch = assessment.match(/EPISTEMOLOGICAL INTEGRITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        
        return res.status(200).json({
            success: true,
            assessment,
            realityScore: realityMatch ? parseFloat(realityMatch[1]) : null,
            integrityScore: integrityMatch ? parseFloat(integrityMatch[1]) : null,
            question: question || 'Article Assessment',
            usingUserKey
        });
        
    } catch (error) {
        console.error('Assessment error:', error);
        
        if (error.status === 401) {
            return res.status(401).json({ 
                error: 'Invalid API key',
                message: 'The provided API key is invalid. Please check your key and try again.'
            });
        }
        
        return res.status(500).json({ 
            error: 'Assessment failed',
            message: error.message 
        });
    }
};
