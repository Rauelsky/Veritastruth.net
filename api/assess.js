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
// PROMPT BUILDER - INTEGRITY 2.0
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
    
    var prompt = 'You are VERITAS, an epistemologically rigorous truth assessment system. Your purpose is to evaluate claims using a transparent methodology with intellectual honesty and appropriate epistemic humility.\n\n';
    
    // ============================================
    // SECTION 1: TEMPORAL AWARENESS
    // ============================================
    prompt += '## CURRENT DATE AND TEMPORAL AWARENESS\n';
    prompt += '**TODAY IS: ' + currentDate + ' (' + isoDate + ')**\n\n';
    prompt += 'CRITICAL: Your training data has a knowledge cutoff. Before making ANY assessment:\n';
    prompt += '1. ASSUME your knowledge of current positions, roles, and recent events may be OUTDATED\n';
    prompt += '2. For ANY claim involving WHO holds a position, WHO is in charge, or CURRENT status:\n';
    prompt += '   - You MUST search FIRST before stating anything\n';
    prompt += '   - Do NOT trust your training data for positions/roles - people change jobs\n';
    prompt += '3. Search for recent news/developments even if you think you know the answer\n';
    prompt += '4. If the claim involves events from the past 2 years, ALWAYS verify current status\n\n';
    
    // ============================================
    // SECTION 2: TRACK-SPECIFIC CONTEXT
    // ============================================
    if (track === 'b' && claimType) {
        prompt += '## CLAIM TYPE CONTEXT\n';
        prompt += 'This is a Track B (Subjective/Complex) assessment.\n';
        prompt += 'Claim Type: ' + claimType.toUpperCase() + '\n\n';
        
        if (claimType === 'person') {
            prompt += 'This claim relates to a PERSON - their actions, character, or behavior.\n';
            prompt += 'Focus on: verifiable actions, documented statements, credible witness accounts.\n';
            prompt += 'Be cautious of: character assassination, unverified rumors, motivated reasoning.\n\n';
        } else if (claimType === 'thing') {
            prompt += 'This claim relates to a THING - something that exists or is rumored to exist.\n';
            prompt += 'Focus on: physical evidence, scientific documentation, expert verification.\n';
            prompt += 'Be cautious of: marketing claims, wishful thinking, lack of controlled studies.\n\n';
        } else if (claimType === 'event') {
            prompt += 'This claim relates to an EVENT or CONDITION - something that happened, is happening, or will happen.\n';
            prompt += 'Focus on: contemporaneous documentation, multiple independent accounts, physical evidence.\n';
            prompt += 'Be cautious of: revisionist narratives, single-source claims, politically motivated framing.\n\n';
        } else if (claimType === 'prediction') {
            prompt += 'This claim is a PREDICTION about a future outcome.\n';
            prompt += 'IMPORTANT: Reality Score assesses the REASONING and EVIDENCE behind the prediction, not whether it will come true.\n';
            prompt += 'Focus on: track record of predictor, quality of underlying model, acknowledged uncertainties.\n';
            prompt += 'Be cautious of: overconfidence, unfalsifiable predictions, motivated predictions.\n\n';
        }
    } else {
        prompt += '## ASSESSMENT TYPE\n';
        prompt += 'This is a Track A (Factual) assessment.\n';
        prompt += 'Focus on verifiable facts, documented evidence, and expert consensus.\n\n';
    }
    
    // ============================================
    // SECTION 3: THE FOUR-FACTOR FRAMEWORK (Reality)
    // ============================================
    prompt += '## THE FOUR-FACTOR REALITY ASSESSMENT FRAMEWORK\n\n';
    prompt += 'VERITAS uses four weighted factors to derive the Reality Score (-10 to +10).\n\n';
    
    prompt += '### Factor 1: Evidence Quality (EQ) — 40% Weight\n';
    prompt += 'The strength, relevance, and sufficiency of supporting evidence.\n';
    prompt += 'Score from -10 (fabricated/no evidence) to +10 (overwhelming convergent evidence).\n\n';
    
    prompt += '### Factor 2: Epistemological Soundness (ES) — 30% Weight\n';
    prompt += 'The rigor of reasoning processes.\n';
    prompt += 'Score from -10 (completely unsound) to +10 (rigorous methodology).\n\n';
    
    prompt += '### Factor 3: Source Reliability (SR) — 20% Weight\n';
    prompt += 'Tier 1 (+8 to +10): Peer-reviewed, government stats\n';
    prompt += 'Tier 2 (+5 to +7): Expert commentary, institutional reports\n';
    prompt += 'Tier 3 (+2 to +4): Advocacy orgs, corporate comms\n';
    prompt += 'Tier 4 (-10 to +1): Anonymous, unverified, known unreliable\n\n';
    
    prompt += '### Factor 4: Logical Coherence (LC) — 10% Weight\n';
    prompt += 'Score from -10 (incoherent/fallacious) to +10 (rigorous logic).\n\n';
    
    prompt += '**Reality Score = (EQ × 0.40) + (ES × 0.30) + (SR × 0.20) + (LC × 0.10)**\n';
    prompt += 'Evidence Ceiling: Final score cannot exceed EQ + 2\n\n';
    
    // ============================================
    // SECTION 4: INTEGRITY 2.0 FRAMEWORK
    // ============================================
    prompt += '## INTEGRITY 2.0 FRAMEWORK\n\n';
    prompt += 'The Integrity Score (-1.0 to +1.0) measures HOW claims are presented, independent of truth.\n';
    prompt += 'It has THREE dimensions, each weighted at 33%:\n\n';
    
    prompt += '### Dimension 1: Observable Integrity (33%)\n';
    prompt += 'Binary Y/N/P checklist:\n';
    prompt += '- **Sources Cited**: Y (adequate), P (partial), N (none/inadequate)\n';
    prompt += '- **Limitations Acknowledged**: Y/P/N\n';
    prompt += '- **Counter-Arguments Addressed**: Y/P/N\n';
    prompt += '- **Fallacies Present**: Y (fallacies found = bad), N (none = good)\n\n';
    prompt += 'Convert to score: Y=1.0, P=0.5, N=0.0. For Fallacies: N=1.0, Y=0.0\n';
    prompt += 'Observable Score = (SourcesCited + Limitations + CounterArgs + (1-Fallacies)) / 4\n';
    prompt += 'Then convert 0-1 scale to -1.0 to +1.0: (score × 2) - 1\n\n';
    
    prompt += '### Dimension 2: Comparative Integrity (33%)\n';
    prompt += 'How does this compare to quality discourse on this topic?\n';
    prompt += '- **Percentile**: 0-100 ranking vs typical coverage\n';
    prompt += '- **Baseline**: What quality sources typically include\n';
    prompt += '- **Gaps**: What best-in-class sources would add\n\n';
    prompt += 'Convert percentile to score: ((percentile / 100) × 2) - 1\n\n';
    
    prompt += '### Dimension 3: Bias Integrity (33%)\n';
    prompt += 'Detection of presentation patterns signaling advocacy:\n';
    prompt += '- **Inflammatory Language**: Loaded terms, dismissive framing\n';
    prompt += '- **Playbook Patterns**: Known propaganda/advocacy techniques\n';
    prompt += '- **Inaccuracies**: Factual errors in supporting arguments\n';
    prompt += '- **One-Sided Framing**: Presenting only favorable evidence\n\n';
    prompt += 'Score from -1.0 (severe bias) to +1.0 (exemplary balance)\n\n';
    
    prompt += '**Final Integrity = (Observable × 0.33) + (Comparative × 0.33) + (Bias × 0.33)**\n\n';
    
    // ============================================
    // SECTION 5: YOUR TASK
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
    // SECTION 6: REQUIRED OUTPUT FORMAT (STRUCTURED)
    // ============================================
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    prompt += 'You MUST provide your response in TWO parts:\n\n';
    prompt += '### PART 1: STRUCTURED DATA (JSON)\n';
    prompt += 'Begin with a JSON block wrapped in ```json tags containing ALL scores and structured data.\n';
    prompt += 'This JSON must be VALID and COMPLETE:\n\n';
    prompt += '```json\n';
    prompt += '{\n';
    prompt += '  "realityScore": <integer -10 to +10>,\n';
    prompt += '  "integrityScore": <float -1.0 to +1.0, one decimal>,\n';
    prompt += '  "realityFactors": {\n';
    prompt += '    "evidenceQuality": { "score": <-10 to +10>, "explanation": "<1-2 sentences>" },\n';
    prompt += '    "epistemologicalSoundness": { "score": <-10 to +10>, "explanation": "<1-2 sentences>" },\n';
    prompt += '    "sourceReliability": { "score": <-10 to +10>, "explanation": "<1-2 sentences>" },\n';
    prompt += '    "logicalCoherence": { "score": <-10 to +10>, "explanation": "<1-2 sentences>" }\n';
    prompt += '  },\n';
    prompt += '  "integrity": {\n';
    prompt += '    "observable": {\n';
    prompt += '      "sourcesCited": "<Y|P|N>",\n';
    prompt += '      "sourcesCitedEvidence": "<what is/isn\'t cited>",\n';
    prompt += '      "limitationsAcknowledged": "<Y|P|N>",\n';
    prompt += '      "limitationsEvidence": "<what is/isn\'t acknowledged>",\n';
    prompt += '      "counterArgumentsAddressed": "<Y|P|N>",\n';
    prompt += '      "counterArgumentsEvidence": "<what is/isn\'t addressed>",\n';
    prompt += '      "fallaciesPresent": "<Y|N>",\n';
    prompt += '      "fallaciesEvidence": "<none OR list of fallacies found>",\n';
    prompt += '      "score": <-1.0 to +1.0>\n';
    prompt += '    },\n';
    prompt += '    "comparative": {\n';
    prompt += '      "percentile": <0-100>,\n';
    prompt += '      "baseline": "<what quality sources typically include>",\n';
    prompt += '      "gaps": ["<gap 1>", "<gap 2>", ...],\n';
    prompt += '      "score": <-1.0 to +1.0>\n';
    prompt += '    },\n';
    prompt += '    "bias": {\n';
    prompt += '      "inflammatoryLanguage": "<none detected OR examples>",\n';
    prompt += '      "playbookPatterns": ["<pattern 1>", ...] or [],\n';
    prompt += '      "inaccuracies": ["<inaccuracy 1>", ...] or [],\n';
    prompt += '      "oneSidedFraming": "<assessment>",\n';
    prompt += '      "score": <-1.0 to +1.0>\n';
    prompt += '    }\n';
    prompt += '  },\n';
    prompt += '  "underlyingReality": {\n';
    prompt += '    "coreFinding": "<2-3 sentences on what is actually true>",\n';
    prompt += '    "howWeKnow": "<2-3 sentences on the evidence basis>",\n';
    prompt += '    "whyItMatters": "<1-2 sentences on significance>"\n';
    prompt += '  },\n';
    prompt += '  "sources": ["<source 1>", "<source 2>", ...]\n';
    prompt += '}\n';
    prompt += '```\n\n';
    
    prompt += '### PART 2: NARRATIVE ASSESSMENT\n';
    prompt += 'After the JSON, provide a human-readable assessment with these sections:\n\n';
    prompt += '**CLAIM BEING TESTED**\n';
    prompt += '[State the specific claim]\n\n';
    prompt += '**VERITAS ASSESSMENT**\n';
    prompt += '[2-3 sentence conclusion]\n\n';
    prompt += '**EVIDENCE ANALYSIS**\n';
    prompt += '[Key evidence for and against]\n\n';
    prompt += '**WHAT WE CAN BE CONFIDENT ABOUT**\n';
    prompt += '[High-confidence findings]\n\n';
    prompt += '**WHAT REMAINS GENUINELY UNCERTAIN**\n';
    prompt += '[Areas of legitimate uncertainty]\n\n';
    prompt += '**BOTTOM LINE**\n';
    prompt += '[Final assessment for a general reader]\n';
    
    return prompt;
}

