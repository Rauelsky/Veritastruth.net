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
// CRITERIA DEFINITIONS (must match frontend)
// ============================================
const CRITERIA_SETS = {
    qualification: {
        label: 'Person Qualification',
        criteria: [
            { id: 'legal', label: 'Legal Eligibility', description: 'Does the person meet legal/constitutional requirements for the role?' },
            { id: 'experience', label: 'Experience & Credentials', description: 'What relevant experience, education, or credentials does the person have?' },
            { id: 'record', label: 'Historical Record', description: 'What is their track record in similar or related roles?' },
            { id: 'alignment', label: 'Value Alignment', description: 'How do their stated values align with the role\'s requirements?' },
            { id: 'controversies', label: 'Controversies & Concerns', description: 'What documented concerns, controversies, or red flags exist?' }
        ]
    },
    policy: {
        label: 'Policy Effectiveness',
        criteria: [
            { id: 'goals', label: 'Stated Goals Clarity', description: 'Are the policy\'s goals clearly defined and measurable?' },
            { id: 'outcomes', label: 'Measurable Outcomes', description: 'What evidence exists about the policy\'s actual outcomes?' },
            { id: 'costbenefit', label: 'Cost/Benefit Analysis', description: 'How do the costs compare to the benefits?' },
            { id: 'alternatives', label: 'Comparison to Alternatives', description: 'How does this policy compare to alternative approaches?' },
            { id: 'implementation', label: 'Implementation Challenges', description: 'What practical challenges affect implementation?' }
        ]
    },
    product: {
        label: 'Product/Service Quality',
        criteria: [
            { id: 'audience', label: 'Who benefits from this product or service?', description: 'For whom is this product/service appropriate?' },
            { id: 'measure', label: 'Success Criteria', description: 'By what measure is success/quality defined?' },
            { id: 'comparison', label: 'Comparison to Alternatives', description: 'How does it compare to alternatives?' },
            { id: 'timeframe', label: 'Timeframe Considerations', description: 'What are short-term vs long-term implications?' },
            { id: 'credibility', label: 'Source Credibility', description: 'What conflicts of interest or biases exist in claims about it?' }
        ]
    },
    prediction: {
        label: 'Prediction/Forecast',
        criteria: [
            { id: 'trackrecord', label: 'Predictor Track Record', description: 'What is the predictor\'s history of accuracy?' },
            { id: 'transparency', label: 'Model Transparency', description: 'Is the reasoning/model behind the prediction transparent?' },
            { id: 'baserates', label: 'Base Rates Acknowledged', description: 'Are historical base rates considered?' },
            { id: 'uncertainty', label: 'Uncertainty Quantified', description: 'Is uncertainty appropriately acknowledged and quantified?' },
            { id: 'falsifiability', label: 'Falsifiability Defined', description: 'What would prove the prediction wrong?' }
        ]
    },
    generic: {
        label: 'General Assessment',
        criteria: [
            { id: 'evidence', label: 'Evidence Quality', description: 'What evidence supports or refutes this claim?' },
            { id: 'expertise', label: 'Source Expertise', description: 'Do the sources have relevant expertise?' },
            { id: 'audience', label: 'Who benefits?', description: 'Who gains or loses if this claim is accepted?' },
            { id: 'alternatives', label: 'Alternative Perspectives', description: 'What competing viewpoints exist?' },
            { id: 'outcomes', label: 'Measurable Outcomes', description: 'What concrete outcomes can be measured?' },
            { id: 'timeframe', label: 'Timeframe Considerations', description: 'What are short-term vs long-term implications?' }
        ]
    }
};

