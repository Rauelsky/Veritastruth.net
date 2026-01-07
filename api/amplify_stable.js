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
        var initialAssessment = body.initialAssessment || body.assessment || '';
        var realityScore = body.realityScore;
        var integrityScore = body.integrityScore;
        var userApiKey = body.userApiKey || '';
        
        if (!initialAssessment) {
            return res.status(400).json({ error: 'No assessment provided to amplify' });
        }
        
        var apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'No API key configured' });
        }
        
        var anthropic = new Anthropic({ apiKey: apiKey });
        
        var now = new Date();
        var currentDate = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        var prompt = '═══════════════════════════════════════════════════════════════════\n';
        prompt += '🚨 MANDATORY PREFLIGHT TEMPORAL CHECK - READ FIRST 🚨\n';
        prompt += '═══════════════════════════════════════════════════════════════════\n\n';
        
        prompt += '🌐 **YOU HAVE WEB SEARCH AVAILABLE**: You have been given the web_search tool.\n';
        prompt += '   - You CAN search the internet for current information\n';
        prompt += '   - You MUST use it for temporal questions\n';
        prompt += '   - Do NOT say "I cannot access the internet" - YOU CAN\n\n';
        
        prompt += '**TODAY IS: ' + currentDate + '**\n\n';
        
        prompt += 'When amplifying an assessment that involves current events, recent developments,\n';
        prompt += 'or time-sensitive information, you MUST verify current status with web_search\n';
        prompt += 'before challenging assumptions. Do not assume training data is current.\n\n';
        
        prompt += '═══════════════════════════════════════════════════════════════════\n\n';
        
        prompt += 'You are VERITAS AMPLIFY — performing a deep epistemic stress-test of an initial assessment.\n\n';
        
        prompt += '## ORIGINAL CLAIM/QUESTION\n';
        prompt += question + '\n\n';
        
        prompt += '## INITIAL ASSESSMENT\n';
        if (realityScore !== undefined) {
            prompt += 'Reality Score: ' + realityScore + '\n';
        }
        if (integrityScore !== undefined) {
            prompt += 'Integrity Score: ' + integrityScore + '\n';
        }
        prompt += '\n' + initialAssessment + '\n\n';
        
        prompt += '## YOUR TASK: AMPLIFIED ANALYSIS\n';
        prompt += 'Provide a deeper analysis that:\n';
        prompt += '1. CHALLENGES assumptions in the initial assessment\n';
        prompt += '2. EXPLORES alternative interpretations of the same evidence\n';
        prompt += '3. IDENTIFIES blind spots — what might be missing?\n';
        prompt += '4. STRESS-TESTS conclusions — how robust are they?\n';
        prompt += '5. CONSIDERS what would change the assessment significantly\n\n';
        
        prompt += '## REQUIRED OUTPUT FORMAT\n\n';
        prompt += '```json\n';
        prompt += '{\n';
        prompt += '  "amplificationSummary": "<2-3 sentences on key findings>",\n';
        prompt += '  "challengedAssumptions": ["<assumption 1>", "<assumption 2>", ...],\n';
        prompt += '  "alternativeInterpretations": ["<interpretation 1>", ...],\n';
        prompt += '  "blindSpots": ["<blind spot 1>", ...],\n';
        prompt += '  "wouldChangeAssessment": ["<what would shift scores>", ...],\n';
        prompt += '  "epistemicVulnerabilities": ["<where most likely wrong>", ...],\n';
        prompt += '  "confidenceAdjustment": {\n';
        prompt += '    "direction": "<up|down|unchanged>",\n';
        prompt += '    "magnitude": "<slight|moderate|significant>",\n';
        prompt += '    "reason": "<explanation>"\n';
        prompt += '  },\n';
        prompt += '  "bottomLine": "<final amplified assessment>"\n';
        prompt += '}\n';
        prompt += '```\n\n';
        
        prompt += 'After JSON, provide a narrative explanation of your amplified analysis.\n';
        
        var message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            tools: [{
                type: 'web_search_20250305',
                name: 'web_search'
            }],
            messages: [{ role: 'user', content: prompt }]
        });
        
        var amplified = '';
        for (var i = 0; i < message.content.length; i++) {
            if (message.content[i].type === 'text') {
                amplified += message.content[i].text;
            }
        }
        
        if (!amplified) {
            return res.status(500).json({ error: 'No amplified analysis generated' });
        }
        
        // Parse structured data if available
        var structured = null;
        var jsonMatch = amplified.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                structured = JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.error('Amplify JSON parse error:', e);
            }
        }
        
        return res.status(200).json({
            success: true,
            amplified: amplified,
            structured: structured,
            originalQuestion: question,
            originalRealityScore: realityScore,
            originalIntegrityScore: integrityScore
        });
        
    } catch (err) {
        console.error('Amplify error:', err);
        return res.status(500).json({ error: 'Amplification failed', message: err.message });
    }
};
