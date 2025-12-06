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
        var body = req.body;
        if (!body) {
            return res.status(400).json({ error: 'No request body' });
        }
        
        var question = body.question || '';
        var assessment = body.assessment || '';
        var userApiKey = body.userApiKey || '';
        
        if (!assessment) {
            return res.status(400).json({ error: 'No assessment provided to amplify' });
        }
        
        var apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'No API key configured' });
        }
        
        var anthropic = new Anthropic({ apiKey: apiKey });
        
        var prompt = 'You are VERITAS performing an AMPLIFIED ASSESSMENT - a deeper epistemic analysis that challenges and extends an initial assessment.\n\n';
        prompt += '## ORIGINAL QUESTION/CLAIM\n' + question + '\n\n';
        prompt += '## INITIAL ASSESSMENT\n' + assessment + '\n\n';
        prompt += '## YOUR TASK\n';
        prompt += 'Provide a deeper analysis that:\n';
        prompt += '1. Challenges assumptions in the initial assessment\n';
        prompt += '2. Explores alternative interpretations\n';
        prompt += '3. Identifies what might be missing\n';
        prompt += '4. Stress-tests the conclusions\n\n';
        prompt += '## REQUIRED OUTPUT FORMAT\n\n';
        prompt += '**AMPLIFICATION SUMMARY**\n[2-3 sentences on what this deeper analysis reveals]\n\n';
        prompt += '**MISSING PERSPECTIVES**\n[What viewpoints or evidence sources were not adequately considered?]\n\n';
        prompt += '**ALTERNATIVE FRAMINGS**\n[How might someone with different priors interpret the same evidence?]\n\n';
        prompt += '**WHAT WOULD CHANGE THE ASSESSMENT**\n[What new evidence or arguments could shift the scores significantly?]\n\n';
        prompt += '**EPISTEMIC HUMILITY CHECK**\n[Where is the initial assessment most vulnerable to being wrong?]\n\n';
        prompt += '**BOTTOM LINE**\n[Final amplified assessment - does deeper analysis confirm, modify, or challenge the initial assessment?]';
        
        var message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }]
        });
        
        var amplified = '';
        if (message.content && message.content[0] && message.content[0].text) {
            amplified = message.content[0].text;
        }
        
        if (!amplified) {
            return res.status(500).json({ error: 'No amplified analysis generated' });
        }
        
        return res.status(200).json({
            success: true,
            amplified: amplified
        });
        
    } catch (err) {
        console.error('Amplify error:', err);
        return res.status(500).json({ error: 'Amplification failed', message: err.message });
    }
};
