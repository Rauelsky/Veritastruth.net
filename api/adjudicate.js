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
        var initialRealityScore = body.initialRealityScore || body.initialScore;
        var verifyRealityScore = body.verifyRealityScore || body.verifyScore;
        var initialIntegrityScore = body.initialIntegrityScore;
        var verifyIntegrityScore = body.verifyIntegrityScore;
        var userApiKey = body.userApiKey || '';
        
        if (!initialAssessment || !verifyAssessment) {
            return res.status(400).json({ error: 'Both initial and verify assessments required' });
        }
        
        var apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'No API key configured' });
        }
        
        var anthropic = new Anthropic({ apiKey: apiKey });
        
        var prompt = 'You are VERITAS ADJUDICATOR — an independent arbiter resolving divergent assessments.\n\n';
        
        prompt += '## CONTEXT\n';
        prompt += 'Two independent VERITAS assessors evaluated the same claim and may have reached different conclusions.\n';
        prompt += 'Your job is to determine which assessment demonstrates better reasoning and source quality,\n';
        prompt += 'and to produce a FINAL authoritative score.\n\n';
        
        prompt += '## THE CLAIM BEING ASSESSED\n';
        prompt += question + '\n\n';
        
        prompt += '## ASSESSMENT A (Initial)\n';
        prompt += 'Reality Score: ' + initialRealityScore + '\n';
        if (initialIntegrityScore !== undefined) {
            prompt += 'Integrity Score: ' + initialIntegrityScore + '\n';
        }
        prompt += '---\n' + initialAssessment + '\n---\n\n';
        
        prompt += '## ASSESSMENT B (Verification)\n';
        prompt += 'Reality Score: ' + verifyRealityScore + '\n';
        if (verifyIntegrityScore !== undefined) {
            prompt += 'Integrity Score: ' + verifyIntegrityScore + '\n';
        }
        prompt += '---\n' + verifyAssessment + '\n---\n\n';
        
        prompt += '## YOUR TASK\n';
        prompt += 'Evaluate which assessment is superior based on:\n';
        prompt += '1. **Source Quality**: Which cited more authoritative, relevant sources?\n';
        prompt += '2. **Reasoning Rigor**: Which showed clearer logical progression?\n';
        prompt += '3. **Evidence Completeness**: Which considered more relevant evidence?\n';
        prompt += '4. **Appropriate Confidence**: Which calibrated uncertainty appropriately?\n\n';
        
        prompt += '## REQUIRED OUTPUT FORMAT\n\n';
        prompt += '```json\n';
        prompt += '{\n';
        prompt += '  "comparison": {\n';
        prompt += '    "sourceQuality": {\n';
        prompt += '      "assessmentA": "<brief evaluation>",\n';
        prompt += '      "assessmentB": "<brief evaluation>",\n';
        prompt += '      "winner": "<A|B|TIE>"\n';
        prompt += '    },\n';
        prompt += '    "reasoningRigor": {\n';
        prompt += '      "assessmentA": "<brief evaluation>",\n';
        prompt += '      "assessmentB": "<brief evaluation>",\n';
        prompt += '      "winner": "<A|B|TIE>"\n';
        prompt += '    },\n';
        prompt += '    "evidenceCompleteness": {\n';
        prompt += '      "assessmentA": "<brief evaluation>",\n';
        prompt += '      "assessmentB": "<brief evaluation>",\n';
        prompt += '      "winner": "<A|B|TIE>"\n';
        prompt += '    },\n';
        prompt += '    "confidenceCalibration": {\n';
        prompt += '      "assessmentA": "<brief evaluation>",\n';
        prompt += '      "assessmentB": "<brief evaluation>",\n';
        prompt += '      "winner": "<A|B|TIE>"\n';
        prompt += '    }\n';
        prompt += '  },\n';
        prompt += '  "adjudication": {\n';
        prompt += '    "winner": "<A|B>",\n';
        prompt += '    "confidence": <0.5 to 1.0>,\n';
        prompt += '    "finalRealityScore": <-10 to +10>,\n';
        prompt += '    "finalIntegrityScore": <-1.0 to +1.0>,\n';
        prompt += '    "justification": "<2-3 sentences>"\n';
        prompt += '  }\n';
        prompt += '}\n';
        prompt += '```\n\n';
        
        prompt += 'After JSON, provide a brief narrative explanation of your adjudication.\n';
        
        var message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 6000,
            messages: [{ role: 'user', content: prompt }]
        });
        
        var adjudication = '';
        for (var i = 0; i < message.content.length; i++) {
            if (message.content[i].type === 'text') {
                adjudication += message.content[i].text;
            }
        }
        
        if (!adjudication) {
            return res.status(500).json({ error: 'No adjudication generated' });
        }
        
        // Parse structured data
        var structured = null;
        var winner = null;
        var confidence = 0.5;
        var finalRealityScore = null;
        var finalIntegrityScore = null;
        
        var jsonMatch = adjudication.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                structured = JSON.parse(jsonMatch[1]);
                if (structured.adjudication) {
                    winner = structured.adjudication.winner;
                    confidence = structured.adjudication.confidence || 0.5;
                    finalRealityScore = structured.adjudication.finalRealityScore;
                    finalIntegrityScore = structured.adjudication.finalIntegrityScore;
                }
            } catch (e) {
                console.error('Adjudicate JSON parse error:', e);
            }
        }
        
        // Fallback regex extraction
        if (!winner) {
            var winnerMatch = adjudication.match(/["\']?winner["\']?\s*:\s*["\']?(A|B)["\']?/i);
            if (winnerMatch) winner = winnerMatch[1].toUpperCase();
        }
        
        if (confidence === 0.5) {
            var confidenceMatch = adjudication.match(/["\']?confidence["\']?\s*:\s*([0-9.]+)/i);
            if (confidenceMatch) confidence = parseFloat(confidenceMatch[1]);
        }
        
        if (finalRealityScore === null) {
            var scoreMatch = adjudication.match(/["\']?finalRealityScore["\']?\s*:\s*([+-]?\d+)/i);
            if (scoreMatch) finalRealityScore = parseInt(scoreMatch[1]);
        }
        
        // Calculate weighted score if not provided
        if (finalRealityScore === null && winner && initialRealityScore !== undefined && verifyRealityScore !== undefined) {
            var winnerScore = (winner === 'A') ? initialRealityScore : verifyRealityScore;
            var loserScore = (winner === 'A') ? verifyRealityScore : initialRealityScore;
            finalRealityScore = Math.round((winnerScore * confidence) + (loserScore * (1 - confidence)));
        }
        
        return res.status(200).json({
            success: true,
            adjudication: adjudication,
            structured: structured,
            winner: winner,
            confidence: confidence,
            finalRealityScore: finalRealityScore,
            finalIntegrityScore: finalIntegrityScore,
            initialRealityScore: initialRealityScore,
            verifyRealityScore: verifyRealityScore,
            initialIntegrityScore: initialIntegrityScore,
            verifyIntegrityScore: verifyIntegrityScore
        });
        
    } catch (err) {
        console.error('Adjudication error:', err);
        return res.status(500).json({ error: 'Adjudication failed', message: err.message });
    }
};
