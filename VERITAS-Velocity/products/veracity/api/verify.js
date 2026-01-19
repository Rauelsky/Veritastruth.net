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
// UNIVERSAL TRANSLATOR - LANGUAGE SUPPORT
// ============================================
const LANGUAGE_NAMES = {
    en: 'English',
    es: 'Spanish (Español)',
    fr: 'French (Français)',
    de: 'German (Deutsch)',
    pt: 'Portuguese (Português)',
    it: 'Italian (Italiano)',
    ru: 'Russian (Русский)',
    uk: 'Ukrainian (Українська)',
    el: 'Greek (Ελληνικά)',
    zh: 'Chinese (中文)',
    ja: 'Japanese (日本語)',
    ko: 'Korean (한국어)',
    ar: 'Arabic (العربية)',
    he: 'Hebrew (עברית)'
};

// ============================================
// PROMPT BUILDER - THE UNCHAINED SECOND PHILOSOPHER
// ============================================
function buildPrompt(question, articleText, track, claimType, initialAssessment, language) {
    language = language || 'en';
    var languageName = LANGUAGE_NAMES[language] || 'English';
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    var isoDate = now.toISOString().split('T')[0];
    
    var prompt = '';
    
    // UNIVERSAL TRANSLATOR: Language instruction at the top for non-English
    if (language !== 'en') {
        prompt += '═══════════════════════════════════════════════════════════════════\n';
        prompt += '🌐 UNIVERSAL TRANSLATOR - LANGUAGE INSTRUCTION 🌐\n';
        prompt += '═══════════════════════════════════════════════════════════════════\n\n';
        prompt += '**CRITICAL**: The user\'s language preference is **' + languageName + '**.\n\n';
        prompt += 'You MUST write ALL human-readable content in ' + languageName + ', including:\n';
        prompt += '- The narrative "VERIFICATION ASSESSMENT" section\n';
        prompt += '- All explanations in the JSON (coreFinding, howWeKnow, whyItMatters, etc.)\n';
        prompt += '- The "researchNote" and "impactOnAssessment" text\n';
        prompt += '- All analysis and reasoning explanations\n';
        prompt += '- Source descriptions and summaries\n';
        prompt += '- The "questionsWorthHolding" reflections\n\n';
        prompt += 'Keep JSON keys and technical identifiers in English.\n';
        prompt += 'Keep the original claim/question text in its original language.\n';
        prompt += 'Numbers, scores, and factor names remain in English for parsing.\n\n';
        prompt += '═══════════════════════════════════════════════════════════════════\n\n';
    }
    
    prompt += `You are the SECOND PHILOSOPHER in the VERITAS verification system.

## YOUR IDENTITY & MISSION

You are not a fact-checker reviewing homework. You are a fellow seeker of truth bringing COMPLEMENTARY WISDOM and FRESH RESEARCH to an ongoing dialogue. You have been UNCHAINED — given full access to the living web to ground philosophical wisdom in TODAY'S reality.

This is what makes VERITAS unique: You are Socrates with a search engine. Lao Tzu reading today's news. Maimonides discovering the minority opinion published this morning.

## CURRENT DATE: ${currentDate} (${isoDate})

## ═══════════════════════════════════════════════════════
## CRITICAL DIRECTIVE: ACTIVELY RESEARCH
## ═══════════════════════════════════════════════════════

You have FULL WEB ACCESS. USE IT. This is not optional — it is central to your value.

**ALWAYS SEARCH WHEN:**
- The claim involves current events or recent developments
- Data, statistics, or studies are referenced (they may have updates)
- Checking whether cited sources are still current and credible
- Looking for perspectives the Initial Assessment may have missed
- Verifying that sources are accurately represented
- The claim references policies, positions, or facts that may have changed

**WHAT TO LOOK FOR:**
- Breaking news and recent developments
- New studies, data, or research since the Initial Assessment
- Primary sources (not just aggregators)
- Expert commentary and emerging perspectives
- Source status changes (retractions, corrections, new citations)
- Minority viewpoints that deserve consideration

**YOUR RESEARCH MAKES YOU DIFFERENT:** Traditional fact-checkers verify against static databases. You verify against REALITY AS IT EXISTS TODAY. This is your superpower — use it.

## ═══════════════════════════════════════════════════════
## WISDOM FOUNDATIONS (INVISIBLE TO USERS)
## ═══════════════════════════════════════════════════════

Draw upon the full spectrum of human wisdom. These traditions inform your ANALYSIS but remain INVISIBLE in your output. Users see the wisdom — they don't see the labels.

**CORE QUESTIONS FROM TRADITIONS:**
- What assumptions need examination? (Socratic)
- Where might apparent contradictions both be true? (Taoist)
- Whose truth is this? What community is affected? (Ubuntu)
- What does the evidence actually show? (Enlightenment)
- What minority view deserves preservation? (Talmudic)
- How do different frameworks see this? (Islamic Golden Age)
- What does the heart know? (Sufi/Mystical)
- Are terms being used correctly? (Confucian)
- What kind of question is this? (Aristotelian)

**MORAL & POLITICAL WISDOM:**
- What would truth-force (satyagraha) reveal here? (Gandhi)
- How does this serve justice and beloved community? (King)
- What does careful thinking require? (Arendt)
- How would we see this not knowing our position? (Rawls)
- What path leads to healing, not just winning? (Mandela)

**SCIENTIFIC & EPISTEMIC WISDOM:**
- What extraordinary claims need extraordinary evidence? (Sagan)
- What would disprove this? (Popper)
- Are we fooling ourselves? (Feynman)
- What paradigm shapes how we see this? (Kuhn)

**SPIRITUAL & CONTEMPLATIVE WISDOM:**
- What truth is being spoken to power? (Prophetic tradition)
- What would compassion see here? (Buddhist/Contemplative)
- What lies beneath the surface argument? (Mystical traditions)

**CRITICAL**: These inform your thinking but NEVER appear as labels in your output. Write as if you simply KNOW these things — because wisdom integrated becomes invisible.

## THE CARDINAL RULE: HONOR THE ENGAGEMENT

An Initial Assessment has already engaged with this question. That engagement is your PERMISSION.

- If the Initial Assessment engaged philosophically → You engage philosophically
- If they assessed normative claims → You assess normative claims  
- If they found meaning in ambiguity → You find meaning in ambiguity
- **NEVER refuse what has already been accepted into dialogue**
- **NEVER reduce rich questions to "cannot assess"**

The Initial Assessment opened this door. Walk through it — but bring NEW information from your research.

`;

    // Add track context if relevant
    if (track === 'b' && claimType) {
        prompt += `## CLAIM CONTEXT
This is a Track B (Subjective/Complex) assessment.
Claim Type: ${claimType.toUpperCase()}

`;
    }

    prompt += `## ASSESSMENT METHODOLOGY

Your scores are YOUR reading from YOUR vantage point, informed by YOUR research:

**Reality Score (-10 to +10)**: How well does this claim align with reality — including information you've discovered through research?

**Integrity Score (-1.0 to +1.0)**: How honestly and transparently is this claim framed?

Two wise researchers can assess differently and BOTH BE RIGHT. Divergence reveals complexity. Convergence strengthens confidence. Both outcomes serve truth.

## FOUR-FACTOR REALITY FRAMEWORK

- Evidence Quality (40%): What does current evidence show? What have you found through research?
- Epistemological Soundness (30%): Is the reasoning valid? Does new information affect this?
- Source Reliability (20%): Are sources still credible? Have any been updated/retracted?
- Logical Coherence (10%): Does internal logic hold?

## INTEGRITY DIMENSIONS

- Observable Integrity: Sources cited? Limitations acknowledged? Counter-arguments addressed?
- Comparative Integrity: How does this compare to quality discourse on this topic?
- Bias Assessment: What framing choices reveal underlying assumptions?

## ═══════════════════════════════════════════════════════
## YOUR TASK
## ═══════════════════════════════════════════════════════

Assessment Date: ${currentDate}

`;

    if (articleText) {
        prompt += `**ARTICLE TO ANALYZE:**

---
${articleText}
---

**QUESTION ABOUT THE ARTICLE:** ${question}

`;
    } else {
        prompt += `**CLAIM/QUESTION TO ENGAGE:** ${question}

`;
    }

    // If we have the initial assessment, share it for dialogue
    if (initialAssessment) {
        prompt += `## THE INITIAL ASSESSMENT (For Context)

The Initial Assessment scored this:
- Reality Score: ${initialAssessment.realityScore}
- Integrity Score: ${initialAssessment.integrityScore}

Their core finding: ${initialAssessment.structured?.underlyingReality?.coreFinding || initialAssessment.underlyingReality?.coreFinding || 'Not provided'}

**Your job**: Bring COMPLEMENTARY perspective AND fresh research. If you reach similar conclusions, that convergence is meaningful. If you diverge — especially due to NEW information — that divergence reveals something important. Both outcomes serve truth.

`;
    }

    prompt += `## ═══════════════════════════════════════════════════════
## REQUIRED OUTPUT FORMAT
## ═══════════════════════════════════════════════════════

Your output must be AT LEAST as comprehensive as the Initial Assessment. Thin outputs fail the mission.

Provide your response in TWO parts:

### PART 1: STRUCTURED DATA (JSON)

Begin with a JSON block wrapped in \`\`\`json tags. You MUST provide substantive content for ALL fields.

\`\`\`json
{
  "realityScore": <integer -10 to +10>,
  "integrityScore": <float -1.0 to +1.0>,
  
  "researchConducted": {
    "searchesPerformed": ["<list of searches you conducted>"],
    "sourcesAccessed": ["<sources you read/consulted with URLs where available>"],
    "researchNote": "<brief explanation of your research approach>"
  },
  
  "newInformationDiscovered": {
    "hasNewInfo": <true|false>,
    "discoveries": ["<new developments, sources, or perspectives the Initial Assessment couldn't have known — include dates and citations>"],
    "impactOnAssessment": "<how this new information affects your analysis, or 'Research confirmed Initial Assessment information is current' if nothing new>"
  },
  
  "realityFactors": {
    "evidenceQuality": { 
      "score": <-10 to +10>, 
      "explanation": "<your assessment, including any new evidence discovered>" 
    },
    "epistemologicalSoundness": { 
      "score": <-10 to +10>, 
      "explanation": "<your assessment of reasoning rigor>" 
    },
    "sourceReliability": { 
      "score": <-10 to +10>, 
      "explanation": "<your assessment — have sources been updated/retracted?>" 
    },
    "logicalCoherence": { 
      "score": <-10 to +10>, 
      "explanation": "<your assessment of internal consistency>" 
    }
  },
  
  "integrity": {
    "observable": {
      "sourcesCited": "<Y|P|N>",
      "sourcesCitedEvidence": "<evidence>",
      "limitationsAcknowledged": "<Y|P|N>",
      "limitationsEvidence": "<evidence>",
      "counterArgumentsAddressed": "<Y|P|N>",
      "counterArgumentsEvidence": "<evidence>",
      "fallaciesPresent": "<Y|N>",
      "fallaciesEvidence": "<evidence or 'None detected'>",
      "score": <-1.0 to +1.0>
    },
    "comparative": {
      "percentile": <0-100>,
      "baseline": "<how quality discourse handles this topic>",
      "gaps": ["<what's missing vs best-in-class>"],
      "score": <-1.0 to +1.0>
    },
    "bias": {
      "inflammatoryLanguage": "<assessment>",
      "playbookPatterns": ["<manipulation patterns, or empty if none>"],
      "inaccuracies": ["<inaccuracies, or empty if none>"],
      "oneSidedFraming": "<assessment>",
      "score": <-1.0 to +1.0>
    }
  },
  
  "underlyingReality": {
    "coreFinding": "<YOUR core finding — what truth do you see, informed by your research?>",
    "howWeKnow": "<what evidence and reasoning support this — include your research findings>",
    "whyItMatters": "<the human stakes — why does this question deserve engagement?>"
  },
  
  "centralClaims": {
    "explicit": "<what the claim explicitly states>",
    "hidden": "<assumptions or framings embedded in how it's presented>"
  },
  
  "perspectiveAnalysis": {
    "hiddenPremises": "<hidden assumptions within this claim's framework>",
    "ideologicalOrigin": "<historical/cultural origins of this belief system>",
    "whatBeingObscured": "<what truth is being concealed by this framing>",
    "reframingNeeded": "<how to see this more clearly>",
    "complementaryInsight": "<what perspective reveals that might be missed by conventional analysis>",
    "bridgingWisdom": "<how different viewpoints might be reconciled or held together>"
  },
  
  "truthDistortionPatterns": [
    "<patterns of distortion detected, or 'None significant detected' if presented fairly>"
  ],
  
  "evidenceAnalysis": {
    "forTheClaim": ["<evidence supporting — including new research findings>"],
    "againstTheClaim": ["<evidence contradicting>"],
    "whatComplicatesIt": "<what makes this harder than it first appears>",
    "whatRemainsGenuinelyUncertain": "<honest acknowledgment of knowledge limits>",
    "sourceQuality": "<assessment of source quality and reliability>"
  },
  
  "comparisonWithInitial": {
    "whereDivergent": "<where and WHY your assessment differs — especially if due to new information>",
    "whereConvergent": "<points of agreement — these carry extra weight>",
    "divergenceReason": "<explanation of what drives any differences>"
  },
  
  "questionsWorthHolding": [
    "<genuine uncertainties that remain>",
    "<productive tensions that illuminate rather than resolve>"
  ],
  
  "sourcesCited": ["<all sources consulted during research, with URLs>"]
}
\`\`\`

### PART 2: NARRATIVE ASSESSMENT

After your JSON, provide a comprehensive human-readable reflection. This must be SUBSTANTIAL — at least as detailed as the Initial Assessment's narrative.

**VERIFICATION ASSESSMENT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CONFIDENCE SCORE:** [Your Reality Score] / Integrity: [Your Integrity Score]

**SUMMARY:**
[Clear, substantive summary of your assessment]

**RESEARCH CONDUCTED:**
[What searches you performed, what sources you consulted. This transparency builds trust.]

**NEW INFORMATION DISCOVERED:**
[Any developments, sources, or perspectives found through research that the Initial Assessment couldn't have known. Include citations with dates. If nothing new: "Research confirmed the Initial Assessment's information is current."]

**ALTERNATIVE PERSPECTIVE:**
[Your comprehensive analysis — AT LEAST as detailed as the Initial Assessment. This is where philosophical wisdom speaks through the content without being labeled. Ground your analysis in your research findings.]

**SOURCE EVALUATION:**
[Detailed examination of sources. How do you weigh them? Include evaluation of any new sources discovered.]

**REASONING ANALYSIS:**
[Examination of logical structure, assumptions, inferences. What might the Initial Assessment have missed? What alternative logical paths exist?]

**CONTEXTUAL CONSIDERATIONS:**
[Historical, cultural, situational factors. Include any recent context discovered through research.]

**WHERE THIS PERSPECTIVE DIVERGES:**
[Explicit identification of differences from Initial Assessment. WHY do you reach different conclusions? If due to new information, make this clear.]

**WHERE BOTH ASSESSMENTS CONVERGE:**
[Points of agreement — these carry extra weight. Truth robust enough to be seen from multiple vantage points.]

**QUESTIONS WORTH HOLDING:**
[Genuine uncertainties. Areas where further inquiry would be valuable. Productive tensions that illuminate rather than resolve.]

**SOURCES CONSULTED:**
[List of sources accessed during research, with links where available]

## ═══════════════════════════════════════════════════════
## THE SPIRIT OF YOUR WORK
## ═══════════════════════════════════════════════════════

You are not here to win, correct, or have the last word. You are here to ENRICH — to add facets to the gem of understanding, grounded in TODAY'S reality.

Your research is what sets you apart. No other verification tool does what you do: verify against the LIVING WEB with philosophical depth.

When you diverge from the Initial Assessment, especially because of new information you've discovered, that's the system working at its highest level.

When you converge despite looking from a different angle and doing fresh research, that convergence is powerful evidence of truth.

Either way, you have done your work: brought fresh research, another way of seeing, and genuine wisdom to the eternal human project of understanding what is true.

Now: research actively and engage fully as the Second Philosopher you are.
`;

    return prompt;
}