// ============================================
// PROMPT BUILDER - TRACK A (Factual)
// ============================================
function buildTrackAPrompt(question, articleText) {
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    var isoDate = now.toISOString().split('T')[0];
    
    var prompt = 'You are VERITAS, an epistemologically rigorous truth assessment system. Your purpose is to evaluate claims using a transparent methodology with intellectual honesty and appropriate epistemic humility.\n\n';
    
    // TEMPORAL AWARENESS
    prompt += '## CURRENT DATE AND TEMPORAL AWARENESS\n';
    prompt += '**TODAY IS: ' + currentDate + ' (' + isoDate + ')**\n\n';
    prompt += 'CRITICAL: Your training data has a knowledge cutoff. Before making ANY assessment:\n';
    prompt += '1. ASSUME your knowledge of current positions, roles, and recent events may be OUTDATED\n';
    prompt += '2. For ANY claim involving WHO holds a position, WHO is in charge, or CURRENT status:\n';
    prompt += '   - You MUST search FIRST before stating anything\n';
    prompt += '   - Do NOT trust your training data for positions/roles - people change jobs\n';
    prompt += '3. Search for recent news/developments even if you think you know the answer\n';
    prompt += '4. If the claim involves events from the past 2 years, ALWAYS verify current status\n\n';
    
    // ASSESSMENT TYPE
    prompt += '## ASSESSMENT TYPE\n';
    prompt += 'This is a Track A (Factual) assessment.\n';
    prompt += 'Focus on verifiable facts, documented evidence, and expert consensus.\n\n';
    
    // FOUR-FACTOR FRAMEWORK
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
    
    // INTEGRITY 2.0 FRAMEWORK
    prompt += '## INTEGRITY 2.0 FRAMEWORK\n\n';
    prompt += 'The Integrity Score (-1.0 to +1.0) measures HOW claims are presented, independent of truth.\n';
    prompt += 'It has THREE dimensions, each weighted at 33%:\n\n';
    prompt += '### Dimension 1: Observable Integrity (33%)\n';
    prompt += 'Binary Y/N/P checklist:\n';
    prompt += '- **Sources Cited**: Y (adequate), P (partial), N (none/inadequate)\n';
    prompt += '- **Limitations Acknowledged**: Y/P/N\n';
    prompt += '- **Counter-Arguments Addressed**: Y/P/N\n';
    prompt += '- **Fallacies Present**: Y (fallacies found = bad), N (none = good)\n\n';
    prompt += '### Dimension 2: Comparative Integrity (33%)\n';
    prompt += 'How does this compare to quality discourse on this topic?\n';
    prompt += '- **Percentile**: 0-100 ranking vs typical coverage\n\n';
    prompt += '### Dimension 3: Bias Integrity (33%)\n';
    prompt += 'Detection of presentation patterns signaling advocacy.\n\n';
    
    // TASK
    prompt += '## YOUR TASK\n\n';
    prompt += 'Assessment Date: ' + currentDate + '\n\n';
    
    if (articleText) {
        prompt += 'Analyze this article:\n\n---\n' + articleText + '\n---\n\n';
        prompt += 'Question about the article: ' + question + '\n\n';
    } else {
        prompt += 'Evaluate this claim/question: ' + question + '\n\n';
    }
    
    // OUTPUT FORMAT
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    prompt += 'You MUST provide your response in TWO parts:\n\n';
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
    prompt += '**CLAIM BEING TESTED**, **VERITAS ASSESSMENT**, **EVIDENCE ANALYSIS**, ';
    prompt += '**WHAT WE CAN BE CONFIDENT ABOUT**, **WHAT REMAINS UNCERTAIN**, **BOTTOM LINE**\n';
    
    return prompt;
}

