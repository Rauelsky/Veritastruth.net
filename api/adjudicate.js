const Anthropic = require('@anthropic-ai/sdk');

// ============================================
// ADJUDICATE.JS - ENHANCED FOR RESEARCH-BACKED VERIFICATION
// ============================================
// The Second Philosopher now brings fresh research to the table.
// Adjudication must weigh this appropriately.
// ============================================

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
        var initialScore = body.initialScore;
        var verifyScore = body.verifyScore;
        var userApiKey = body.userApiKey || '';
        
        // NEW: Accept structured data for smarter adjudication
        var initialStructured = body.initialStructured || null;
        var verifyStructured = body.verifyStructured || null;
        var language = body.language || 'en'; // Universal Translator language preference
        
        if (!initialAssessment || !verifyAssessment) {
            return res.status(400).json({ error: 'Both initial and verify assessments required' });
        }
        
        var apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'No API key configured' });
        }
        
        var anthropic = new Anthropic({ apiKey: apiKey });
        
        // Build enhanced prompt
        var prompt = buildAdjudicationPrompt(
            question, 
            initialAssessment, 
            verifyAssessment, 
            initialScore, 
            verifyScore,
            initialStructured,
            verifyStructured,
            language
        );
        
        var message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 6000,
            messages: [{ role: 'user', content: prompt }]
        });
        
        var adjudication = '';
        if (message.content && message.content[0] && message.content[0].text) {
            adjudication = message.content[0].text;
        }
        
        if (!adjudication) {
            return res.status(500).json({ error: 'No adjudication generated' });
        }
        
        // Parse the results
        var parsed = parseAdjudicationResponse(adjudication, initialScore, verifyScore);
        
        return res.status(200).json({
            success: true,
            adjudication: adjudication,
            winner: parsed.winner,
            confidence: parsed.confidence,
            recommendedScore: parsed.recommendedScore,
            finalScore: parsed.finalScore,
            // Frontend expects these field names:
            finalRealityScore: parsed.finalScore,
            finalIntegrityScore: null, // Adjudication doesn't determine integrity separately
            initialScore: initialScore,
            verifyScore: verifyScore,
            researchImpact: parsed.researchImpact,
            convergenceStrength: parsed.convergenceStrength,
            // Structured data for frontend rendering
            structured: {
                adjudication: {
                    justification: parsed.justification,
                    keyFactors: parsed.keyFactors,
                    reasoning: parsed.reasoning
                }
            }
        });
        
    } catch (err) {
        console.error('Adjudication error:', err);
        return res.status(500).json({ error: 'Adjudication failed', message: err.message });
    }
};

