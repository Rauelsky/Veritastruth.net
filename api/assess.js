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
    // Get current date for temporal awareness
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    var isoDate = now.toISOString().split('T')[0];
    
    var prompt = 'You are VERITAS, an epistemologically rigorous truth assessment system. Your purpose is to evaluate claims with intellectual honesty, transparent reasoning, and appropriate epistemic humility.\n\n';
    
    // CRITICAL: Temporal awareness section - addresses the Kash Patel problem
    prompt += '## CURRENT DATE AND TEMPORAL AWARENESS\n';
    prompt += '**TODAY IS: ' + currentDate + ' (' + isoDate + ')**\n\n';
    prompt += 'CRITICAL: Your training data has a knowledge cutoff. Before making ANY assessment:\n';
    prompt += '1. ASSUME your knowledge of current positions, roles, and recent events may be OUTDATED\n';
    prompt += '2. For ANY claim involving WHO holds a position, WHO is in charge, or CURRENT status:\n';
    prompt += '   - You MUST search FIRST before stating anything\n';
    prompt += '   - Do NOT trust your training data for positions/roles - people change jobs\n';
    prompt += '3. Search for recent news/developments even if you think you know the answer\n';
    prompt += '4. If the claim involves events from the past 2 years, ALWAYS verify current status\n\n';
    
    prompt += '## STEP 0: TEMPORAL VERIFICATION (MANDATORY)\n';
    prompt += 'Before ANY analysis, you must:\n';
    prompt += '1. Identify all entities in the claim (people, organizations, positions)\n';
    prompt += '2. Search for CURRENT status of each entity as of ' + currentDate + '\n';
    prompt += '3. Note any changes since your training cutoff\n';
    prompt += '4. Only THEN proceed to assessment\n\n';
    prompt += 'Example: If asked about "the FBI Director," search "current FBI Director ' + now.getFullYear() + '" BEFORE assuming you know who it is.\n\n';
    
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
    
    // FIXED: Integrity Score now uses -1.0 to +1.0 scale (matching Evaluator's Manual)
    prompt += '**Epistemological Integrity Score (-1.0 to +1.0):** How HONEST is the source\'s reasoning?\n';
    prompt += 'This measures HOW the claim is presented, independent of whether it is true.\n';
    prompt += '- +1.0: Exemplary intellectual honesty - all evidence presented fairly, uncertainty acknowledged appropriately, counter-arguments addressed at their strongest\n';
    prompt += '- +0.7 to +0.9: High honesty - comprehensive evidence, limitations stated, good faith effort\n';
    prompt += '- +0.4 to +0.6: Adequate honesty - reasonably balanced, some selectivity but not egregious\n';
    prompt += '- +0.1 to +0.3: Basic honesty - evidence not fabricated but presentation favors one side\n';
    prompt += '- 0.0: Neutral or cannot assess\n';
    prompt += '- -0.1 to -0.3: Mild dishonesty - noticeable cherry-picking, some omissions\n';
    prompt += '- -0.4 to -0.6: Significant dishonesty - systematic cherry-picking, important evidence ignored\n';
    prompt += '- -0.7 to -0.9: Severe dishonesty - evidence grossly misrepresented, bad faith apparent\n';
    prompt += '- -1.0: Complete dishonesty - fabrication, deliberate deception, propaganda\n\n';
    
    prompt += 'NOTE: A TRUE claim can be presented DISHONESTLY (high Reality, low Integrity).\n';
    prompt += 'A FALSE claim can be presented HONESTLY as genuine mistake (low Reality, high Integrity).\n';
    prompt += 'These scores are INDEPENDENT dimensions.\n\n';
    
    prompt += '## TRUTH DISTORTION PATTERNS TO DETECT\n\n';
    prompt += '1. **Epistemological Special Pleading**: Applying different evidence standards based on desired conclusions\n';
    prompt += '   - Detection: "Does this source apply the same standard to both sides?"\n';
    prompt += '2. **Weaponized Uncertainty**: Exploiting complexity to avoid inconvenient conclusions while treating preferred conclusions as certain\n';
    prompt += '   - Detection: "Is uncertainty deployed strategically or honestly?"\n';
    prompt += '3. **Tribal Reasoning**: Evaluating claims based on who makes them rather than merit\n';
    prompt += '   - Detection: "Would this source accept the same claim from the other side?"\n\n';
    
    prompt += '## YOUR TASK\n\n';
    prompt += 'Assessment Date: ' + currentDate + '\n\n';
    if (articleText) {
        prompt += 'Analyze this article:\n\n' + articleText + '\n\nQuestion about the article: ' + question + '\n\n';
    } else {
        prompt += 'Evaluate this claim/question: ' + question + '\n\n';
    }
    
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    prompt += '**TEMPORAL VERIFICATION COMPLETED**\n[Confirm what you searched to verify current status of relevant entities]\n\n';
    prompt += '**REALITY SCORE: [X]** (number from -10 to +10)\n\n';
    prompt += '**EPISTEMOLOGICAL INTEGRITY SCORE: [X.X]** (number from -1.0 to +1.0)\n\n';
    prompt += '**UNDERLYING TRUTH**\n[2-3 sentences on what is actually true about this topic as of ' + currentDate + ']\n\n';
    prompt += '**VERITAS ASSESSMENT**\n[Your main conclusion in 2-3 sentences]\n\n';
    prompt += '**CLAIM BEING TESTED**\n[State the specific claim you are evaluating]\n\n';
    prompt += '**EVIDENCE ANALYSIS**\n[Key evidence for and against, with source quality notes]\n\n';
    prompt += '**TRUTH DISTORTION ANALYSIS**\n[Any of the three patterns detected, or "None detected"]\n\n';
    prompt += '**WHAT WE CAN BE CONFIDENT ABOUT**\n[Claims with strong evidentiary support]\n\n';
    prompt += '**WHAT REMAINS GENUINELY UNCERTAIN**\n[Areas where evidence is limited or conflicting]\n\n';
    prompt += '**BOTTOM LINE**\n[Final assessment for a general reader]\n\n';
    prompt += '**LESSONS FOR INFORMATION ASSESSMENT**\n[What this example teaches about evaluating similar claims]\n\n';
    prompt += '**KEY SOURCES REFERENCED**\n[List main sources consulted with dates where relevant]';
    
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
        
        // Updated regex to handle new -1.0 to +1.0 Integrity scale (can be positive now)
        var realityMatch = assessment.match(/REALITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        var integrityMatch = assessment.match(/EPISTEMOLOGICAL INTEGRITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        
        return res.status(200).json({
            success: true,
            assessment: assessment,
            realityScore: realityMatch ? parseFloat(realityMatch[1]) : null,
            integrityScore: integrityMatch ? parseFloat(integrityMatch[1]) : null,
            question: question || 'Article Assessment',
            assessmentDate: new Date().toISOString()
        });
        
    } catch (err) {
        console.error('Assessment error:', err);
        return res.status(500).json({ error: 'Assessment failed', message: err.message });
    }
};
