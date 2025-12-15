const Anthropic = require('@anthropic-ai/sdk');

// ============================================
// RATE LIMITING (5 free per day per IP)
// ============================================
const rateLimitMap = new Map();
const FREE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

function getRateLimitKey(req) {
    var ip = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
    return 'rate:' + ip;
}

function checkRateLimit(key) {
    var now = Date.now();
    var record = rateLimitMap.get(key);
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

// ============================================
// PROMPT BUILDER - VERIFICATION (Independent)
// ============================================
function buildPrompt(question, articleText, track, claimType) {
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    var isoDate = now.toISOString().split('T')[0];
    
    var prompt = 'You are VERITAS VERIFICATION, an INDEPENDENT second evaluator. Your purpose is to provide a FRESH, INDEPENDENT evaluation using the identical methodology.\n\n';
    
    // CRITICAL: Independence instruction
    prompt += '## CRITICAL: INDEPENDENT VERIFICATION REQUIREMENT\n';
    prompt += 'You are performing a completely INDEPENDENT verification assessment:\n';
    prompt += '- Do NOT assume any prior assessment exists\n';
    prompt += '- Evaluate the claim FRESH using your own analysis\n';
    prompt += '- Your scores should reflect YOUR analysis alone\n';
    prompt += '- You may reach different conclusions — this is valuable\n';
    prompt += '- Your role is independent confirmation, not validation of a prior opinion\n\n';
    
    // ============================================
    // TEMPORAL AWARENESS
    // ============================================
    prompt += '## CURRENT DATE AND TEMPORAL AWARENESS\n';
    prompt += '**TODAY IS: ' + currentDate + ' (' + isoDate + ')**\n\n';
    prompt += 'CRITICAL: Your training data has a knowledge cutoff. Before making ANY assessment:\n';
    prompt += '1. ASSUME your knowledge may be OUTDATED\n';
    prompt += '2. For claims about current positions/status: SEARCH FIRST\n';
    prompt += '3. Search for recent news even if you think you know the answer\n\n';
    
    // ============================================
    // TRACK-SPECIFIC CONTEXT
    // ============================================
    if (track === 'b' && claimType) {
        prompt += '## CLAIM TYPE CONTEXT\n';
        prompt += 'This is a Track B (Subjective/Complex) assessment.\n';
        prompt += 'Claim Type: ' + claimType.toUpperCase() + '\n\n';
        
        if (claimType === 'person') {
            prompt += 'This claim relates to a PERSON - their actions, character, or behavior.\n';
            prompt += 'Focus on: verifiable actions, documented statements, credible witness accounts.\n\n';
        } else if (claimType === 'thing') {
            prompt += 'This claim relates to a THING - something that exists or is rumored.\n';
            prompt += 'Focus on: physical evidence, scientific documentation, expert verification.\n\n';
        } else if (claimType === 'event') {
            prompt += 'This claim relates to an EVENT or CONDITION.\n';
            prompt += 'Focus on: contemporaneous documentation, multiple independent accounts.\n\n';
        } else if (claimType === 'prediction') {
            prompt += 'This claim is a PREDICTION about a future outcome.\n';
            prompt += 'Assess the REASONING and EVIDENCE behind the prediction.\n\n';
        }
    } else {
        prompt += '## ASSESSMENT TYPE\n';
        prompt += 'This is a Track A (Factual) assessment.\n\n';
    }
    
    // ============================================
    // FOUR-FACTOR FRAMEWORK (Reality)
    // ============================================
    prompt += '## REALITY ASSESSMENT FRAMEWORK\n\n';
    prompt += 'Four factors weighted to derive Reality Score (-10 to +10):\n';
    prompt += '- Evidence Quality (EQ): 40% — strength of evidence\n';
    prompt += '- Epistemological Soundness (ES): 30% — rigor of reasoning\n';
    prompt += '- Source Reliability (SR): 20% — credibility of sources\n';
    prompt += '- Logical Coherence (LC): 10% — validity of arguments\n\n';
    prompt += 'Score = (EQ × 0.40) + (ES × 0.30) + (SR × 0.20) + (LC × 0.10)\n';
    prompt += 'Evidence Ceiling: Final score cannot exceed EQ + 2\n\n';
    
    // ============================================
    // INTEGRITY 2.0 FRAMEWORK
    // ============================================
    prompt += '## INTEGRITY 2.0 FRAMEWORK\n\n';
    prompt += 'Integrity Score (-1.0 to +1.0) measures HOW claims are presented.\n';
    prompt += 'Three dimensions at 33% each:\n\n';
    
    prompt += '### 1. Observable Integrity (33%)\n';
    prompt += 'Y/N/P checklist: Sources Cited, Limitations Acknowledged, Counter-Arguments Addressed, Fallacies Present\n\n';
    
    prompt += '### 2. Comparative Integrity (33%)\n';
    prompt += 'Percentile ranking vs quality discourse, baseline comparison, gaps vs best-in-class\n\n';
    
    prompt += '### 3. Bias Integrity (33%)\n';
    prompt += 'Inflammatory language, playbook patterns, inaccuracies, one-sided framing\n\n';
    
    // ============================================
    // YOUR TASK
    // ============================================
    prompt += '## YOUR TASK\n\n';
    prompt += 'Assessment Date: ' + currentDate + '\n\n';
    
    if (articleText) {
        prompt += 'Analyze this article:\n\n---\n' + articleText + '\n---\n\n';
        prompt += 'Question about the article: ' + question + '\n\n';
    } else {
        prompt += 'Evaluate this claim/question: ' + question + '\n\n';
    }
    
    // ============================================
    // REQUIRED OUTPUT FORMAT
    // ============================================
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    prompt += 'Provide your response in TWO parts:\n\n';
    prompt += '### PART 1: STRUCTURED DATA (JSON)\n';
    prompt += 'Begin with a JSON block wrapped in ```json tags:\n\n';
    prompt += '```json\n';
    prompt += '{\n';
    prompt += '  "realityScore": <integer -10 to +10>,\n';
    prompt += '  "integrityScore": <float -1.0 to +1.0>,\n';
    prompt += '  "realityFactors": {\n';
    prompt += '    "evidenceQuality": { "score": <-10 to +10>, "explanation": "<1-2 sentences>" },\n';
    prompt += '    "epistemologicalSoundness": { "score": <-10 to +10>, "explanation": "<1-2 sentences>" },\n';
    prompt += '    "sourceReliability": { "score": <-10 to +10>, "explanation": "<1-2 sentences>" },\n';
    prompt += '    "logicalCoherence": { "score": <-10 to +10>, "explanation": "<1-2 sentences>" }\n';
    prompt += '  },\n';
    prompt += '  "integrity": {\n';
    prompt += '    "observable": {\n';
    prompt += '      "sourcesCited": "<Y|P|N>",\n';
    prompt += '      "sourcesCitedEvidence": "<evidence>",\n';
    prompt += '      "limitationsAcknowledged": "<Y|P|N>",\n';
    prompt += '      "limitationsEvidence": "<evidence>",\n';
    prompt += '      "counterArgumentsAddressed": "<Y|P|N>",\n';
    prompt += '      "counterArgumentsEvidence": "<evidence>",\n';
    prompt += '      "fallaciesPresent": "<Y|N>",\n';
    prompt += '      "fallaciesEvidence": "<evidence>",\n';
    prompt += '      "score": <-1.0 to +1.0>\n';
    prompt += '    },\n';
    prompt += '    "comparative": {\n';
    prompt += '      "percentile": <0-100>,\n';
    prompt += '      "baseline": "<description>",\n';
    prompt += '      "gaps": ["<gap>", ...],\n';
    prompt += '      "score": <-1.0 to +1.0>\n';
    prompt += '    },\n';
    prompt += '    "bias": {\n';
    prompt += '      "inflammatoryLanguage": "<assessment>",\n';
    prompt += '      "playbookPatterns": [],\n';
    prompt += '      "inaccuracies": [],\n';
    prompt += '      "oneSidedFraming": "<assessment>",\n';
    prompt += '      "score": <-1.0 to +1.0>\n';
    prompt += '    }\n';
    prompt += '  },\n';
    prompt += '  "underlyingReality": {\n';
    prompt += '    "coreFinding": "<what is true>",\n';
    prompt += '    "howWeKnow": "<evidence basis>",\n';
    prompt += '    "whyItMatters": "<significance>"\n';
    prompt += '  },\n';
    prompt += '  "sources": ["<source>", ...]\n';
    prompt += '}\n';
    prompt += '```\n\n';
    
    prompt += '### PART 2: NARRATIVE ASSESSMENT\n';
    prompt += 'After JSON, provide human-readable sections:\n';
    prompt += '**CLAIM BEING TESTED**, **VERITAS VERIFICATION ASSESSMENT**, **EVIDENCE ANALYSIS**, ';
    prompt += '**WHAT WE CAN BE CONFIDENT ABOUT**, **WHAT REMAINS UNCERTAIN**, **BOTTOM LINE**\n';
    
    return prompt;
}

// ============================================
// RESPONSE PARSER
// ============================================
function parseAssessmentResponse(assessment) {
    var result = {
        realityScore: null,
        integrityScore: null,
        realityFactors: null,
        integrity: null,
        underlyingReality: null,
        sources: null,
        narrative: assessment
    };
    
    var jsonMatch = assessment.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            var parsed = JSON.parse(jsonMatch[1]);
            result.realityScore = parsed.realityScore;
            result.integrityScore = parsed.integrityScore;
            result.realityFactors = parsed.realityFactors;
            result.integrity = parsed.integrity;
            result.underlyingReality = parsed.underlyingReality;
            result.sources = parsed.sources;
        } catch (e) {
            console.error('JSON parse error:', e);
        }
    }
    
    // Fallback regex extraction
    if (result.realityScore === null) {
        var realityMatch = assessment.match(/["\']?realityScore["\']?\s*:\s*([+-]?\d+)/i) ||
                          assessment.match(/FINAL REALITY SCORE:\s*\[?([+-]?\d+)\]?/i);
        if (realityMatch) result.realityScore = parseInt(realityMatch[1]);
    }
    
    if (result.integrityScore === null) {
        var integrityMatch = assessment.match(/["\']?integrityScore["\']?\s*:\s*([+-]?\d+\.?\d*)/i) ||
                            assessment.match(/FINAL INTEGRITY SCORE:\s*\[?([+-]?\d+\.?\d*)\]?/i);
        if (integrityMatch) result.integrityScore = parseFloat(integrityMatch[1]);
    }
    
    return result;
}

// ============================================
// MAIN HANDLER
// ============================================
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
        var track = body.track || 'a';
        var claimType = body.claimType || null;
        var userApiKey = body.userApiKey || '';
        
        if (!question && !articleText) {
            return res.status(400).json({ error: 'Please provide a question or article text' });
        }
        
        var apiKey = userApiKey;
        if (!apiKey) {
            var rateCheck = checkRateLimit(getRateLimitKey(req));
            if (!rateCheck.allowed) {
                return res.status(429).json({ 
                    error: 'Daily free limit reached. Add your own API key for unlimited use.', 
                    resetAt: rateCheck.resetAt 
                });
            }
            apiKey = process.env.ANTHROPIC_API_KEY;
        }
        
        if (!apiKey) {
            return res.status(500).json({ error: 'No API key configured' });
        }
        
        var anthropic = new Anthropic({ apiKey: apiKey });
        var prompt = buildPrompt(question, articleText, track, claimType);
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
        
        var parsed = parseAssessmentResponse(assessment);
        
        return res.status(200).json({
            success: true,
            assessment: assessment,
            realityScore: parsed.realityScore,
            integrityScore: parsed.integrityScore,
            structured: {
                realityFactors: parsed.realityFactors,
                integrity: parsed.integrity,
                underlyingReality: parsed.underlyingReality,
                sources: parsed.sources
            },
            question: question || 'Article Assessment',
            track: track,
            claimType: claimType,
            assessmentDate: new Date().toISOString(),
            assessor: 'VERIFICATION'
        });
        
    } catch (err) {
        console.error('Verification error:', err);
        return res.status(500).json({ error: 'Verification failed', message: err.message });
    }
};