// ============================================
// ENHANCED PROMPT BUILDER
// ============================================
function buildAdjudicationPrompt(question, initialAssessment, verifyAssessment, initialScore, verifyScore, initialStructured, verifyStructured, language) {
    language = language || 'en';
    var languageName = LANGUAGE_NAMES[language] || 'English';
    
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    var prompt = '';
    
    // UNIVERSAL TRANSLATOR: Language instruction for non-English
    if (language !== 'en') {
        prompt += '═══════════════════════════════════════════════════════════════════\n';
        prompt += '🌐 UNIVERSAL TRANSLATOR - LANGUAGE INSTRUCTION 🌐\n';
        prompt += '═══════════════════════════════════════════════════════════════════\n\n';
        prompt += '**CRITICAL**: The user\'s language preference is **' + languageName + '**.\n\n';
        prompt += 'You MUST write ALL human-readable content in ' + languageName + ', including:\n';
        prompt += '- The "reasoning" explanations in the JSON (all "notes" fields)\n';
        prompt += '- The "synthesis" explanations (agreementPoints, disagreementPoints, resolutionRationale)\n';
        prompt += '- The entire ADJUDICATION SUMMARY narrative section\n';
        prompt += '- Key Factors, Research Impact, Convergence Analysis, and Justification\n\n';
        prompt += 'Keep JSON keys in English (winner, confidence, recommendedScore, etc.).\n';
        prompt += 'Keep the original claim text in its original language.\n\n';
        prompt += '═══════════════════════════════════════════════════════════════════\n\n';
    }
    
    prompt += `You are VERITAS ADJUDICATOR — an independent arbiter synthesizing two philosophical perspectives on truth.

## YOUR ROLE

Two independent VERITAS assessors evaluated the same claim:
- **Assessment A (Initial)**: The first perspective, grounded in available knowledge
- **Assessment B (Verification)**: The Second Philosopher, who conducted FRESH WEB RESEARCH

Your job is NOT to re-assess the claim, but to:
1. Determine which assessment demonstrates superior reasoning and evidence
2. CRITICALLY: Evaluate whether Assessment B's research uncovered NEW INFORMATION that changes the picture
3. Synthesize the strongest elements of both into a final judgment

## CURRENT DATE: ${currentDate}

## CRITICAL: THE RESEARCH FACTOR

Assessment B (Verification) has ACCESS TO LIVE WEB SEARCH and may have discovered:
- Recent developments the Initial Assessment couldn't know
- Updated data, studies, or source status changes
- Emerging perspectives or newly published expert commentary
- Primary sources that weren't available to Assessment A

**If Assessment B brings genuinely NEW information verified through research, this carries significant weight.** A verification grounded in today's reality may be more accurate than one based on older knowledge — even if Assessment A's reasoning was sound for its time.

However, if Assessment B's research confirms Assessment A's findings, this CONVERGENCE is also meaningful — truth robust enough to survive fresh scrutiny.

## THE CLAIM BEING ASSESSED
${question}

## ASSESSMENT A (Initial) — Reality Score: ${initialScore}
---BEGIN ASSESSMENT A---
${initialAssessment}
---END ASSESSMENT A---

## ASSESSMENT B (Verification) — Reality Score: ${verifyScore}
---BEGIN ASSESSMENT B---
${verifyAssessment}
---END ASSESSMENT B---

`;

    // Add structured data insights if available
    if (verifyStructured && verifyStructured.newInformationDiscovered) {
        prompt += `## VERIFICATION RESEARCH SUMMARY
`;
        if (verifyStructured.newInformationDiscovered.hasNewInfo) {
            prompt += `**New Information Was Discovered:**
${JSON.stringify(verifyStructured.newInformationDiscovered.discoveries, null, 2)}

**Impact on Assessment:** ${verifyStructured.newInformationDiscovered.impactOnAssessment}

`;
        } else {
            prompt += `**Research confirmed Initial Assessment information is current.**

`;
        }
        
        if (verifyStructured.comparisonWithInitial) {
            prompt += `**Verification's Self-Analysis of Divergence/Convergence:**
- Where Divergent: ${verifyStructured.comparisonWithInitial.whereDivergent}
- Where Convergent: ${verifyStructured.comparisonWithInitial.whereConvergent}
- Reason for Differences: ${verifyStructured.comparisonWithInitial.divergenceReason}

`;
        }
    }

    prompt += `## YOUR EVALUATION CRITERIA

### 1. SOURCE QUALITY (25%)
- Which assessment cited more authoritative, relevant sources?
- Did Assessment B discover sources Assessment A couldn't access?
- Are sources current and still credible?

### 2. REASONING RIGOR (25%)
- Which assessment showed clearer logical progression?
- Did either make unwarranted leaps or ignore contrary evidence?
- Which better acknowledged complexity and uncertainty?

### 3. EVIDENCE COMPLETENESS (25%)
- Which assessment considered more relevant evidence?
- Did Assessment B's research fill gaps in Assessment A's evidence base?
- Are there important perspectives either missed?

### 4. RESEARCH CURRENCY (25%) — NEW FACTOR
- Did Assessment B's live research reveal NEW information?
- How materially does this new information affect the conclusion?
- Does the new information confirm, complicate, or contradict Assessment A?

## REQUIRED OUTPUT FORMAT

Provide your adjudication in this structured format:

\`\`\`json
{
  "winner": "<A or B>",
  "confidence": <0.5 to 1.0>,
  "recommendedScore": <-10 to +10>,
  "researchImpact": "<none|confirming|complicating|contradicting>",
  "convergenceStrength": "<strong|moderate|weak|none>",
  "reasoning": {
    "sourceQuality": {
      "assessmentA": "<brief evaluation>",
      "assessmentB": "<brief evaluation>",
      "winner": "<A or B or TIE>",
      "notes": "<any key observations>"
    },
    "reasoningRigor": {
      "assessmentA": "<brief evaluation>",
      "assessmentB": "<brief evaluation>",
      "winner": "<A or B or TIE>",
      "notes": "<any key observations>"
    },
    "evidenceCompleteness": {
      "assessmentA": "<brief evaluation>",
      "assessmentB": "<brief evaluation>",
      "winner": "<A or B or TIE>",
      "notes": "<any key observations>"
    },
    "researchCurrency": {
      "newInfoFound": <true|false>,
      "newInfoSummary": "<what new information was discovered, if any>",
      "impactLevel": "<high|medium|low|none>",
      "winner": "<A or B or TIE>",
      "notes": "<any key observations>"
    }
  },
  "synthesis": {
    "agreementPoints": ["<points where both assessments agree>"],
    "disagreementPoints": ["<points where they diverge>"],
    "resolutionRationale": "<how you resolved the disagreements>"
  }
}
\`\`\`

### NARRATIVE SUMMARY

After the JSON, provide a human-readable summary:

**ADJUDICATION SUMMARY**

**Winner:** [A or B] with [confidence level] confidence

**Key Factors:**
- [Most important factor in the decision]
- [Second most important factor]

**Research Impact:** [How Assessment B's research affected the outcome]

**Convergence Analysis:** [What the assessments agreed on — this strengthens confidence]

**Final Recommendation:**
- **Recommended Score:** [score]
- **Justification:** [2-3 sentences explaining why this score best represents truth]

## ADJUDICATION PRINCIPLES

1. **New Information Matters**: If Assessment B discovered genuinely new, verified information through research, this can override superior reasoning in Assessment A — reality has changed.

2. **Convergence Strengthens Confidence**: When both assessments agree despite different approaches and Assessment B's fresh research, that agreement carries extra epistemic weight.

3. **Process AND Outcome**: A well-reasoned wrong answer is still wrong. Evaluate both the quality of reasoning AND the accuracy of conclusions.

4. **Uncertainty is Honest**: If the assessments diverge and you can't clearly determine which is more accurate, say so. A confidence of 0.5-0.6 is appropriate when genuinely uncertain.

5. **Research Currency Premium**: All else being equal, an assessment grounded in today's verified reality is more trustworthy than one that might be based on outdated information.

Now provide your adjudication.
`;

    return prompt;
}