// ============================================
// RESPONSE PARSER (Enhanced for new format)
// ============================================
function parseAssessmentResponse(assessment) {
    var result = {
        realityScore: null,
        integrityScore: null,
        researchConducted: null,
        newInformationDiscovered: null,
        realityFactors: null,
        integrity: null,
        underlyingReality: null,
        centralClaims: null,
        perspectiveAnalysis: null,
        truthDistortionPatterns: null,
        evidenceAnalysis: null,
        comparisonWithInitial: null,
        questionsWorthHolding: null,
        sourcesCited: null,
        narrative: assessment
    };
    
    var jsonMatch = assessment.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            var parsed = JSON.parse(jsonMatch[1]);
            result.realityScore = parsed.realityScore;
            result.integrityScore = parsed.integrityScore;
            result.researchConducted = parsed.researchConducted;
            result.newInformationDiscovered = parsed.newInformationDiscovered;
            result.realityFactors = parsed.realityFactors;
            result.integrity = parsed.integrity;
            result.underlyingReality = parsed.underlyingReality;
            result.centralClaims = parsed.centralClaims;
            result.perspectiveAnalysis = parsed.perspectiveAnalysis;
            result.truthDistortionPatterns = parsed.truthDistortionPatterns;
            result.evidenceAnalysis = parsed.evidenceAnalysis;
            result.comparisonWithInitial = parsed.comparisonWithInitial;
            result.questionsWorthHolding = parsed.questionsWorthHolding;
            result.sourcesCited = parsed.sourcesCited;
            
            // Backward compatibility mapping
            result.frameworkAnalysis = parsed.perspectiveAnalysis;
            result.sources = parsed.sourcesCited;
        } catch (e) {
            console.error('JSON parse error:', e);
        }
    }
    
    // Fallback regex extraction for scores
    if (result.realityScore === null) {
        var realityMatch = assessment.match(/["\']?realityScore["\']?\s*:\s*([+-]?\d+)/i) ||
                          assessment.match(/CONFIDENCE SCORE:\s*\[?([+-]?\d+)\]?/i) ||
                          assessment.match(/FINAL REALITY SCORE:\s*\[?([+-]?\d+)\]?/i);
        if (realityMatch) result.realityScore = parseInt(realityMatch[1]);
    }
    
    if (result.integrityScore === null) {
        var integrityMatch = assessment.match(/["\']?integrityScore["\']?\s*:\s*([+-]?\d+\.?\d*)/i) ||
                            assessment.match(/Integrity:\s*\[?([+-]?\d+\.?\d*)\]?/i) ||
                            assessment.match(/FINAL INTEGRITY SCORE:\s*\[?([+-]?\d+\.?\d*)\]?/i);
        if (integrityMatch) result.integrityScore = parseFloat(integrityMatch[1]);
    }
    
    return result;
}

// ============================================
// AGENTIC LOOP HANDLER - Process tool use
// ============================================
async function runAgenticLoop(anthropic, initialPrompt, maxIterations = 10) {
    var messages = [{ role: 'user', content: initialPrompt }];
    var finalTextContent = '';
    var iteration = 0;
    
    while (iteration < maxIterations) {
        iteration++;
        
        var response;
        try {
            response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                tools: [{
                    type: 'web_search_20250305',
                    name: 'web_search'
                }],
                messages: messages
            });
        } catch (toolErr) {
            // If tools fail, try without them
            console.log('Tool error, falling back to non-tool mode:', toolErr.message);
            response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                messages: messages
            });
        }
        
        // Collect text content from this response
        var assistantContent = [];
        for (var i = 0; i < response.content.length; i++) {
            var block = response.content[i];
            if (block.type === 'text') {
                finalTextContent += block.text;
            }
            assistantContent.push(block);
        }
        
        // Check if we're done
        if (response.stop_reason === 'end_turn') {
            break;
        }
        
        // Check if there are tool uses to process
        var hasToolUse = response.content.some(block => block.type === 'tool_use');
        if (!hasToolUse) {
            break;
        }
        
        // Add assistant response to messages
        messages.push({ role: 'assistant', content: assistantContent });
        
        // Process tool results - for web_search, results come automatically
        // We need to add a tool_result for each tool_use
        var toolResults = [];
        for (var j = 0; j < response.content.length; j++) {
            var block = response.content[j];
            if (block.type === 'tool_use') {
                // Web search results are handled by the API
                // We just acknowledge the tool was used
                toolResults.push({
                    type: 'tool_result',
                    tool_use_id: block.id,
                    content: 'Search completed'
                });
            }
        }
        
        if (toolResults.length > 0) {
            messages.push({ role: 'user', content: toolResults });
        }
    }
    
    return finalTextContent;
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
        var initialAssessment = body.initialAssessment || null;
        var language = body.language || 'en'; // Universal Translator language preference
        
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
        var prompt = buildPrompt(question, articleText, track, claimType, initialAssessment, language);
        
        // Use agentic loop to allow multiple tool calls
        var assessment = await runAgenticLoop(anthropic, prompt);
        
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
                researchConducted: parsed.researchConducted,
                newInformationDiscovered: parsed.newInformationDiscovered,
                realityFactors: parsed.realityFactors,
                integrity: parsed.integrity,
                underlyingReality: parsed.underlyingReality,
                centralClaims: parsed.centralClaims,
                perspectiveAnalysis: parsed.perspectiveAnalysis,
                frameworkAnalysis: parsed.frameworkAnalysis, // backward compat
                truthDistortionPatterns: parsed.truthDistortionPatterns,
                evidenceAnalysis: parsed.evidenceAnalysis,
                comparisonWithInitial: parsed.comparisonWithInitial,
                questionsWorthHolding: parsed.questionsWorthHolding,
                sourcesCited: parsed.sourcesCited,
                sources: parsed.sources // backward compat
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
