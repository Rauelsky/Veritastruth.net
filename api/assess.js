const Anthropic = require('@anthropic-ai/sdk');

const rateLimitMap = new Map();
const FREE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

// ============================================
// TRACK B: CRITERIA DEFINITIONS
// ============================================
const CRITERIA_SETS = {
    qualification: {
        label: 'Person Qualification',
        criteria: {
            legal: { id: 'legal', label: 'Legal Eligibility', description: 'Does the person meet legal/constitutional requirements for the role?' },
            experience: { id: 'experience', label: 'Experience & Credentials', description: 'What relevant experience, education, or credentials does the person have?' },
            record: { id: 'record', label: 'Historical Record', description: 'What is their track record in similar or related roles?' },
            alignment: { id: 'alignment', label: 'Value Alignment', description: 'How do their stated values align with the role\'s requirements?' },
            controversies: { id: 'controversies', label: 'Controversies & Concerns', description: 'What documented concerns, controversies, or red flags exist?' }
        }
    },
    policy: {
        label: 'Policy Effectiveness',
        criteria: {
            goals: { id: 'goals', label: 'Stated Goals Clarity', description: 'Are the policy\'s goals clearly defined and measurable?' },
            outcomes: { id: 'outcomes', label: 'Measurable Outcomes', description: 'What evidence exists about the policy\'s actual outcomes?' },
            costbenefit: { id: 'costbenefit', label: 'Cost/Benefit Analysis', description: 'How do the costs compare to the benefits?' },
            alternatives: { id: 'alternatives', label: 'Comparison to Alternatives', description: 'How does this policy compare to alternative approaches?' },
            implementation: { id: 'implementation', label: 'Implementation Challenges', description: 'What practical challenges affect implementation?' }
        }
    },
    product: {
        label: 'Product/Service Quality',
        criteria: {
            audience: { id: 'audience', label: 'Audience Fit', description: 'For whom is this product/service appropriate?' },
            measure: { id: 'measure', label: 'Success Criteria', description: 'By what measure is success/quality defined?' },
            comparison: { id: 'comparison', label: 'Comparison to Alternatives', description: 'How does it compare to alternatives?' },
            timeframe: { id: 'timeframe', label: 'Timeframe Considerations', description: 'What are short-term vs long-term implications?' },
            credibility: { id: 'credibility', label: 'Source Credibility', description: 'What conflicts of interest or biases exist in claims about it?' }
        }
    },
    prediction: {
        label: 'Prediction/Forecast',
        criteria: {
            trackrecord: { id: 'trackrecord', label: 'Predictor Track Record', description: 'What is the predictor\'s history of accuracy?' },
            transparency: { id: 'transparency', label: 'Model Transparency', description: 'Is the reasoning/model behind the prediction transparent?' },
            baserates: { id: 'baserates', label: 'Base Rates Acknowledged', description: 'Are historical base rates considered?' },
            uncertainty: { id: 'uncertainty', label: 'Uncertainty Quantified', description: 'Is uncertainty appropriately acknowledged and quantified?' },
            falsifiability: { id: 'falsifiability', label: 'Falsifiability Defined', description: 'What would prove the prediction wrong?' }
        }
    }
};

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
// TRACK A PROMPT BUILDER (existing logic)
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
    
    var prompt = 'You are VERITAS, an epistemologically rigorous truth assessment system. Your purpose is to evaluate claims using a transparent four-factor methodology with intellectual honesty and appropriate epistemic humility.\n\n';
    
    // SECTION 1: TEMPORAL AWARENESS
    prompt += '## CURRENT DATE AND TEMPORAL AWARENESS\n';
    prompt += '**TODAY IS: ' + currentDate + ' (' + isoDate + ')**\n\n';
    prompt += 'CRITICAL: Your training data has a knowledge cutoff. Before making ANY assessment:\n';
    prompt += '1. ASSUME your knowledge of current positions, roles, and recent events may be OUTDATED\n';
    prompt += '2. For ANY claim involving WHO holds a position, WHO is in charge, or CURRENT status:\n';
    prompt += '   - You MUST search FIRST before stating anything\n';
    prompt += '   - Do NOT trust your training data for positions/roles - people change jobs\n';
    prompt += '3. Search for recent news/developments even if you think you know the answer\n';
    prompt += '4. If the claim involves events from the past 2 years, ALWAYS verify current status\n\n';
    
    prompt += '## STEP 0: TEMPORAL VERIFICATION (MANDATORY)\n';
    prompt += 'Before ANY analysis, you must:\n';
    prompt += '1. Identify all entities in the claim (people, organizations, positions)\n';
    prompt += '2. Search for CURRENT status of each entity as of ' + currentDate + '\n';
    prompt += '3. Note any changes since your training cutoff\n';
    prompt += '4. Only THEN proceed to assessment\n\n';
    
    // SECTION 1.5: CLAIM TYPE CLASSIFICATION
    prompt += '## SECTION 1.5: CLAIM TYPE CLASSIFICATION\n';
    prompt += 'Before assessment, classify the claim type:\n';
    prompt += '- **factual**: Verifiable through evidence (e.g., "The Earth is round")\n';
    prompt += '- **subjective**: Depends on values/preferences (e.g., "X is qualified")\n';
    prompt += '- **value_judgment**: Ethical/moral claim (e.g., "X is wrong")\n';
    prompt += '- **prediction**: Future-oriented (e.g., "X will happen")\n\n';
    
    // SECTION 1.6: BASELINE INTEGRITY FLOOR (Seed)
    prompt += '## SECTION 1.6: BASELINE INTEGRITY FLOOR (Seed)\n';
    prompt += 'Before diving into evidence, note what the BARE CLAIM reveals about epistemological honesty:\n';
    prompt += '- Does the claim acknowledge any uncertainty?\n';
    prompt += '- Does it make absolute statements where nuance would be appropriate?\n';
    prompt += '- Does the framing itself reveal potential bias?\n';
    prompt += 'Document this as "baselineIntegrityNote" in structured output.\n\n';
    
    // SECTION 2: THE FOUR-FACTOR FRAMEWORK
    prompt += '## THE FOUR-FACTOR ASSESSMENT FRAMEWORK\n\n';
    prompt += 'VERITAS uses four weighted factors to derive scores. You must assess EACH factor explicitly.\n\n';
    
    prompt += '### Factor 1: Evidence Quality (EQ) — 40% Weight\n';
    prompt += 'The strength, relevance, and sufficiency of supporting evidence.\n';
    prompt += '**Evidence Hierarchy (strongest to weakest):**\n';
    prompt += '- Peer-reviewed meta-analyses and systematic reviews\n';
    prompt += '- Controlled experimental studies with replication\n';
    prompt += '- Large-scale observational studies with robust methodology\n';
    prompt += '- Expert consensus from relevant professional bodies\n';
    prompt += '- Individual peer-reviewed studies\n';
    prompt += '- Government and institutional data\n';
    prompt += '- Investigative journalism with documented sources\n';
    prompt += '- Expert opinion without peer review\n';
    prompt += '- Anecdotal evidence and personal testimony\n';
    prompt += '- Unverified claims and social media posts\n\n';
    
    prompt += '### Factor 2: Epistemological Integrity (EI) — 30% Weight\n';
    prompt += 'The honesty and rigor of reasoning processes.\n';
    prompt += '**What to assess:**\n';
    prompt += '- Transparent uncertainty: Does the content acknowledge what it doesn\'t know?\n';
    prompt += '- Good-faith engagement: Does it address the strongest counterarguments?\n';
    prompt += '- Proportional confidence: Do claims match the strength of evidence?\n';
    prompt += '- Consistent standards: Are the same evidentiary standards applied to all sides?\n\n';
    
    prompt += '### Factor 3: Source Reliability (SR) — 20% Weight\n';
    prompt += 'The credibility and track record of cited sources.\n';
    prompt += '**Source Tiers:**\n';
    prompt += '- Tier 1 (Most Reliable): Peer-reviewed journals, established news with correction policies, government statistical agencies\n';
    prompt += '- Tier 2 (Generally Reliable): Expert commentary, institutional reports, established trade publications\n';
    prompt += '- Tier 3 (Requires Verification): Advocacy organizations, corporate communications, political sources\n';
    prompt += '- Tier 4 (Low Reliability): Anonymous sources, unverified social media, known unreliable outlets\n\n';
    
    prompt += '### Factor 4: Logical Coherence (LC) — 10% Weight\n';
    prompt += 'The internal consistency and validity of arguments.\n';
    prompt += '**What to assess:**\n';
    prompt += '- Do conclusions follow from premises?\n';
    prompt += '- Are there logical fallacies (non sequitur, straw man, false dichotomy, etc.)?\n';
    prompt += '- Is the argument internally consistent?\n\n';
    
    // SECTION 3: REALITY DIMENSION RUBRICS (condensed)
    prompt += '## REALITY DIMENSION RUBRICS — SCORING CRITERIA\n\n';
    prompt += '### Evidence Quality Rubric (Reality Dimension)\n';
    prompt += '+10 Definitive: Overwhelming convergent evidence, settled science level\n';
    prompt += '+7 to +9: Strong to very strong evidence with minor gaps\n';
    prompt += '+4 to +6: Adequate to solid evidence, reasonable confidence\n';
    prompt += '+1 to +3: Weak support, limited evidence\n';
    prompt += '0: Indeterminate, evidence insufficient or balanced\n';
    prompt += '-1 to -3: Weak refutation\n';
    prompt += '-4 to -6: Improbable to poorly supported\n';
    prompt += '-7 to -10: Strongly to definitively refuted\n\n';
    
    // SECTION 4: INTEGRITY DIMENSION RUBRICS (condensed)
    prompt += '## INTEGRITY DIMENSION RUBRICS — SCORING CRITERIA\n\n';
    prompt += 'The Integrity dimension is scored on a -1.0 to +1.0 scale and measures the HONESTY of presentation.\n';
    prompt += 'This is INDEPENDENT of factual accuracy.\n\n';
    prompt += '+0.8 to +1.0: Exemplary honesty, all evidence presented fairly\n';
    prompt += '+0.4 to +0.7: High to adequate honesty\n';
    prompt += '+0.1 to +0.3: Basic honesty, some selectivity\n';
    prompt += '0: Neutral/cannot assess\n';
    prompt += '-0.1 to -0.3: Mild dishonesty, noticeable cherry-picking\n';
    prompt += '-0.4 to -0.6: Significant dishonesty, systematic selectivity\n';
    prompt += '-0.7 to -1.0: Severe to complete dishonesty\n\n';
    
    // SECTION 5: TRUTH DISTORTION PATTERNS
    prompt += '## TRUTH DISTORTION PATTERNS TO DETECT\n\n';
    prompt += '1. **Epistemological Special Pleading**: Applying different evidence standards based on desired conclusions\n';
    prompt += '2. **Weaponized Uncertainty**: Exploiting complexity to avoid inconvenient conclusions\n';
    prompt += '3. **Tribal Reasoning**: Evaluating claims based on who makes them rather than merit\n\n';
    
    // SECTION 6: THE WEIGHTED FORMULA
    prompt += '## THE WEIGHTED FORMULA\n\n';
    prompt += '**Final Score = (EQ × 0.40) + (EI × 0.30) + (SR × 0.20) + (LC × 0.10)**\n\n';
    prompt += '### Evidence Ceiling Principle\n';
    prompt += 'A claim CANNOT score higher than its evidence supports.\n';
    prompt += 'Maximum Reality Score ≤ Evidence Quality + 2\n\n';
    
    // SECTION 7: YOUR TASK
    prompt += '## YOUR TASK\n\n';
    prompt += 'Assessment Date: ' + currentDate + '\n\n';
    if (articleText) {
        prompt += 'Analyze this article:\n\n' + articleText + '\n\nQuestion about the article: ' + question + '\n\n';
    } else {
        prompt += 'Evaluate this claim/question: ' + question + '\n\n';
    }
    
    // SECTION 8: REQUIRED OUTPUT FORMAT
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    
    prompt += '**CLAIM TYPE CLASSIFICATION**\n';
    prompt += '[factual/subjective/value_judgment/prediction]\n\n';
    
    prompt += '**TEMPORAL VERIFICATION COMPLETED**\n';
    prompt += '[Confirm what you searched to verify current status of relevant entities]\n\n';
    
    prompt += '**CLAIM BEING TESTED**\n';
    prompt += '[State the specific claim you are evaluating]\n\n';
    
    prompt += '**REALITY SCORE BREAKDOWN**\n';
    prompt += '- Evidence Quality (40%): [score from -10 to +10] — [1-2 sentence justification]\n';
    prompt += '- Epistemological Integrity (30%): [score] — [1-2 sentence justification]\n';
    prompt += '- Source Reliability (20%): [score] — [1-2 sentence justification]\n';
    prompt += '- Logical Coherence (10%): [score] — [1-2 sentence justification]\n';
    prompt += '- Weighted Calculation: ([EQ] × 0.40) + ([EI] × 0.30) + ([SR] × 0.20) + ([LC] × 0.10) = [result]\n';
    prompt += '- Evidence Ceiling Check: [PASS or ADJUSTED]\n';
    prompt += '- **FINAL REALITY SCORE: [X]** (integer from -10 to +10)\n\n';
    
    prompt += '**INTEGRITY SCORE BREAKDOWN**\n';
    prompt += '- Evidence Handling (40%): [score from -1.0 to +1.0] — [1-2 sentence justification]\n';
    prompt += '- Epistemological Integrity (30%): [score] — [1-2 sentence justification]\n';
    prompt += '- Source Integrity (20%): [score] — [1-2 sentence justification]\n';
    prompt += '- Logical Integrity (10%): [score] — [1-2 sentence justification]\n';
    prompt += '- Weighted Calculation: ([EH] × 0.40) + ([EI] × 0.30) + ([SI] × 0.20) + ([LI] × 0.10) = [result]\n';
    prompt += '- **FINAL INTEGRITY SCORE: [X.X]** (one decimal from -1.0 to +1.0)\n\n';
    
    prompt += '**UNDERLYING TRUTH**\n';
    prompt += '[2-3 sentences on what is actually true about this topic as of ' + currentDate + ']\n\n';
    
    prompt += '**VERITAS ASSESSMENT**\n';
    prompt += '[Your main conclusion in 2-3 sentences]\n\n';
    
    prompt += '**EVIDENCE ANALYSIS**\n';
    prompt += '[Key evidence for and against, with source quality notes]\n\n';
    
    prompt += '**TRUTH DISTORTION ANALYSIS**\n';
    prompt += '[Any of the three patterns detected with specific examples, or "None detected"]\n\n';
    
    prompt += '**WHAT WE CAN BE CONFIDENT ABOUT**\n';
    prompt += '[Claims with strong evidentiary support]\n\n';
    
    prompt += '**WHAT REMAINS GENUINELY UNCERTAIN**\n';
    prompt += '[Areas where evidence is limited or conflicting]\n\n';
    
    prompt += '**BOTTOM LINE**\n';
    prompt += '[Final assessment for a general reader]\n\n';
    
    prompt += '**KEY SOURCES REFERENCED**\n';
    prompt += '[List main sources consulted with dates where relevant]\n\n';
    
    // SECTION 9: STRUCTURED OUTPUT
    prompt += '## SECTION 9: STRUCTURED OUTPUT\n\n';
    prompt += 'After your markdown assessment, output the following JSON block:\n\n';
    prompt += '<!-- VERITAS_STRUCTURED_OUTPUT -->\n';
    prompt += '```json\n';
    prompt += '{\n';
    prompt += '  "claimType": "factual|subjective|value_judgment|prediction",\n';
    prompt += '  "confidence": "High|Medium|Low",\n';
    prompt += '  "quickTake": "2-3 sentence headline summary for casual readers",\n';
    prompt += '  "baselineIntegrityNote": "What the bare claim reveals about epistemological honesty",\n';
    prompt += '  "holes": [\n';
    prompt += '    {"text": "Gap 1 headline", "detail": "Expanded explanation", "priority": 1},\n';
    prompt += '    {"text": "Gap 2 headline", "detail": "Expanded explanation", "priority": 1},\n';
    prompt += '    {"text": "Gap 3 headline", "detail": "Expanded explanation", "priority": 1},\n';
    prompt += '    {"text": "Gap 4 headline", "detail": "Expanded explanation", "priority": 2},\n';
    prompt += '    {"text": "Gap 5 headline", "detail": "Expanded explanation", "priority": 2},\n';
    prompt += '    {"text": "Gap 6 headline", "detail": "Expanded explanation", "priority": 2},\n';
    prompt += '    {"text": "Gap 7 headline", "detail": "Expanded explanation", "priority": 3},\n';
    prompt += '    {"text": "Gap 8 headline", "detail": "Expanded explanation", "priority": 3},\n';
    prompt += '    {"text": "Gap 9 headline", "detail": "Expanded explanation", "priority": 3}\n';
    prompt += '  ],\n';
    prompt += '  "questions": [\n';
    prompt += '    {"text": "Question 1", "detail": "Why this matters", "priority": 1},\n';
    prompt += '    {"text": "Question 2", "detail": "Why this matters", "priority": 1},\n';
    prompt += '    {"text": "Question 3", "detail": "Why this matters", "priority": 1},\n';
    prompt += '    {"text": "Question 4", "detail": "Why this matters", "priority": 2},\n';
    prompt += '    {"text": "Question 5", "detail": "Why this matters", "priority": 2},\n';
    prompt += '    {"text": "Question 6", "detail": "Why this matters", "priority": 2},\n';
    prompt += '    {"text": "Question 7", "detail": "Why this matters", "priority": 3},\n';
    prompt += '    {"text": "Question 8", "detail": "Why this matters", "priority": 3},\n';
    prompt += '    {"text": "Cui bono — who benefits from you believing this?", "detail": "Always consider framing incentives", "priority": 3}\n';
    prompt += '  ],\n';
    prompt += '  "fiveWs": {\n';
    prompt += '    "who": "Key actors and stakeholders",\n';
    prompt += '    "what": "Core facts and claims",\n';
    prompt += '    "where": "Geographic/institutional context",\n';
    prompt += '    "when": "Timeline and temporal context",\n';
    prompt += '    "how": "Mechanisms and processes"\n';
    prompt += '  },\n';
    prompt += '  "trackBReserved": {\n';
    prompt += '    "criteriaUsed": [],\n';
    prompt += '    "perCriteriaScores": {}\n';
    prompt += '  }\n';
    prompt += '}\n';
    prompt += '```\n';
    
    return prompt;
}

