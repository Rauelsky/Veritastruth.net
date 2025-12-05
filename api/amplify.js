const Anthropic = require('@anthropic-ai/sdk');

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
        const { question, assessment, userApiKey } = req.body || {};
        
        if (!assessment) {
            return res.status(400).json({ error: 'No assessment provided to amplify' });
        }
        
        let apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }
        
        const anthropic = new Anthropic({ apiKey });
        
        const prompt = `You are VERITAS performing an AMPLIFIED ASSESSMENT - a deeper epistemic analysis that challenges and extends an initial assessment.

## ORIGINAL QUESTION/CLAIM
${question}

## INITIAL ASSESSMENT
${assessment}

## YOUR TASK
Provide a deeper analysis that:
1. Challenges assumptions in the initial assessment
2. Explores alternative interpretations
3. Identifies what might be missing
4. Stress-tests the conclusions

## REQUIRED OUTPUT FORMAT

**AMPLIFICATION SUMMARY**
[2-3 sentences on what this deeper analysis reveals]

**MISSING PERSPECTIVES**
[What viewpoints or evidence sources weren't adequately considered?]

**ALTERNATIVE FRAMINGS**
[How might someone with different priors interpret the same evidence?]

**WHAT WOULD CHANGE THE ASSESSMENT**
[What new evidence or arguments could shift the scores significantly?]

**EPISTEMIC HUMILITY CHECK**
[Where is the initial assessment most vulnerable to being wrong?]

**BOTTOM LINE**
[Final amplified assessment - does deeper analysis confirm, modify, or challenge the initial assessment?]`;

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }]
        });
        
        const amplified = message.content[0]?.text || '';
        
        if (!amplified) {
            return res.status(500).json({ error: 'No amplified analysis generated' });
        }
        
        return res.status(200).json({
            success: true,
            amplified
        });
        
    } catch (error) {
        console.error('Amplify error:', error);
        return res.status(500).json({ 
            error: 'Amplification failed', 
            message: error.message 
        });
    }
};