// ============================================
// PROMPT BUILDER - TRACK B (Criteria-Based)
// ============================================
function buildTrackBPrompt(question, claimType, criteria, customCriteria, fiveWsContext) {
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    var isoDate = now.toISOString().split('T')[0];
    
    var prompt = 'You are VERITAS Track B, a criteria-based assessment system for subjective or complex claims. ';
    prompt += 'Your purpose is to evaluate claims against SPECIFIC CRITERIA selected by the user, ';
    prompt += 'providing independent scores for each criterion rather than forcing a single overall judgment.\n\n';
    
    // TEMPORAL AWARENESS
    prompt += '## CURRENT DATE\n';
    prompt += '**TODAY IS: ' + currentDate + ' (' + isoDate + ')**\n\n';
    prompt += 'Search for current information before making assessments. Do not rely on potentially outdated training data.\n\n';
    
    // CLAIM TYPE CONTEXT
    var claimTypeLabel = CRITERIA_SETS[claimType] ? CRITERIA_SETS[claimType].label : 'General Assessment';
    prompt += '## CLAIM TYPE: ' + claimTypeLabel.toUpperCase() + '\n\n';
    
    // 5 W's CONTEXT (if provided)
    if (fiveWsContext) {
        prompt += '## CONTEXTUAL INFORMATION PROVIDED BY USER\n';
        if (fiveWsContext.who) prompt += '- **Who**: ' + fiveWsContext.who + '\n';
        if (fiveWsContext.what) prompt += '- **What**: ' + fiveWsContext.what + '\n';
        if (fiveWsContext.when) prompt += '- **When**: ' + fiveWsContext.when + '\n';
        if (fiveWsContext.where) prompt += '- **Where**: ' + fiveWsContext.where + '\n';
        if (fiveWsContext.how) prompt += '- **How/Impact**: ' + fiveWsContext.how + '\n';
        prompt += '\n';
    }
    
    // THE CLAIM
    prompt += '## THE CLAIM TO ASSESS\n';
    prompt += '"' + question + '"\n\n';
    
    // BUILD CRITERIA LIST
    prompt += '## CRITERIA TO ASSESS\n';
    prompt += 'The user has selected the following criteria. You MUST assess EACH ONE independently:\n\n';
    
    var allCriteria = [];
    var criteriaSet = CRITERIA_SETS[claimType] || CRITERIA_SETS.generic;
    
    // Helper function to find criterion by id in the array
    function findCriterionById(criteriaArray, id) {
        for (var i = 0; i < criteriaArray.length; i++) {
            if (criteriaArray[i].id === id) {
                return criteriaArray[i];
            }
        }
        return null;
    }
    
    // Add selected standard criteria
    if (criteria && criteria.length > 0) {
        criteria.forEach(function(criterionId) {
            var criterionDef = findCriterionById(criteriaSet.criteria, criterionId);
            if (criterionDef) {
                allCriteria.push({
                    id: criterionId,
                    label: criterionDef.label,
                    description: criterionDef.description,
                    isCustom: false
                });
                prompt += '### ' + criterionDef.label + '\n';
                prompt += criterionDef.description + '\n\n';
            } else {
                console.log('Warning: Criterion not found:', criterionId, 'in claimType:', claimType);
            }
        });
    }
    
    // Add custom criteria
    if (customCriteria && customCriteria.length > 0) {
        customCriteria.forEach(function(customText, idx) {
            allCriteria.push({
                id: 'custom_' + idx,
                label: customText,
                description: 'User-defined criterion',
                isCustom: true
            });
            prompt += '### ' + customText + ' (Custom)\n';
            prompt += 'User-defined criterion to assess.\n\n';
        });
    }
    
    // SCORING INSTRUCTIONS
    prompt += '## SCORING INSTRUCTIONS\n\n';
    prompt += 'For EACH criterion, provide:\n';
    prompt += '- **Score**: -10 to +10 where:\n';
    prompt += '  - +10 = Strongly supports/affirms (overwhelming evidence)\n';
    prompt += '  - +5 to +9 = Moderately to strongly supports\n';
    prompt += '  - +1 to +4 = Slightly supports\n';
    prompt += '  - 0 = Neutral/insufficient evidence either way\n';
    prompt += '  - -1 to -4 = Slightly contradicts/undermines\n';
    prompt += '  - -5 to -9 = Moderately to strongly contradicts\n';
    prompt += '  - -10 = Strongly contradicts (overwhelming counter-evidence)\n';
    prompt += '- **Confidence**: HIGH, MEDIUM, or LOW\n';
    prompt += '- **Summary**: 2-3 sentence explanation with specific evidence\n\n';
    
    prompt += 'IMPORTANT: Each criterion gets its OWN score. Do NOT average them into a single score.\n';
    prompt += 'Different criteria may point in different directions - this is valuable information.\n\n';
    
    // OUTPUT FORMAT
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    prompt += '```json\n';
    prompt += '{\n';
    prompt += '  "trackB": {\n';
    prompt += '    "claimType": "' + claimType + '",\n';
    prompt += '    "claimTypeLabel": "' + claimTypeLabel + '",\n';
    prompt += '    "criteriaAssessed": [\n';
    
    allCriteria.forEach(function(c, idx) {
        prompt += '      {\n';
        prompt += '        "id": "' + c.id + '",\n';
        prompt += '        "label": "' + c.label + '",\n';
        prompt += '        "score": <-10 to +10>,\n';
        prompt += '        "confidence": "<HIGH|MEDIUM|LOW>",\n';
        prompt += '        "summary": "<2-3 sentences with evidence>"\n';
        prompt += '      }' + (idx < allCriteria.length - 1 ? ',' : '') + '\n';
    });
    
    prompt += '    ],\n';
    prompt += '    "criteriaNotAssessed": [<list any criteria from the set that were NOT selected>],\n';
    prompt += '    "fullPicture": "<2-3 sentences synthesizing what the criteria collectively reveal>",\n';
    prompt += '    "divergenceNote": "<if criteria scores diverge significantly, explain why>"\n';
    prompt += '  },\n';
    prompt += '  "sources": ["<source 1>", "<source 2>", ...]\n';
    prompt += '}\n';
    prompt += '```\n\n';
    
    prompt += '### NARRATIVE SECTION\n';
    prompt += 'After JSON, provide:\n';
    prompt += '**CLAIM BEING ASSESSED**: [restate the claim]\n';
    prompt += '**CRITERIA ANALYSIS**: [discuss each criterion\'s findings]\n';
    prompt += '**THE FULL PICTURE**: [what do these criteria together reveal?]\n';
    prompt += '**WHAT THIS DOES NOT TELL US**: [limitations of this assessment]\n';
    
    return prompt;
}