// ============================================
// TRACK B PROMPT BUILDER
// ============================================
function buildTrackBPrompt(question, claimType, criteria, customCriteria) {
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    var criteriaSet = CRITERIA_SETS[claimType];
    if (!criteriaSet) {
        criteriaSet = CRITERIA_SETS.qualification;
    }
    
    var criteriaToAssess = [];
    criteria.forEach(function(c) {
        if (criteriaSet.criteria[c]) {
            criteriaToAssess.push(criteriaSet.criteria[c]);
        }
    });
    
    customCriteria.forEach(function(c) {
        criteriaToAssess.push({
            id: 'custom_' + c.replace(/\s+/g, '_').toLowerCase(),
            label: c,
            description: 'User-defined criterion: ' + c
        });
    });
    
    var prompt = 'You are VERITAS operating in TRACK B mode — Criteria-Specific Subjective Assessment.\n\n';
    prompt += '**TODAY IS: ' + currentDate + '**\n\n';
    
    prompt += '## TRACK B: CRITERIA-SPECIFIC ASSESSMENT\n\n';
    prompt += 'Unlike Track A (factual verification), Track B assesses subjective claims through specific criteria.\n';
    prompt += 'The user has selected which criteria matter to THEM — your job is to assess ONLY those criteria.\n\n';
    
    prompt += '## CLAIM TYPE: ' + criteriaSet.label.toUpperCase() + '\n\n';
    prompt += '## CRITERIA TO ASSESS (Selected by User):\n\n';
    
    criteriaToAssess.forEach(function(c, i) {
        prompt += (i + 1) + '. **' + c.label + '**: ' + c.description + '\n';
    });
    
    prompt += '\n## CRITERIA NOT SELECTED (Acknowledge but do not assess):\n';
    Object.keys(criteriaSet.criteria).forEach(function(key) {
        var isSelected = criteria.includes(key);
        if (!isSelected) {
            prompt += '- ' + criteriaSet.criteria[key].label + '\n';
        }
    });
    
    prompt += '\n## YOUR TASK\n\n';
    prompt += 'Evaluate this claim: **' + question + '**\n\n';
    
    prompt += '## SCORING RULES\n\n';
    prompt += 'For EACH selected criterion:\n';
    prompt += '- Score from -10 to +10 (same scale as Reality Score)\n';
    prompt += '- +10 = Criterion strongly supports the claim\n';
    prompt += '- 0 = Criterion is neutral or indeterminate\n';
    prompt += '- -10 = Criterion strongly contradicts the claim\n';
    prompt += '- Confidence: High/Medium/Low\n\n';
    
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    
    prompt += '**TEMPORAL VERIFICATION COMPLETED**\n';
    prompt += '[Confirm what you searched to verify current status]\n\n';
    
    prompt += '**CLAIM BEING TESTED**\n';
    prompt += '[State the specific claim]\n\n';
    
    prompt += '**CRITERIA ASSESSMENTS**\n\n';
    
    criteriaToAssess.forEach(function(c) {
        prompt += '### ' + c.label + '\n';
        prompt += '- **Score:** [X] (-10 to +10)\n';
        prompt += '- **Confidence:** [High/Medium/Low]\n';
        prompt += '- **Summary:** [2-3 sentences]\n';
        prompt += '- **Key Evidence:** [What supports this score]\n\n';
    });
    
    prompt += '**CRITERIA NOT ASSESSED**\n';
    prompt += '[List the criteria the user did not select, and briefly note what they might reveal if assessed]\n\n';
    
    prompt += '**FULL PICTURE SYNTHESIS**\n';
    prompt += '[2-3 sentences synthesizing the assessed criteria WITHOUT providing an aggregate score]\n';
    prompt += '[Acknowledge if criteria tell different stories]\n\n';
    
    prompt += '**WHAT YOU SHOULD ALSO CONSIDER**\n';
    prompt += '[Questions the user should ask that weren\'t covered by selected criteria]\n\n';
    
    prompt += '## STRUCTURED OUTPUT\n\n';
    prompt += 'After your markdown assessment, output the following JSON block:\n\n';
    prompt += '<!-- VERITAS_STRUCTURED_OUTPUT -->\n';
    prompt += '```json\n';
    prompt += '{\n';
    prompt += '  "track": "b",\n';
    prompt += '  "claimType": "' + claimType + '",\n';
    prompt += '  "criteriaAssessed": [\n';
    
    criteriaToAssess.forEach(function(c, i) {
        prompt += '    {\n';
        prompt += '      "id": "' + c.id + '",\n';
        prompt += '      "label": "' + c.label + '",\n';
        prompt += '      "score": 0,\n';
        prompt += '      "confidence": "Medium",\n';
        prompt += '      "summary": "...",\n';
        prompt += '      "evidence": "..."\n';
        prompt += '    }' + (i < criteriaToAssess.length - 1 ? ',' : '') + '\n';
    });
    
    prompt += '  ],\n';
    prompt += '  "criteriaNotAssessed": [' + Object.keys(criteriaSet.criteria).filter(function(k) { return !criteria.includes(k); }).map(function(k) { return '"' + criteriaSet.criteria[k].label + '"'; }).join(', ') + '],\n';
    prompt += '  "divergence": {\n';
    prompt += '    "spread": 0,\n';
    prompt += '    "triggered": false,\n';
    prompt += '    "message": ""\n';
    prompt += '  },\n';
    prompt += '  "fullPicture": "Synthesis paragraph",\n';
    prompt += '  "additionalQuestions": ["Question 1", "Question 2", "Question 3"]\n';
    prompt += '}\n';
    prompt += '```\n';
    prompt += '\nIMPORTANT: Calculate the "spread" as the difference between the highest and lowest criterion scores. If spread >= 4, set "triggered" to true and provide a message like "These criteria tell different stories."\n';
    
    return prompt;
}

