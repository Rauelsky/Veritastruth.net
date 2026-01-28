const Anthropic = require('@anthropic-ai/sdk');

/**
 * VERITAS PREFLIGHT SEARCH
 * ========================
 * 
 * PURPOSE:
 * Performs immediate web search BEFORE any track classification or assessment.
 * Ensures Claude never forms opinions from training data before checking current reality.
 * 
 * PHILOSOPHY:
 * "Search first, always. Training data is a plausibility filter, not a source."
 * 
 * This endpoint is called by veracity.html the moment a user submits a claim.
 * Results are passed to track suggestion generation and subsequent assessments.
 * 
 * BULLETPROOF FROM ARROGANCE:
 * - Claude cannot say "that's news to me" if it searches first
 * - Claude cannot be confident about things it hasn't verified
 * - Training data only flags implausible search results, never serves as source
 */

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const startTime = Date.now();
    
    try {
        const { claim, language = 'en' } = req.body;
        
        if (!claim || !claim.trim()) {
            return res.status(400).json({ error: 'No claim provided' });
        }
        
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }
        
        const anthropic = new Anthropic({ apiKey });
        
        // Current date for context
        const now = new Date();
        const currentDate = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Build the preflight search prompt
        const prompt = buildPreflightPrompt(claim, currentDate, language);
        
        // Execute search with timeout protection
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            tools: [{
                type: 'web_search_20250305',
                name: 'web_search'
            }],
            messages: [{ role: 'user', content: prompt }]
        });
        
        // Extract response
        let searchSummary = '';
        let searchPerformed = false;
        
        for (const block of message.content) {
            if (block.type === 'text') {
                searchSummary += block.text;
            }
            if (block.type === 'tool_use' && block.name === 'web_search') {
                searchPerformed = true;
            }
        }
        
        // Parse structured response if present
        let structured = null;
        const jsonMatch = searchSummary.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                structured = JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.error('Preflight JSON parse error:', e);
            }
        }
        
        const elapsedTime = Date.now() - startTime;
        
        return res.status(200).json({
            success: true,
            searchPerformed,
            elapsedMs: elapsedTime,
            summary: searchSummary,
            structured: structured,
            claim: claim,
            timestamp: now.toISOString()
        });
        
    } catch (err) {
        console.error('Preflight search error:', err);
        const elapsedTime = Date.now() - startTime;
        
        // Return graceful fallback - don't block the user
        return res.status(200).json({
            success: false,
            searchPerformed: false,
            elapsedMs: elapsedTime,
            error: err.message,
            fallback: true,
            message: 'Preflight search unavailable. Proceeding with standard verification.'
        });
    }
};

function buildPreflightPrompt(claim, currentDate, language) {
    let prompt = '';
    
    prompt += '═══════════════════════════════════════════════════════════════════\n';
    prompt += 'VERITAS PREFLIGHT SEARCH — GATHER FACTS BEFORE ASSESSMENT\n';
    prompt += '═══════════════════════════════════════════════════════════════════\n\n';
    
    prompt += `**TODAY IS: ${currentDate}**\n\n`;
    
    prompt += 'You are performing a PREFLIGHT SEARCH for VERITAS. Your job is to:\n';
    prompt += '1. Search the web for current, factual information about this claim\n';
    prompt += '2. Report what you find — do NOT assess or judge the claim yet\n';
    prompt += '3. Identify what is verifiable vs. what is opinion/interpretation\n\n';
    
    prompt += '**CRITICAL INSTRUCTIONS:**\n';
    prompt += '- You MUST use web_search. This is mandatory.\n';
    prompt += '- Do NOT rely on training data. Search first.\n';
    prompt += '- Do NOT say "I am not aware of" or "that\'s news to me" — SEARCH.\n';
    prompt += '- Report facts neutrally. Assessment comes later.\n';
    prompt += '- If the claim involves a person, event, or status — verify current state.\n\n';
    
    prompt += '**THE CLAIM TO RESEARCH:**\n';
    prompt += `"${claim}"\n\n`;
    
    prompt += '**SEARCH STRATEGY:**\n';
    prompt += '- Search for the core factual elements of the claim\n';
    prompt += '- If it involves a person: check their current status, recent news\n';
    prompt += '- If it involves an event: check if it happened, when, what sources report\n';
    prompt += '- If it involves a position/role: check who currently holds it\n';
    prompt += '- If it involves a policy/law: check current status\n\n';
    
    prompt += '**REQUIRED OUTPUT FORMAT:**\n\n';
    prompt += '```json\n';
    prompt += '{\n';
    prompt += '  "claimType": "<factual|opinion|mixed|unclear>",\n';
    prompt += '  "searchesPerformed": ["<search query 1>", "<search query 2>", ...],\n';
    prompt += '  "keyFactsFound": [\n';
    prompt += '    "<Fact 1 with source>",\n';
    prompt += '    "<Fact 2 with source>",\n';
    prompt += '    "..."\n';
    prompt += '  ],\n';
    prompt += '  "currentStatus": "<What is the current verified status relevant to this claim?>",\n';
    prompt += '  "sourcesConsulted": [\n';
    prompt += '    {"name": "<source>", "bias": "<left|center|right|unknown>", "finding": "<what they report>"},\n';
    prompt += '    "..."\n';
    prompt += '  ],\n';
    prompt += '  "unverifiedElements": ["<aspects of claim that could not be verified>"],\n';
    prompt += '  "contextForAssessment": "<Brief summary of what the assessment track should know>"\n';
    prompt += '}\n';
    prompt += '```\n\n';
    
    prompt += 'After the JSON, provide a brief narrative summary of what you found.\n';
    prompt += 'Remember: GATHER FACTS. Do not judge the claim. Assessment comes next.\n';
    
    return prompt;
}