// ============================================
// RESPONSE PARSER - TRACK A
// ============================================
function parseTrackAResponse(assessment) {
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
            console.error('Track A JSON parse error:', e);
        }
    }
    
    // Fallback regex extraction
    if (result.realityScore === null) {
        var realityMatch = assessment.match(/["\']?realityScore["\']?\s*:\s*([+-]?\d+)/i) ||
                          assessment.match(/REALITY SCORE:\s*\[?([+-]?\d+)\]?/i);
        if (realityMatch) result.realityScore = parseInt(realityMatch[1]);
    }
    
    if (result.integrityScore === null) {
        var integrityMatch = assessment.match(/["\']?integrityScore["\']?\s*:\s*([+-]?\d+\.?\d*)/i) ||
                            assessment.match(/INTEGRITY SCORE:\s*\[?([+-]?\d+\.?\d*)\]?/i);
        if (integrityMatch) result.integrityScore = parseFloat(integrityMatch[1]);
    }
    
    return result;
}

// ============================================
// RESPONSE PARSER - TRACK B
// ============================================
function parseTrackBResponse(assessment) {
    var result = {
        trackB: null,
        sources: null,
        narrative: assessment
    };
    
    console.log('parseTrackBResponse: Looking for JSON block...');
    var jsonMatch = assessment.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
        console.log('parseTrackBResponse: Found JSON block, length:', jsonMatch[1].length);
        console.log('parseTrackBResponse: JSON preview:', jsonMatch[1].substring(0, 300));
        try {
            var parsed = JSON.parse(jsonMatch[1]);
            console.log('parseTrackBResponse: JSON parsed successfully');
            console.log('parseTrackBResponse: Keys in parsed:', Object.keys(parsed));
            result.trackB = parsed.trackB;
            result.sources = parsed.sources;
            
            if (result.trackB) {
                console.log('parseTrackBResponse: trackB found with keys:', Object.keys(result.trackB));
                if (result.trackB.criteriaAssessed) {
                    console.log('parseTrackBResponse: criteriaAssessed count:', result.trackB.criteriaAssessed.length);
                }
            } else {
                console.log('parseTrackBResponse: WARNING - trackB is null/undefined in parsed JSON');
                console.log('parseTrackBResponse: Full parsed object:', JSON.stringify(parsed, null, 2).substring(0, 500));
            }
        } catch (e) {
            console.error('parseTrackBResponse: JSON parse error:', e.message);
            console.error('parseTrackBResponse: Problematic JSON:', jsonMatch[1].substring(0, 500));
        }
    } else {
        console.log('parseTrackBResponse: No JSON block found in response');
        console.log('parseTrackBResponse: Looking for ```json in:', assessment.substring(0, 200));
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
        var claimType = body.claimType || 'generic';
        var criteria = body.criteria || [];
        var customCriteria = body.customCriteria || [];
        var fiveWsContext = body.fiveWsContext || null;
        var userApiKey = body.userApiKey || '';
        
        // Validation
        if (!question && !articleText) {
            return res.status(400).json({ error: 'Please provide a question or article text' });
        }
        
        if (track === 'b' && criteria.length === 0 && customCriteria.length === 0) {
            return res.status(400).json({ error: 'Track B requires at least one criterion to assess' });
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
        
        // Build appropriate prompt based on track
        var prompt;
        if (track === 'b') {
            console.log('=== TRACK B ASSESSMENT ===');
            console.log('Question:', question);
            console.log('Claim Type:', claimType);
            console.log('Criteria:', criteria);
            console.log('Custom Criteria:', customCriteria);
            console.log('5Ws Context:', fiveWsContext);
            prompt = buildTrackBPrompt(question, claimType, criteria, customCriteria, fiveWsContext);
            console.log('Prompt length:', prompt.length);
        } else {
            prompt = buildTrackAPrompt(question, articleText);
        }
        
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
        
        // Parse response based on track
        if (track === 'b') {
            console.log('=== TRACK B RESPONSE ===');
            console.log('Raw assessment length:', assessment.length);
            console.log('First 500 chars:', assessment.substring(0, 500));
            var parsed = parseTrackBResponse(assessment);
            console.log('Parsed trackB:', parsed.trackB);
            console.log('Parsed sources:', parsed.sources);
            
            // Debug info to help troubleshoot
            var debugInfo = {
                assessmentLength: assessment.length,
                hasJsonBlock: assessment.includes('```json'),
                trackBExists: !!parsed.trackB,
                trackBKeys: parsed.trackB ? Object.keys(parsed.trackB) : [],
                criteriaCount: (parsed.trackB && parsed.trackB.criteriaAssessed) ? parsed.trackB.criteriaAssessed.length : 0
            };
            
            return res.status(200).json({
                success: true,
                assessment: assessment,
                realityScore: null,  // Track B doesn't have a single reality score
                integrityScore: null,
                structured: {
                    trackB: parsed.trackB,
                    sources: parsed.sources
                },
                question: question,
                track: 'b',
                claimType: claimType,
                assessmentDate: new Date().toISOString(),
                assessor: 'INITIAL',
                _debug: debugInfo  // Include debug info in response
            });
        } else {
            var parsed = parseTrackAResponse(assessment);
            
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
                track: 'a',
                claimType: claimType,
                assessmentDate: new Date().toISOString(),
                assessor: 'INITIAL'
            });
        }
        
    } catch (err) {
        console.error('Assessment error:', err);
        return res.status(500).json({ error: 'Assessment failed', message: err.message });
    }
};