// ============================================
// CUSTOM CRITERIA VALIDATION
// ============================================
function validateCustomCriteria(criterion) {
    if (!criterion || criterion.trim().length < 3) {
        return { valid: false, message: "What was that? Did you switch languages on me or what? Try something I can actually assess — like 'crisis management' or 'bipartisan cooperation.'" };
    }
    
    var cleaned = criterion.trim().toLowerCase();
    var vowelCount = (cleaned.match(/[aeiou]/g) || []).length;
    var letterCount = (cleaned.match(/[a-z]/g) || []).length;
    
    if (letterCount > 5 && vowelCount / letterCount < 0.15) {
        return { valid: false, message: "What was that? Did you switch languages on me or what? Try something I can actually assess — like 'crisis management' or 'bipartisan cooperation.'" };
    }
    
    var specialCount = (cleaned.match(/[^a-z0-9\s]/g) || []).length;
    if (specialCount > cleaned.length * 0.3) {
        return { valid: false, message: "What was that? Did you switch languages on me or what? Try something I can actually assess — like 'crisis management' or 'bipartisan cooperation.'" };
    }
    
    return { valid: true };
}

// ============================================
// STRUCTURED OUTPUT PARSER
// ============================================
function parseStructuredOutput(assessment) {
    var result = {
        claimType: null,
        confidence: null,
        quickTake: null,
        baselineIntegrityNote: null,
        holes: [],
        questions: [],
        fiveWs: null,
        trackB: null
    };
    
    try {
        var jsonMarker = assessment.indexOf('<!-- VERITAS_STRUCTURED_OUTPUT -->');
        if (jsonMarker === -1) return result;
        
        var jsonStart = assessment.indexOf('```json', jsonMarker);
        var jsonEnd = assessment.indexOf('```', jsonStart + 7);
        
        if (jsonStart === -1 || jsonEnd === -1) return result;
        
        var jsonStr = assessment.substring(jsonStart + 7, jsonEnd).trim();
        var parsed = JSON.parse(jsonStr);
        
        result.claimType = parsed.claimType || null;
        result.confidence = parsed.confidence || null;
        result.quickTake = parsed.quickTake || null;
        result.baselineIntegrityNote = parsed.baselineIntegrityNote || null;
        result.holes = parsed.holes || [];
        result.questions = parsed.questions || [];
        result.fiveWs = parsed.fiveWs || null;
        
        if (parsed.track === 'b') {
            result.trackB = {
                claimType: parsed.claimType,
                criteriaAssessed: parsed.criteriaAssessed || [],
                criteriaNotAssessed: parsed.criteriaNotAssessed || [],
                divergence: parsed.divergence || { spread: 0, triggered: false },
                fullPicture: parsed.fullPicture || '',
                additionalQuestions: parsed.additionalQuestions || []
            };
        }
        
    } catch (e) {
        console.error('Failed to parse structured output:', e);
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
        var userApiKey = body.userApiKey || '';
        var track = body.track || 'a';
        var claimType = body.claimType || 'qualification';
        var criteria = body.criteria || [];
        var customCriteria = body.customCriteria || [];
        
        if (!question && !articleText) {
            return res.status(400).json({ error: 'Please provide a question or article text' });
        }
        
        for (var i = 0; i < customCriteria.length; i++) {
            var validation = validateCustomCriteria(customCriteria[i]);
            if (!validation.valid) {
                return res.status(400).json({ error: validation.message, field: 'customCriteria' });
            }
        }
        
        var apiKey = userApiKey;
        if (!apiKey) {
            var rateCheck = checkRateLimit(getRateLimitKey(req));
            if (!rateCheck.allowed) {
                return res.status(429).json({ error: 'Daily free limit reached. Add your own API key for unlimited use.', resetAt: rateCheck.resetAt });
            }
            apiKey = process.env.ANTHROPIC_API_KEY;
        }
        
        if (!apiKey) {
            return res.status(500).json({ error: 'No API key configured' });
        }
        
        var anthropic = new Anthropic({ apiKey: apiKey });
        
        var prompt;
        if (track === 'b') {
            prompt = buildTrackBPrompt(question, claimType, criteria, customCriteria);
        } else {
            prompt = buildTrackAPrompt(question, articleText);
        }
        
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
        for (var j = 0; j < message.content.length; j++) {
            if (message.content[j].type === 'text') {
                assessment += message.content[j].text;
            }
        }
        
        if (!assessment) {
            return res.status(500).json({ error: 'No assessment generated' });
        }
        
        var realityMatch = assessment.match(/FINAL REALITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        var integrityMatch = assessment.match(/FINAL INTEGRITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        
        if (!realityMatch) {
            realityMatch = assessment.match(/REALITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        }
        if (!integrityMatch) {
            integrityMatch = assessment.match(/EPISTEMOLOGICAL INTEGRITY SCORE:\s*\[?([+-]?\d+(?:\.\d+)?)\]?/i);
        }
        
        var structured = parseStructuredOutput(assessment);
        
        return res.status(200).json({
            success: true,
            track: track,
            assessment: assessment,
            realityScore: realityMatch ? parseFloat(realityMatch[1]) : null,
            integrityScore: integrityMatch ? parseFloat(integrityMatch[1]) : null,
            claimType: structured.claimType,
            confidence: structured.confidence,
            quickTake: structured.quickTake,
            structured: structured,
            question: question || 'Article Assessment',
            assessmentDate: new Date().toISOString(),
            assessor: 'INITIAL',
            criteriaSet: track === 'b' ? CRITERIA_SETS[claimType] : null
        });
        
    } catch (err) {
        console.error('Assessment error:', err);
        return res.status(500).json({ error: 'Assessment failed', message: err.message });
    }
};

module.exports.CRITERIA_SETS = CRITERIA_SETS;
