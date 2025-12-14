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
        var initialAssessment = body.initialAssessment || '';
        var verifyAssessment = body.verifyAssessment || '';
        var initialScore = body.initialScore;
        var verifyScore = body.verifyScore;
        var userApiKey = body.userApiKey || '';
        
        if (!initialAssessment || !verifyAssessment) {
            return res.status(400).json({ error: 'Both initial and verify assessments required' });
        }
        
        var apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'No API key configured' });
        }
        
        var anthropic = new Anthropic({ apiKey: apiKey });
        
        var prompt = 'You are VERITAS ADJUDICATOR — an independent arbiter tasked with resolving divergent assessments.\n\n';
        prompt += '## CONTEXT\n';
        prompt += 'Two independent VERITAS assessors evaluated the same claim and reached different conclusions.\n';
        prompt += 'Your job is NOT to re-assess the claim, but to determine which assessment demonstrates better reasoning and source quality.\n\n';
        
        prompt += '## THE CLAIM BEING ASSESSED\n';
        prompt += question + '\n\n';
        
        prompt += '## ASSESSMENT A (Initial) — Reality Score: ' + initialScore + '\n';
        prompt += '---BEGIN ASSESSMENT A---\n';
        prompt += initialAssessment + '\n';
        prompt += '---END ASSESSMENT A---\n\n';
        
        prompt += '## ASSESSMENT B (Verify) — Reality Score: ' + verifyScore + '\n';
        prompt += '---BEGIN ASSESSMENT B---\n';
        prompt += verifyAssessment + '\n';
        prompt += '---END ASSESSMENT B---\n\n';
        
        prompt += '## YOUR TASK\n';
        prompt += 'Evaluate which assessment is superior based on:\n';
        prompt += '1. **Source Quality**: Which assessment cited more authoritative, relevant sources?\n';
        prompt += '2. **Reasoning Rigor**: Which assessment showed clearer logical progression?\n';
        prompt += '3. **Evidence Completeness**: Which assessment considered more relevant evidence?\n';
        prompt += '4. **Appropriate Confidence**: Which assessment calibrated uncertainty appropriately?\n\n';
        
        prompt += '## REQUIRED OUTPUT FORMAT\n\n';
        prompt += '**SOURCE QUALITY COMPARISON**\n';
        prompt += 'Assessment A sources: [brief evaluation]\n';
        prompt += 'Assessment B sources: [brief evaluation]\n';
        prompt += 'Winner on sources: [A or B]\n\n';
        
        prompt += '**REASONING COMPARISON**\n';
        prompt += 'Assessment A reasoning: [brief evaluation]\n';
        prompt += 'Assessment B reasoning: [brief evaluation]\n';
        prompt += 'Winner on reasoning: [A or B]\n\n';
        
        prompt += '**EVIDENCE COMPLETENESS**\n';
        prompt += 'Assessment A coverage: [brief evaluation]\n';
        prompt += 'Assessment B coverage: [brief evaluation]\n';
        prompt += 'Winner on completeness: [A or B]\n\n';
        
        prompt += '**FINAL ADJUDICATION**\n';
        prompt += 'WINNER: [A or B]\n';
        prompt += 'CONFIDENCE: [0.5 to 1.0 — how clearly superior is the winner?]\n';
        prompt += 'RECOMMENDED FINAL SCORE: [weighted score based on winner]\n';
        prompt += 'JUSTIFICATION: [2-3 sentences explaining the decision]\n';
        
        var message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }]
        });
        
        var adjudication = '';
        if (message.content && message.content[0] && message.content[0].text) {
            adjudication = message.content[0].text;
        }
        
        if (!adjudication) {
            return res.status(500).json({ error: 'No adjudication generated' });
        }
        
        // Parse the winner and confidence from the response
        var winnerMatch = adjudication.match(/WINNER:\s*(A|B)/i);
        var confidenceMatch = adjudication.match(/CONFIDENCE:\s*([0-9.]+)/i);
        var recommendedMatch = adjudication.match(/RECOMMENDED FINAL SCORE:\s*([+-]?\d+(?:\.\d+)?)/i);
        
        var winner = winnerMatch ? winnerMatch[1].toUpperCase() : null;
        var confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
        var recommendedScore = recommendedMatch ? parseFloat(recommendedMatch[1]) : null;
        
        // Calculate weighted final score if we have all the pieces
        var finalScore = null;
        if (winner && initialScore !== undefined && verifyScore !== undefined) {
            if (recommendedScore !== null) {
                finalScore = recommendedScore;
            } else {
                // Weight toward winner based on confidence
                var winnerScore = (winner === 'A') ? initialScore : verifyScore;
                var loserScore = (winner === 'A') ? verifyScore : initialScore;
                finalScore = (winnerScore * confidence) + (loserScore * (1 - confidence));
                finalScore = Math.round(finalScore * 10) / 10; // Round to 1 decimal
            }
        }
        
        return res.status(200).json({
            success: true,
            adjudication: adjudication,
            winner: winner,
            confidence: confidence,
            recommendedScore: recommendedScore,
            finalScore: finalScore,
            initialScore: initialScore,
            verifyScore: verifyScore
        });
        
    } catch (err) {
        console.error('Adjudication error:', err);
        return res.status(500).json({ error: 'Adjudication failed', message: err.message });
    }
};