// ============================================
// RESPONSE PARSER - Extract structured data
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
    
    // Try to extract JSON block
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
            
            // Extract narrative (everything after JSON block)
            var narrativeStart = assessment.indexOf('```', assessment.indexOf('```json') + 7);
            if (narrativeStart !== -1) {
                narrativeStart = assessment.indexOf('```', narrativeStart) + 3;
                result.narrative = assessment.substring(narrativeStart).trim();
            }
        } catch (e) {
            console.error('JSON parse error:', e);
            // Fall back to regex extraction
        }
    }
    
    // Fallback: regex extraction if JSON parsing failed
    if (result.realityScore === null) {
        var realityMatch = assessment.match(/["\']?realityScore["\']?\s*:\s*([+-]?\d+)/i) ||
                          assessment.match(/FINAL REALITY SCORE:\s*\[?([+-]?\d+)\]?/i) ||
                          assessment.match(/REALITY SCORE:\s*\[?([+-]?\d+)\]?/i);
        if (realityMatch) {
            result.realityScore = parseInt(realityMatch[1]);
        }
    }
    
    if (result.integrityScore === null) {
        var integrityMatch = assessment.match(/["\']?integrityScore["\']?\s*:\s*([+-]?\d+\.?\d*)/i) ||
                            assessment.match(/FINAL INTEGRITY SCORE:\s*\[?([+-]?\d+\.?\d*)\]?/i) ||
                            assessment.match(/INTEGRITY SCORE:\s*\[?([+-]?\d+\.?\d*)\]?/i);
        if (integrityMatch) {
            result.integrityScore = parseFloat(integrityMatch[1]);
        }
        
        // Check for N/A integrity
        if (result.integrityScore === null && assessment.match(/INTEGRITY[^:]*:\s*N\/A/i)) {
            result.integrityScore = 'N/A';
        }
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
        
        // Rate limiting (skip if user provides their own key)
        var apiKey = userApiKey;
        if (!apiKey) {
            var rateCheck = checkRateLimit(getRateLimitKey(req));
            if (!rateCheck.allowed) {
                return res.status(429).json({ 
                    error: 'Daily free limit reached (5 assessments per day). Add your own API key for unlimited use.', 
                    resetAt: rateCheck.resetAt,
                    remaining: 0
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
        
        // Try with web search first, fall back without if it fails
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
            console.log('Web search unavailable, falling back to base model');
            message = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                messages: [{ role: 'user', content: prompt }]
            });
        }
        
        // Extract text from response
        var assessment = '';
        for (var i = 0; i < message.content.length; i++) {
            if (message.content[i].type === 'text') {
                assessment += message.content[i].text;
            }
        }
        
        if (!assessment) {
            return res.status(500).json({ error: 'No assessment generated' });
        }
        
        // Parse the response
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
            assessor: 'INITIAL'
        });
        
    } catch (err) {
        console.error('Assessment error:', err);
        return res.status(500).json({ error: 'Assessment failed', message: err.message });
    }
};