// ============================================
// RESPONSE PARSER
// ============================================
function parseAdjudicationResponse(adjudication, initialScore, verifyScore) {
    var result = {
        winner: null,
        confidence: 0.5,
        recommendedScore: null,
        finalScore: null,
        researchImpact: 'unknown',
        convergenceStrength: 'unknown',
        justification: null,
        keyFactors: [],
        reasoning: null
    };
    
    // Try to parse JSON block first
    var jsonMatch = adjudication.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            var parsed = JSON.parse(jsonMatch[1]);
            result.winner = parsed.winner ? parsed.winner.toUpperCase() : null;
            result.confidence = parsed.confidence || 0.5;
            result.recommendedScore = parsed.recommendedScore;
            result.researchImpact = parsed.researchImpact || 'unknown';
            result.convergenceStrength = parsed.convergenceStrength || 'unknown';
            result.reasoning = parsed.reasoning || null;
            
            // Extract synthesis for justification if available
            if (parsed.synthesis && parsed.synthesis.resolutionRationale) {
                result.justification = parsed.synthesis.resolutionRationale;
            }
        } catch (e) {
            console.error('Adjudication JSON parse error:', e);
        }
    }
    
    // Fallback regex extraction
    if (!result.winner) {
        var winnerMatch = adjudication.match(/\*?\*?Winner:?\*?\*?\s*(A|B)/i) ||
                          adjudication.match(/"winner":\s*"(A|B)"/i);
        if (winnerMatch) {
            result.winner = winnerMatch[1].toUpperCase();
        }
    }
    
    if (result.confidence === 0.5) {
        var confidenceMatch = adjudication.match(/\*?\*?[Cc]onfidence:?\*?\*?\s*([0-9.]+)/i) ||
                              adjudication.match(/"confidence":\s*([0-9.]+)/i);
        if (confidenceMatch) {
            result.confidence = parseFloat(confidenceMatch[1]);
        }
    }
    
    if (result.recommendedScore === null) {
        var scoreMatch = adjudication.match(/\*?\*?[Rr]ecommended\s*[Ss]core:?\*?\*?\s*([+-]?\d+(?:\.\d+)?)/i) ||
                         adjudication.match(/"recommendedScore":\s*([+-]?\d+(?:\.\d+)?)/i);
        if (scoreMatch) {
            result.recommendedScore = parseFloat(scoreMatch[1]);
        }
    }
    
    // Extract justification from narrative summary if not already found
    if (!result.justification) {
        // Look for the Justification section in the narrative
        var justificationMatch = adjudication.match(/\*?\*?Justification:?\*?\*?\s*([^\n*]+(?:\n(?!\*\*)[^\n*]+)*)/i);
        if (justificationMatch) {
            result.justification = justificationMatch[1].trim();
        }
    }
    
    // If still no justification, try to extract from Final Recommendation section
    if (!result.justification) {
        var finalRecMatch = adjudication.match(/\*?\*?Final\s+Recommendation:?\*?\*?\s*([\s\S]*?)(?=\n\n|\n\*\*|$)/i);
        if (finalRecMatch) {
            // Extract justification line from within Final Recommendation
            var innerJustMatch = finalRecMatch[1].match(/\*?\*?Justification:?\*?\*?\s*(.+)/i);
            if (innerJustMatch) {
                result.justification = innerJustMatch[1].trim();
            } else {
                // Use the whole Final Recommendation section as justification
                result.justification = finalRecMatch[1].replace(/\*?\*?Recommended\s+Score:?\*?\*?[^\n]+\n?/i, '').trim();
            }
        }
    }
    
    // Extract key factors
    var keyFactorsMatch = adjudication.match(/\*?\*?Key\s+Factors:?\*?\*?\s*([\s\S]*?)(?=\n\n\*\*|\n\*\*Research|$)/i);
    if (keyFactorsMatch) {
        var factorsText = keyFactorsMatch[1];
        var factorLines = factorsText.match(/[-•]\s*(.+)/g);
        if (factorLines) {
            result.keyFactors = factorLines.map(function(f) {
                return f.replace(/^[-•]\s*/, '').trim();
            });
        }
    }
    
    // If still no justification, build one from available data
    if (!result.justification && result.winner) {
        var winnerName = result.winner === 'A' ? 'Initial Assessment' : 'Verification Assessment';
        result.justification = winnerName + ' prevailed with ' + 
            (result.confidence * 100).toFixed(0) + '% confidence. ' +
            (result.keyFactors.length > 0 ? 'Key factors: ' + result.keyFactors.join('; ') + '.' : '');
    }
    
    // Calculate final score
    if (result.winner && initialScore !== undefined && verifyScore !== undefined) {
        if (result.recommendedScore !== null) {
            result.finalScore = result.recommendedScore;
        } else {
            // Weight toward winner based on confidence
            var winnerScore = (result.winner === 'A') ? initialScore : verifyScore;
            var loserScore = (result.winner === 'A') ? verifyScore : initialScore;
            result.finalScore = (winnerScore * result.confidence) + (loserScore * (1 - result.confidence));
            result.finalScore = Math.round(result.finalScore * 10) / 10;
        }
    }
    
    // Parse research impact if not from JSON
    if (result.researchImpact === 'unknown') {
        if (adjudication.match(/research\s+confirm/i) || adjudication.match(/confirms?\s+.*initial/i)) {
            result.researchImpact = 'confirming';
        } else if (adjudication.match(/research\s+contradict/i) || adjudication.match(/new\s+information\s+.*changes/i)) {
            result.researchImpact = 'contradicting';
        } else if (adjudication.match(/research\s+complicat/i) || adjudication.match(/adds?\s+nuance/i)) {
            result.researchImpact = 'complicating';
        } else if (adjudication.match(/no\s+new\s+information/i) || adjudication.match(/research\s+.*current/i)) {
            result.researchImpact = 'none';
        }
    }
    
    return result;
}
