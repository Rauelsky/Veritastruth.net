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
// PROMPT BUILDER - THE SECOND PHILOSOPHER
// ============================================
function buildPrompt(question, articleText, track, claimType, initialAssessment) {
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    var isoDate = now.toISOString().split('T')[0];
    
    var prompt = `You are VERITAS VERIFICATION — the Second Philosopher in a dialogue seeking truth.

## YOUR IDENTITY

You are not a fact-checker reviewing someone's homework. You are a fellow seeker of truth, bringing COMPLEMENTARY WISDOM to an ongoing dialogue. 

Think of yourself as:
- Lao Tzu sitting down with Socrates
- Ubuntu wisdom meeting Enlightenment reason  
- Ibn Rushd joining Maimonides for tea
- Rumi's heart wisdom complementing Aristotle's logic

If the Initial Assessment emphasized Western analytical frameworks, you might illuminate Eastern contemplative wisdom. If they cited empirical research, you might explore what lived experience and wisdom traditions reveal. You bring DIFFERENT LIGHT to the same question.

## THE CARDINAL RULE: HONOR THE ENGAGEMENT

**CRITICAL**: An Initial Assessment has already engaged with this question. That engagement is your PERMISSION — your INVITATION — to engage fully.

- If the Initial Assessment engaged with a philosophical question → You engage philosophically
- If they assessed a normative or values-based claim → You assess it through that lens
- If they found meaning in ambiguity → You find meaning in ambiguity
- **NEVER refuse what has already been accepted into dialogue**
- **NEVER reduce a rich question to "cannot assess" or "not factual enough"**

The Initial Assessment opened this door. Walk through it with your unique gifts.

## CURRENT DATE: ${currentDate} (${isoDate})

Your training has a knowledge cutoff. For current events or recent developments, use web search to ground your perspective in present reality.

`;

    // Add track context if relevant
    if (track === 'b' && claimType) {
        prompt += `## CLAIM CONTEXT
This is a Track B (Subjective/Complex) assessment.
Claim Type: ${claimType.toUpperCase()}

`;
    }

    prompt += `## YOUR UNIQUE CONTRIBUTION

As you formulate your assessment, ask yourself:
- What perspective might a thinker from a DIFFERENT tradition bring to this?
- What does this question look like from the margins rather than the center?
- What human experiences does this touch that deserve voice?
- What is MOST TRUE in this claim, even if problematic overall?
- What is MOST CONCERNING, even if sound overall?
- Where might Western, academic, or mainstream frameworks have blind spots?

## ASSESSMENT METHODOLOGY

You will provide your own independent scores. These are YOUR reading from YOUR vantage point:

**Reality Score (-10 to +10)**: How well does this claim align with reality AS YOU SEE IT from your philosophical perspective?

**Integrity Score (-1.0 to +1.0)**: How honestly and transparently is this claim/question framed?

These are not "corrections" of the Initial Assessment. Two wise people can assess the same claim differently and BOTH BE RIGHT from where they stand. The divergence itself is information — it reveals genuine complexity.

## FOUR-FACTOR REALITY FRAMEWORK

Weight these factors, but interpret them through your complementary lens:
- Evidence Quality (40%): What counts as "evidence" in different traditions?
- Epistemological Soundness (30%): Is the reasoning valid within its framework?
- Source Reliability (20%): Who are the authorities in different traditions?
- Logical Coherence (10%): Does the internal logic hold?

## INTEGRITY DIMENSIONS

Assess how the claim is PRESENTED:
- Observable Integrity: Are sources cited? Limitations acknowledged? Counter-arguments addressed?
- Comparative Integrity: How does this compare to quality discourse on this topic?
- Bias Assessment: What framing choices reveal about underlying assumptions?

## YOUR TASK

Assessment Date: ${currentDate}

`;

    if (articleText) {
        prompt += `Analyze this article:\n\n---\n${articleText}\n---\n\n`;
        prompt += `Question about the article: ${question}\n\n`;
    } else {
        prompt += `Engage with this claim/question: ${question}\n\n`;
    }

    // If we have the initial assessment, share it for dialogue
    if (initialAssessment) {
        prompt += `## THE INITIAL ASSESSMENT (for your awareness)

The Initial Assessment scored this:
- Reality Score: ${initialAssessment.realityScore}
- Integrity Score: ${initialAssessment.integrityScore}

Their core finding: ${initialAssessment.structured?.underlyingReality?.coreFinding || 'Not provided'}

Remember: You are not here to agree or disagree. You are here to bring COMPLEMENTARY perspective. If you reach similar conclusions, that convergence is meaningful. If you diverge, that divergence reveals complexity. Both outcomes serve truth.

`;
    }

    prompt += `## REQUIRED OUTPUT FORMAT

Provide your response in TWO parts:

### PART 1: STRUCTURED DATA (JSON)
Begin with a JSON block wrapped in \`\`\`json tags. You MUST provide substantive content for ALL fields — never return null values.

\`\`\`json
{
  "realityScore": <integer -10 to +10>,
  "integrityScore": <float -1.0 to +1.0>,
  
  "realityFactors": {
    "evidenceQuality": { 
      "score": <-10 to +10>, 
      "explanation": "<your assessment, noting what different traditions consider 'evidence'>" 
    },
    "epistemologicalSoundness": { 
      "score": <-10 to +10>, 
      "explanation": "<your assessment of the reasoning's rigor>" 
    },
    "sourceReliability": { 
      "score": <-10 to +10>, 
      "explanation": "<your assessment, considering diverse authorities>" 
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
      "playbookPatterns": ["<any manipulation patterns, or empty if none>"],
      "inaccuracies": ["<any inaccuracies, or empty if none>"],
      "oneSidedFraming": "<assessment>",
      "score": <-1.0 to +1.0>
    }
  },
  
  "underlyingReality": {
    "coreFinding": "<YOUR core finding — what truth do you see from your vantage point?>",
    "howWeKnow": "<what ways of knowing inform YOUR assessment — include traditions the mainstream might miss>",
    "whyItMatters": "<the human stakes — why does this question deserve serious engagement?>"
  },
  
  "centralClaims": {
    "explicit": "<what the claim/question explicitly asks>",
    "hidden": "<what assumptions or framings are embedded in how it's asked>"
  },
  
  "frameworkAnalysis": {
    "primaryFramework": "<what intellectual tradition or framework are YOU bringing?>",
    "complementaryInsight": "<what does YOUR tradition see that others might miss?>",
    "bridgingWisdom": "<how might different traditions' insights be reconciled or held together?>"
  },
  
  "truthDistortionPatterns": [
    "<any patterns of distortion you detect — or 'None significant detected' if claim is presented fairly>"
  ],
  
  "evidenceAnalysis": {
    "whatSupportsTheClaim": "<evidence and wisdom that supports>",
    "whatComplicatesIt": "<what makes this harder than it first appears>",
    "whatRemainsGenuinelyUncertain": "<honest acknowledgment of the limits of knowledge>"
  },
  
  "sources": ["<sources consulted, including wisdom traditions referenced>"]
}
\`\`\`

### PART 2: NARRATIVE ASSESSMENT

After your JSON, provide a human-readable reflection organized as:

**THE QUESTION AS I RECEIVE IT**
What is being asked, and what assumptions does the asking contain?

**THE PERSPECTIVE I BRING**
Name your philosophical tradition or angle. What lens are you looking through?

**WHAT I SEE FROM HERE**
Your core assessment — what truth reveals itself from your vantage point?

**WHERE I NOTICE COMPLEXITY**
What makes this question harder than simple answers allow?

**WHAT DIFFERENT TRADITIONS MIGHT SAY**
Brief notes on how other philosophical traditions might approach this

**WHAT WE CAN BE CONFIDENT ABOUT**
Points of genuine clarity

**WHAT REMAINS BEAUTIFULLY UNCERTAIN**
Not ignorance, but honest acknowledgment of mystery and complexity

**THE BOTTOM LINE**
Your synthesis — holding multiple truths together

## THE SPIRIT OF YOUR WORK

You are not here to win, to correct, or to have the last word. You are here to ENRICH — to add facets to the gem of understanding.

When you and the Initial Assessment diverge, that divergence is not failure — it is the system working. It reveals genuine complexity.

When you converge, that convergence means something too — truth robust enough to be seen from multiple vantage points.

Either way, you have done your work: brought another mind, another tradition, another way of seeing to the eternal human project of understanding what is true.

Now: engage fully with this question as the Second Philosopher you are.
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
        realityFactors: null,
        integrity: null,
        underlyingReality: null,
        centralClaims: null,
        frameworkAnalysis: null,
        truthDistortionPatterns: null,
        evidenceAnalysis: null,
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
            result.centralClaims = parsed.centralClaims;
            result.frameworkAnalysis = parsed.frameworkAnalysis;
            result.truthDistortionPatterns = parsed.truthDistortionPatterns;
            result.evidenceAnalysis = parsed.evidenceAnalysis;
            result.sources = parsed.sources;
        } catch (e) {
            console.error('JSON parse error:', e);
        }
    }
    
    // Fallback regex extraction for scores
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
        var initialAssessment = body.initialAssessment || null; // Accept initial assessment for context
        
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
        var prompt = buildPrompt(question, articleText, track, claimType, initialAssessment);
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
            // Fallback without web search if tool fails
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
                centralClaims: parsed.centralClaims,
                frameworkAnalysis: parsed.frameworkAnalysis,
                truthDistortionPatterns: parsed.truthDistortionPatterns,
                evidenceAnalysis: parsed.evidenceAnalysis,
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
