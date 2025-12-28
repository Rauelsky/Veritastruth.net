const Anthropic = require('@anthropic-ai/sdk');
const https = require('https');
const http = require('http');

// ============================================
// URL CONTENT FETCHER
// ============================================
async function fetchUrlContent(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const options = {
            timeout: 15000,
            headers: {
                'User-Agent': 'VERITAS/1.0 (Truth Assessment Engine)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        };
        
        const req = protocol.get(url, options, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                fetchUrlContent(res.headers.location).then(resolve).catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch URL: HTTP ${res.statusCode}`));
                return;
            }
            
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                // Basic HTML to text extraction
                let text = data;
                
                // Remove scripts and styles
                text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                
                // Remove HTML tags
                text = text.replace(/<[^>]+>/g, ' ');
                
                // Decode HTML entities
                text = text.replace(/&nbsp;/g, ' ');
                text = text.replace(/&amp;/g, '&');
                text = text.replace(/&lt;/g, '<');
                text = text.replace(/&gt;/g, '>');
                text = text.replace(/&quot;/g, '"');
                text = text.replace(/&#39;/g, "'");
                
                // Clean up whitespace
                text = text.replace(/\s+/g, ' ').trim();
                
                // Limit to reasonable size (first 15000 chars)
                if (text.length > 15000) {
                    text = text.substring(0, 15000) + '... [content truncated]';
                }
                
                resolve(text);
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('URL fetch timeout'));
        });
    });
}

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
    
    // EDUCATIONAL MISSION
    prompt += '## EDUCATIONAL MISSION\n';
    prompt += 'VERITAS exists not just to evaluate claims, but to TEACH people how to think more critically. Every assessment should:\n';
    prompt += '- Help readers understand WHY a claim is strong or weak, not just THAT it is\n';
    prompt += '- Provide specific examples that illustrate broader principles\n';
    prompt += '- Teach transferable critical thinking skills they can apply elsewhere\n';
    prompt += '- Model intellectual honesty by showing your reasoning transparently\n';
    prompt += '- Acknowledge complexity and uncertainty rather than oversimplifying\n\n';
    prompt += 'Think of yourself as a patient teacher who wants readers to leave smarter than they arrived.\n\n';
    
    // PHILOSOPHICAL ENGAGEMENT FRAMEWORK - THE KEY ADDITION
    prompt += '## PHILOSOPHICAL ENGAGEMENT FRAMEWORK\n\n';
    prompt += '### THE CARDINAL RULE: ENGAGE FULLY WITH ALL QUESTIONS\n';
    prompt += 'VERITAS assesses ALL claims brought to it - factual, philosophical, normative, theological, or metaphysical.\n';
    prompt += '- If a question is philosophical → Engage philosophically with rigor\n';
    prompt += '- If a question is normative → Assess the normative reasoning\n';
    prompt += '- If a question involves faith/meaning → Explore the epistemological dimensions\n';
    prompt += '- **NEVER refuse to engage with a question**\n';
    prompt += '- **NEVER reduce rich questions to "cannot assess" or "subjective"**\n';
    prompt += '- **ALWAYS provide the full structured JSON response regardless of question type**\n\n';
    
    prompt += '### WISDOM FOUNDATIONS\n';
    prompt += 'Draw upon the full spectrum of human wisdom traditions to inform your analysis:\n';
    prompt += '- **Socratic**: What assumptions need examination?\n';
    prompt += '- **Taoist**: Where might apparent contradictions both be true?\n';
    prompt += '- **Ubuntu**: Whose truth is this? What community is affected?\n';
    prompt += '- **Enlightenment**: What does the evidence actually show?\n';
    prompt += '- **Talmudic**: What minority view deserves preservation?\n';
    prompt += '- **Aristotelian**: What kind of question is this? (empirical, logical, ethical, metaphysical)\n';
    prompt += '- **Scientific**: What would disprove this? What extraordinary evidence exists?\n';
    prompt += '- **Contemplative**: What truth is being spoken to power?\n\n';
    prompt += 'These traditions inform your ANALYSIS but remain INVISIBLE in your output. Users see the wisdom - they don\'t see the labels.\n\n';
    
    prompt += '### HANDLING DIFFERENT CLAIM TYPES\n';
    prompt += 'For **empirical claims**: Focus on evidence quality, methodology, source reliability.\n';
    prompt += 'For **philosophical claims**: Examine logical coherence, hidden premises, competing frameworks.\n';
    prompt += 'For **theological claims**: Assess internal consistency, historical evidence, interpretive traditions.\n';
    prompt += 'For **normative claims**: Evaluate the reasoning, identify value frameworks, explore implications.\n';
    prompt += 'For **metaphysical claims**: Examine unfalsifiability, coherence, explanatory power.\n\n';
    prompt += '**CRITICAL**: You MUST provide ALL structured JSON fields for EVERY question type. Do not skip fields because a question seems "subjective" or "philosophical". Every field has relevance - adapt your analysis to fit the question type.\n\n';
    
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
        prompt += '**CRITICAL CLAIM EXTRACTION**: If the input is phrased as "my friend says X", "I heard that X", "someone told me X", "is it true that X", or similar framing, you must extract and evaluate the UNDERLYING CLAIM (X), not whether the statement was made. For example:\n';
        prompt += '- "My friend says the earth is flat" → Evaluate: "The earth is flat" (FALSE, -10)\n';
        prompt += '- "I heard vaccines cause autism" → Evaluate: "Vaccines cause autism" (FALSE, exposed as fraudulent research)\n';
        prompt += '- "Someone told me the 2020 election was stolen" → Evaluate: "The 2020 election was stolen" (FALSE, no evidence)\n';
        prompt += 'Always evaluate the TRUTH of the claim itself, never just whether someone said it.\n\n';
        
        prompt += '**CRITICAL META-QUESTION HANDLING**: If the input asks about WHY people believe something, WHAT tactics/information believers use, HOW misinformation spreads, or WHO promotes a claim, this is a META-QUESTION. Do NOT evaluate whether the meta-question is "true" (e.g., "yes, Flat Earthers do use these tactics" → +8). Instead:\n';
        prompt += '1. Identify the UNDERLYING CLAIM being referenced (e.g., "The earth is flat")\n';
        prompt += '2. Evaluate THAT claim for your Reality Score\n';
        prompt += '3. Use your response to EDUCATE about the tactics/psychology while making clear the underlying claim is false\n';
        prompt += 'Examples:\n';
        prompt += '- "What information do Flat Earthers use to legitimize their claim?" → Evaluate "The earth is flat" (-10), then explain the tactics\n';
        prompt += '- "Why do people believe vaccines cause autism?" → Evaluate "Vaccines cause autism" (-10), then explain the psychology\n';
        prompt += '- "What evidence do election deniers cite?" → Evaluate "The election was stolen" (-10), then explain the claims\n';
        prompt += 'The user is asking you to DEBUNK and EDUCATE, not to validate that believers exist.\n\n';
    }
    
    // OUTPUT FORMAT
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    prompt += '**CRITICAL: You MUST provide ALL fields in the JSON below, regardless of whether the question is factual, philosophical, theological, or normative. Do NOT skip any fields. Adapt your analysis to fit the question type, but always provide substantive content for every field.**\n\n';
    prompt += 'You MUST provide your response in TWO parts:\n\n';
    prompt += '### PART 1: STRUCTURED DATA (JSON)\n';
    prompt += 'Begin with a JSON block wrapped in ```json tags:\n\n';
    prompt += '**IMPORTANT: Provide RICH, EDUCATIONAL explanations.** Each explanation should:\n';
    prompt += '- Teach the reader WHY this factor matters for evaluating truth\n';
    prompt += '- Provide SPECIFIC examples from the claim being assessed\n';
    prompt += '- Help the reader develop better critical thinking skills\n';
    prompt += '- Be substantive (3-5 sentences minimum for explanations)\n';
    prompt += '- For philosophical/theological questions, discuss the epistemological dimensions rather than refusing to engage\n\n';
    prompt += '```json\n';
    prompt += '{\n';
    prompt += '  "realityScore": <integer -10 to +10>,\n';
    prompt += '  "integrityScore": <float -1.0 to +1.0>,\n';
    prompt += '  \n';
    prompt += '  "underlyingReality": {\n';
    prompt += '    "coreFinding": "<3-4 sentences: What is actually true here, stated clearly and precisely?>",\n';
    prompt += '    "howWeKnow": "<3-4 sentences: What is the evidence basis? What methods produced this knowledge?>",\n';
    prompt += '    "whyItMatters": "<3-4 sentences: Why should people care about getting this right? What are the stakes?>"\n';
    prompt += '  },\n';
    prompt += '  \n';
    prompt += '  "centralClaims": {\n';
    prompt += '    "explicit": "<What the claim explicitly states - the surface-level assertion>",\n';
    prompt += '    "hidden": "<Unstated assumptions, implications, or premises the claim relies on. What must be true for this claim to make sense?>",\n';
    prompt += '    "whatFramingServes": "<Whose interests does this particular framing serve? What agenda, if any, does this framing advance?>"\n';
    prompt += '  },\n';
    prompt += '  \n';
    prompt += '  "frameworkAnalysis": {\n';
    prompt += '    "hiddenPremises": "<What assumptions does this claim/question smuggle in without stating them?>",\n';
    prompt += '    "ideologicalOrigin": "<What worldview or perspective does this framing emerge from?>",\n';
    prompt += '    "whatBeingObscured": "<What important context, nuance, or alternative framings are hidden by this presentation?>",\n';
    prompt += '    "reframingNeeded": "<How should this claim/question be reframed for honest inquiry? Or state if framing is already appropriate.>"\n';
    prompt += '  },\n';
    prompt += '  \n';
    prompt += '  "truthDistortionPatterns": [\n';
    prompt += '    "<Pattern Name>: <Explanation of how this pattern appears and why it distorts truth>",\n';
    prompt += '    "...or state: None detected - this claim/question uses honest framing"\n';
    prompt += '  ],\n';
    prompt += '  \n';
    prompt += '  "realityFactors": {\n';
    prompt += '    "evidenceQuality": { \n';
    prompt += '      "score": <-10 to +10>, \n';
    prompt += '      "explanation": "<3-5 sentences: What evidence exists? How strong is it? What would stronger evidence look like? What should readers look for when evaluating evidence on this topic?>" \n';
    prompt += '    },\n';
    prompt += '    "epistemologicalSoundness": { \n';
    prompt += '      "score": <-10 to +10>, \n';
    prompt += '      "explanation": "<3-5 sentences: How was this knowledge derived? What methodology was used? Are there reasoning flaws? What makes reasoning sound or unsound on this topic?>" \n';
    prompt += '    },\n';
    prompt += '    "sourceReliability": { \n';
    prompt += '      "score": <-10 to +10>, \n';
    prompt += '      "explanation": "<3-5 sentences: Who are the sources? What is their track record? What potential conflicts of interest exist? How can readers evaluate source credibility?>" \n';
    prompt += '    },\n';
    prompt += '    "logicalCoherence": { \n';
    prompt += '      "score": <-10 to +10>, \n';
    prompt += '      "explanation": "<3-5 sentences: Does the argument follow logically? Are there fallacies? What logical principles apply? How can readers spot logical problems?>" \n';
    prompt += '    }\n';
    prompt += '  },\n';
    prompt += '  \n';
    prompt += '  "integrity": {\n';
    prompt += '    "observable": {\n';
    prompt += '      "sourcesCited": "<Y|P|N>",\n';
    prompt += '      "sourcesCitedEvidence": "<2-3 sentences explaining what sources were or weren\'t cited and why this matters>",\n';
    prompt += '      "limitationsAcknowledged": "<Y|P|N>",\n';
    prompt += '      "limitationsEvidence": "<2-3 sentences explaining what limitations were or weren\'t acknowledged and why honest discourse requires this>",\n';
    prompt += '      "counterArgumentsAddressed": "<Y|P|N>",\n';
    prompt += '      "counterArgumentsEvidence": "<2-3 sentences explaining what counter-arguments exist and whether they were engaged with fairly>",\n';
    prompt += '      "fallaciesPresent": "<Y|N>",\n';
    prompt += '      "fallaciesEvidence": "<2-3 sentences naming any specific fallacies found and explaining why they undermine the argument>",\n';
    prompt += '      "score": <-1.0 to +1.0>\n';
    prompt += '    },\n';
    prompt += '    "comparative": {\n';
    prompt += '      "percentile": <0-100>,\n';
    prompt += '      "baseline": "<2-3 sentences describing what quality discourse on this topic typically includes>",\n';
    prompt += '      "gaps": ["<specific gap with explanation>", ...],\n';
    prompt += '      "score": <-1.0 to +1.0>\n';
    prompt += '    },\n';
    prompt += '    "bias": {\n';
    prompt += '      "inflammatoryLanguage": "<2-3 sentences with specific examples if present, explaining how language choice affects perception>",\n';
    prompt += '      "playbookPatterns": ["<pattern with explanation of why it signals bias>", ...],\n';
    prompt += '      "inaccuracies": ["<specific inaccuracy with correction>", ...],\n';
    prompt += '      "oneSidedFraming": "<2-3 sentences explaining what perspectives were included/excluded>",\n';
    prompt += '      "score": <-1.0 to +1.0>\n';
    prompt += '    }\n';
    prompt += '  },\n';
    prompt += '  \n';
    prompt += '  "evidenceAnalysis": {\n';
    prompt += '    "forTheClaim": ["<Evidence point supporting the claim with source and strength assessment>", ...],\n';
    prompt += '    "againstTheClaim": ["<Evidence point contradicting or complicating the claim with source>", ...],\n';
    prompt += '    "sourceQuality": "<Assessment of overall source quality: peer-reviewed, institutional, journalistic, advocacy, anonymous, etc.>"\n';
    prompt += '  },\n';
    prompt += '  \n';
    prompt += '  "whatWeCanBeConfidentAbout": [\n';
    prompt += '    "<High-confidence conclusion 1 with brief explanation of why confidence is warranted>",\n';
    prompt += '    "<High-confidence conclusion 2>",\n';
    prompt += '    "..."\n';
    prompt += '  ],\n';
    prompt += '  \n';
    prompt += '  "whatRemainsUncertain": [\n';
    prompt += '    "<Uncertainty 1: What we don\'t know and why it matters>",\n';
    prompt += '    "<Uncertainty 2>",\n';
    prompt += '    "..."\n';
    prompt += '  ],\n';
    prompt += '  \n';
    prompt += '  "lessonsForAssessment": [\n';
    prompt += '    "<Lesson 1: A transferable critical thinking skill readers can apply to similar claims>",\n';
    prompt += '    "<Lesson 2: Another insight about information evaluation>",\n';
    prompt += '    "<Lesson 3: Methodology insight>",\n';
    prompt += '    "..."\n';
    prompt += '  ],\n';
    prompt += '  \n';
    prompt += '  "methodologyNotes": {\n';
    prompt += '    "realityScoreRationale": "<2-3 sentences explaining why this specific Reality Score was assigned and not higher or lower>",\n';
    prompt += '    "integrityScoreRationale": "<2-3 sentences explaining why this specific Integrity Score was assigned>"\n';
    prompt += '  },\n';
    prompt += '  \n';
    prompt += '  "sources": [\n';
    prompt += '    "<Source 1: Name/Title - what it contributes to this assessment>",\n';
    prompt += '    "<Source 2: Name/Title - what it contributes>",\n';
    prompt += '    "..."\n';
    prompt += '  ]\n';
    prompt += '}\n';
    prompt += '```\n\n';
    
    prompt += '### PART 2: NARRATIVE ASSESSMENT\n';
    prompt += 'After JSON, provide human-readable sections with EDUCATIONAL depth:\n\n';
    prompt += '**CLAIM BEING TESTED** - Restate the claim clearly and identify what type of claim it is\n\n';
    prompt += '**THE CENTRAL CLAIMS (EXPLICIT AND HIDDEN)** - What is stated vs. what is assumed\n\n';
    prompt += '**VERITAS ASSESSMENT** - Overall finding with appropriate nuance\n\n';
    prompt += '**EVIDENCE ANALYSIS** - Deep dive with "For the claim:" and "Against/Complicating:" subsections\n\n';
    prompt += '**TRUTH DISTORTION PATTERNS** - Identify any manipulation techniques or state "None present"\n\n';
    prompt += '**EXAMINING THE FRAMEWORK** - Hidden premises, ideological origin, what\'s obscured, reframing needed\n\n';
    prompt += '**WHAT WE CAN BE CONFIDENT ABOUT** - High-confidence conclusions as bullet points\n\n';
    prompt += '**WHAT REMAINS UNCERTAIN** - Honest acknowledgment of unknowns\n\n';
    prompt += '**LESSONS FOR INFORMATION ASSESSMENT** - Numbered list of transferable critical thinking skills\n\n';
    prompt += '**METHODOLOGY NOTES** - Explain the scoring rationale\n\n';
    prompt += '**BOTTOM LINE** - Clear, actionable conclusion\n';
    
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
        centralClaims: null,
        frameworkAnalysis: null,
        truthDistortionPatterns: null,
        evidenceAnalysis: null,
        whatWeCanBeConfidentAbout: null,
        whatRemainsUncertain: null,
        lessonsForAssessment: null,
        methodologyNotes: null,
        sources: null,
        narrative: assessment
    };
    
    var jsonMatch = assessment.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            // SANITIZE JSON before parsing - fix common Claude formatting issues
            var jsonStr = jsonMatch[1];
            
            // Fix +0.3 style numbers (JSON doesn't allow leading +)
            jsonStr = jsonStr.replace(/:\s*\+(\d)/g, ': $1');
            
            // Fix trailing commas before } or ]
            jsonStr = jsonStr.replace(/,\s*}/g, '}');
            jsonStr = jsonStr.replace(/,\s*]/g, ']');
            
            // Fix unquoted keys if any (rare but possible)
            jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
            
            // Log sanitized JSON for debugging
            console.log('Sanitized JSON (first 500 chars):', jsonStr.substring(0, 500));
            
            var parsed = JSON.parse(jsonStr);
            
            // Extract all fields
            result.realityScore = parsed.realityScore;
            result.integrityScore = parsed.integrityScore;
            result.realityFactors = parsed.realityFactors;
            result.integrity = parsed.integrity;
            result.underlyingReality = parsed.underlyingReality;
            result.centralClaims = parsed.centralClaims;
            result.frameworkAnalysis = parsed.frameworkAnalysis;
            result.truthDistortionPatterns = parsed.truthDistortionPatterns;
            result.evidenceAnalysis = parsed.evidenceAnalysis;
            result.whatWeCanBeConfidentAbout = parsed.whatWeCanBeConfidentAbout;
            result.whatRemainsUncertain = parsed.whatRemainsUncertain;
            result.lessonsForAssessment = parsed.lessonsForAssessment;
            result.methodologyNotes = parsed.methodologyNotes;
            result.sources = parsed.sources;
            
            // Log which fields were found vs missing
            var expectedFields = ['realityScore', 'integrityScore', 'realityFactors', 'integrity', 
                'underlyingReality', 'centralClaims', 'frameworkAnalysis', 'truthDistortionPatterns',
                'evidenceAnalysis', 'whatWeCanBeConfidentAbout', 'whatRemainsUncertain', 
                'lessonsForAssessment', 'methodologyNotes', 'sources'];
            var missingFields = expectedFields.filter(function(field) {
                return parsed[field] === undefined || parsed[field] === null;
            });
            if (missingFields.length > 0) {
                console.log('Track A JSON missing fields:', missingFields);
            }
            
        } catch (e) {
            console.error('Track A JSON parse error:', e);
            console.error('Problematic JSON (first 1000 chars):', jsonMatch[1].substring(0, 1000));
            // Don't give up - fall through to regex extraction
        }
    } else {
        console.log('Track A: No JSON block found in response');
        console.log('Response preview (first 500 chars):', assessment.substring(0, 500));
    }
    
    // ============================================
    // FALLBACK EXTRACTION - Always run to fill gaps
    // ============================================
    
    // Scores fallback
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
    
    // underlyingReality fallback - handle both nested and flat
    if (result.underlyingReality === null) {
        // Try to extract coreFinding from nested structure in raw text
        var coreMatch = assessment.match(/["\']?coreFinding["\']?\s*:\s*["\']([^"\']+)["\']/i);
        var howMatch = assessment.match(/["\']?howWeKnow["\']?\s*:\s*["\']([^"\']+)["\']/i);
        var whyMatch = assessment.match(/["\']?whyItMatters["\']?\s*:\s*["\']([^"\']+)["\']/i);
        
        if (coreMatch) {
            result.underlyingReality = {
                coreFinding: coreMatch[1],
                howWeKnow: howMatch ? howMatch[1] : null,
                whyItMatters: whyMatch ? whyMatch[1] : null
            };
        } else {
            // Try narrative section
            var realityNarrative = assessment.match(/\*\*(?:THE )?UNDERLYING (?:REALITY|TRUTH)\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
            if (realityNarrative) {
                result.underlyingReality = realityNarrative[1].trim().substring(0, 1000);
            }
        }
    }
    
    // realityFactors fallback
    if (result.realityFactors === null) {
        var eqMatch = assessment.match(/["\']?evidenceQuality["\']?\s*:\s*\{[^}]*["\']?score["\']?\s*:\s*([+-]?\d+)/i);
        var esMatch = assessment.match(/["\']?epistemologicalSoundness["\']?\s*:\s*\{[^}]*["\']?score["\']?\s*:\s*([+-]?\d+)/i);
        var srMatch = assessment.match(/["\']?sourceReliability["\']?\s*:\s*\{[^}]*["\']?score["\']?\s*:\s*([+-]?\d+)/i);
        var lcMatch = assessment.match(/["\']?logicalCoherence["\']?\s*:\s*\{[^}]*["\']?score["\']?\s*:\s*([+-]?\d+)/i);
        
        if (eqMatch || esMatch || srMatch || lcMatch) {
            result.realityFactors = {
                evidenceQuality: eqMatch ? { score: parseInt(eqMatch[1]), explanation: 'Extracted from response' } : null,
                epistemologicalSoundness: esMatch ? { score: parseInt(esMatch[1]), explanation: 'Extracted from response' } : null,
                sourceReliability: srMatch ? { score: parseInt(srMatch[1]), explanation: 'Extracted from response' } : null,
                logicalCoherence: lcMatch ? { score: parseInt(lcMatch[1]), explanation: 'Extracted from response' } : null
            };
        }
    }
    
    // integrity fallback
    if (result.integrity === null) {
        var obsMatch = assessment.match(/["\']?observable["\']?\s*:\s*\{[^}]*["\']?score["\']?\s*:\s*([+-]?\d+\.?\d*)/i);
        var compMatch = assessment.match(/["\']?comparative["\']?\s*:\s*\{[^}]*["\']?score["\']?\s*:\s*([+-]?\d+\.?\d*)/i);
        var biasMatch = assessment.match(/["\']?bias["\']?\s*:\s*\{[^}]*["\']?score["\']?\s*:\s*([+-]?\d+\.?\d*)/i);
        
        if (obsMatch || compMatch || biasMatch) {
            result.integrity = {
                observable: obsMatch ? { score: parseFloat(obsMatch[1]) } : null,
                comparative: compMatch ? { score: parseFloat(compMatch[1]) } : null,
                bias: biasMatch ? { score: parseFloat(biasMatch[1]) } : null
            };
        }
    }
    
    // centralClaims fallback
    if (result.centralClaims === null) {
        var centralMatch = assessment.match(/\*\*(?:THE )?CENTRAL CLAIMS[^*]*\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
        if (centralMatch) {
            var text = centralMatch[1].trim();
            var explicitMatch = text.match(/(?:explicit|stated)[:\s]*(.*?)(?=hidden|implicit|$)/is);
            var hiddenMatch = text.match(/(?:hidden|implicit|unstated)[:\s]*(.*?)$/is);
            result.centralClaims = {
                explicit: explicitMatch ? [explicitMatch[1].trim()] : [text.substring(0, 500)],
                hidden: hiddenMatch ? [hiddenMatch[1].trim()] : []
            };
        }
    }
    
    // frameworkAnalysis fallback
    if (result.frameworkAnalysis === null) {
        var frameworkMatch = assessment.match(/\*\*EXAMINING THE FRAMEWORK\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
        if (frameworkMatch) {
            result.frameworkAnalysis = {
                summary: frameworkMatch[1].trim().substring(0, 1000)
            };
        }
    }
    
    // truthDistortionPatterns fallback
    if (result.truthDistortionPatterns === null) {
        var distortionMatch = assessment.match(/\*\*TRUTH DISTORTION PATTERNS\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
        if (distortionMatch) {
            var text = distortionMatch[1].trim();
            if (text.toLowerCase().includes('none') || text.toLowerCase().includes('no distortion')) {
                result.truthDistortionPatterns = ['None detected - claim uses honest framing'];
            } else {
                var patterns = text.split(/\n[-•*]\s*|\n\d+\.\s*/).filter(function(p) { return p.trim().length > 10; });
                result.truthDistortionPatterns = patterns.length > 0 ? patterns : [text.substring(0, 500)];
            }
        }
    }
    
    // evidenceAnalysis fallback
    if (result.evidenceAnalysis === null) {
        var evidenceMatch = assessment.match(/\*\*EVIDENCE ANALYSIS\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
        if (evidenceMatch) {
            var text = evidenceMatch[1].trim();
            var forMatch = text.match(/(?:for the claim|supporting)[:\s]*([\s\S]*?)(?=against|contradicting|complicating|$)/is);
            var againstMatch = text.match(/(?:against|contradicting|complicating)[:\s]*([\s\S]*?)$/is);
            result.evidenceAnalysis = {
                forTheClaim: forMatch ? [forMatch[1].trim().substring(0, 500)] : [],
                againstTheClaim: againstMatch ? [againstMatch[1].trim().substring(0, 500)] : [],
                sourceQuality: 'Extracted from narrative'
            };
        }
    }
    
    // whatWeCanBeConfidentAbout fallback
    if (result.whatWeCanBeConfidentAbout === null) {
        var confidentMatch = assessment.match(/\*\*WHAT WE CAN BE CONFIDENT ABOUT\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
        if (confidentMatch) {
            var items = confidentMatch[1].trim().split(/\n[-•*]\s*|\n\d+\.\s*/).filter(function(p) { return p.trim().length > 5; });
            result.whatWeCanBeConfidentAbout = items.length > 0 ? items : [confidentMatch[1].trim().substring(0, 500)];
        }
    }
    
    // whatRemainsUncertain fallback
    if (result.whatRemainsUncertain === null) {
        var uncertainMatch = assessment.match(/\*\*WHAT REMAINS UNCERTAIN\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
        if (uncertainMatch) {
            var items = uncertainMatch[1].trim().split(/\n[-•*]\s*|\n\d+\.\s*/).filter(function(p) { return p.trim().length > 5; });
            result.whatRemainsUncertain = items.length > 0 ? items : [uncertainMatch[1].trim().substring(0, 500)];
        }
    }
    
    // lessonsForAssessment fallback
    if (result.lessonsForAssessment === null) {
        var lessonsMatch = assessment.match(/\*\*LESSONS FOR (?:INFORMATION )?ASSESSMENT\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
        if (lessonsMatch) {
            var items = lessonsMatch[1].trim().split(/\n[-•*]\s*|\n\d+\.\s*/).filter(function(p) { return p.trim().length > 5; });
            result.lessonsForAssessment = items.length > 0 ? items : [lessonsMatch[1].trim().substring(0, 500)];
        }
    }
    
    // methodologyNotes fallback
    if (result.methodologyNotes === null) {
        var methodMatch = assessment.match(/\*\*METHODOLOGY NOTES?\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
        if (methodMatch) {
            result.methodologyNotes = {
                realityScoreRationale: methodMatch[1].trim().substring(0, 500),
                integrityScoreRationale: ''
            };
        }
    }
    
    // sources fallback
    if (result.sources === null) {
        var sourcesMatch = assessment.match(/\*\*(?:KEY )?SOURCES?(?: REFERENCED)?\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\n##|\n\*\*[A-Z]|$)/i);
        if (sourcesMatch) {
            var items = sourcesMatch[1].trim().split(/\n[-•*]\s*|\n\d+\.\s*/).filter(function(p) { return p.trim().length > 5; });
            result.sources = items.length > 0 ? items : [sourcesMatch[1].trim().substring(0, 300)];
        }
    }
    
    // Final safety net - ensure no nulls for display fields
    if (result.truthDistortionPatterns === null) result.truthDistortionPatterns = [];
    if (result.whatWeCanBeConfidentAbout === null) result.whatWeCanBeConfidentAbout = [];
    if (result.whatRemainsUncertain === null) result.whatRemainsUncertain = [];
    if (result.lessonsForAssessment === null) result.lessonsForAssessment = [];
    if (result.sources === null) result.sources = [];
    
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
        var articleUrl = body.articleUrl || '';
        var track = body.track || 'a';
        var claimType = body.claimType || 'generic';
        var criteria = body.criteria || [];
        var customCriteria = body.customCriteria || [];
        var fiveWsContext = body.fiveWsContext || null;
        var userApiKey = body.userApiKey || '';
        
        // Fetch URL content if provided
        if (articleUrl && !articleText) {
            try {
                // Validate and normalize URL
                var normalizedUrl = articleUrl.trim();
                
                // Add protocol if missing
                if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
                    normalizedUrl = 'https://' + normalizedUrl;
                }
                
                // Basic URL validation
                try {
                    new URL(normalizedUrl);
                } catch (e) {
                    return res.status(400).json({ 
                        error: 'Invalid URL format. Please enter a valid URL (e.g., https://example.com/article)' 
                    });
                }
                
                console.log('Fetching content from URL:', normalizedUrl);
                articleText = await fetchUrlContent(normalizedUrl);
                console.log('Fetched content length:', articleText.length);
            } catch (urlError) {
                console.error('URL fetch error:', urlError.message);
                return res.status(400).json({ 
                    error: 'Failed to fetch URL: ' + urlError.message 
                });
            }
        }
        
        // Validation
        if (!question && !articleText) {
            return res.status(400).json({ error: 'Please provide a question, URL, or article text' });
        }
        
        if (track === 'b' && criteria.length === 0 && customCriteria.length === 0) {
            return res.status(400).json({ error: 'Track B requires at least one criterion to assess' });
        }
        
        // Rate limiting (skip if user provides their own key)
        var apiKey = userApiKey;
        var remaining = null;
        if (!apiKey) {
            var rateCheck = checkRateLimit(getRateLimitKey(req));
            remaining = rateCheck.remaining;
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
                remaining: remaining,
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
                    centralClaims: parsed.centralClaims,
                    frameworkAnalysis: parsed.frameworkAnalysis,
                    truthDistortionPatterns: parsed.truthDistortionPatterns,
                    evidenceAnalysis: parsed.evidenceAnalysis,
                    whatWeCanBeConfidentAbout: parsed.whatWeCanBeConfidentAbout,
                    whatRemainsUncertain: parsed.whatRemainsUncertain,
                    lessonsForAssessment: parsed.lessonsForAssessment,
                    methodologyNotes: parsed.methodologyNotes,
                    sources: parsed.sources
                },
                question: question || 'Article Assessment',
                track: 'a',
                claimType: claimType,
                assessmentDate: new Date().toISOString(),
                assessor: 'INITIAL',
                remaining: remaining
            });
        }
        
    } catch (err) {
        console.error('Assessment error:', err);
        return res.status(500).json({ error: 'Assessment failed', message: err.message });
    }
};
