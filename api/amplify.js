const Anthropic = require('@anthropic-ai/sdk');

function getAmplifiedPrompt(question, assessment) {
    return `You are VERITAS performing an AMPLIFIED ASSESSMENT - a deeper epistemic analysis of an initial assessment.

## ORIGINAL QUESTION/CLAIM
${question}

## INITIAL ASSESSMENT
${assessment}

## YOUR TASK
Provide a deeper analysis that challenges and enriches the initial assessment. Be genuinely critical - look for what might have been missed, oversimplified, or wrong.

## REQUIRED OUTPUT FORMAT

**SUMMARY**
[2-3 sentences summarizing the key insight from this amplified analysis]

**MISSING PERSPECTIVES**
[What viewpoints, stakeholders, or frameworks weren't adequately considered?]

**ALTERNATIVE FRAMINGS**
[How might someone reasonably disagree with the initial assessment? What's the strongest counter-argument?]

**WHAT WOULD CHANGE THIS ASSESSMENT**
[What new evidence or information would shift the scores significantly?]

**UNCERTAINTY CATEGORIZATION**
[Break down: What's genuinely unknown vs. contested vs. well-established?]

**EPISTEMIC HUMILITY CHECK**
[Where might the initial assessment be overconfident? What assumptions is it making?]

**BOTTOM LINE**
[Final refined conclusion after this deeper analysis]`;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { question, assessment, userApiKey } = req.body;
        if (!assessment) return res.status(400).json({ error: 'No assessment to amplify' });
        
        let apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
        
        const anthropic = new Anthropic({ apiKey });
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{ role: 'user', content: getAmplifiedPrompt(question, assessment) }]
        });
        
        return res.status(200).json({
            success: true,
            amplified: message.content[0].text
        });
    } catch (error) {
        return res.status(500).json({ error: 'Amplification failed', message: error.message });
    }
};
