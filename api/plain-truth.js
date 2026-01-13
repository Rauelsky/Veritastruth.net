// /api/plain-truth.js
// VERITAS Plain Truth Generator - Claude-powered historical wisdom
// Draws from 6,000 years of human experience to illuminate specific claims

const Anthropic = require("@anthropic-ai/sdk").default;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Diagnostic logging
  console.log("[plain-truth] Request received");

  try {
    // Check if body exists
    if (!req.body) {
      console.error("[plain-truth] No request body");
      return res.status(400).json({ error: "No request body", fallback: true });
    }

    console.log("[plain-truth] Body keys:", Object.keys(req.body));

    const { 
      claim,
      realityScore,
      integrityScore,
      structured,
      language = 'en'
    } = req.body;

    console.log("[plain-truth] Claim:", claim ? claim.substring(0, 50) + "..." : "MISSING");
    console.log("[plain-truth] Scores:", realityScore, integrityScore);
    console.log("[plain-truth] Language:", language);

    if (!claim) {
      console.error("[plain-truth] Missing claim in body");
      return res.status(400).json({ error: "Missing claim", fallback: true });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VERITAS_API_KEY;
    if (!apiKey) {
      console.error("[plain-truth] No API key found in environment");
      return res.status(500).json({ error: "API key not configured", fallback: true });
    }
    console.log("[plain-truth] API key found, length:", apiKey.length);

    let client;
    try {
      client = new Anthropic({ apiKey });
      console.log("[plain-truth] Anthropic client created");
    } catch (clientError) {
      console.error("[plain-truth] Failed to create Anthropic client:", clientError);
      return res.status(500).json({ error: "Failed to initialize API client", fallback: true });
    }

    // Build context from the assessment
    const patternsRaw = structured?.truthDistortionPatterns || [];
    const patterns = Array.isArray(patternsRaw) ? patternsRaw : [patternsRaw].filter(Boolean);
    
    const centralClaimsRaw = structured?.centralClaims?.explicit || [];
    const centralClaims = Array.isArray(centralClaimsRaw) ? centralClaimsRaw : [centralClaimsRaw].filter(Boolean);
    
    const underlyingRealityRaw = structured?.underlyingReality || structured?.underlyingTruth || '';
    const underlyingReality = typeof underlyingRealityRaw === 'string' ? underlyingRealityRaw : JSON.stringify(underlyingRealityRaw);
    
    const languageInstruction = language !== 'en' 
      ? `\n\nIMPORTANT: Generate all content in ${getLanguageName(language)}. The user's interface is in ${getLanguageName(language)}.`
      : '';

    const prompt = `You are a wise guide helping someone understand a claim they've encountered. You have access to 6,000 years of human wisdom - philosophy, history, psychology, cultural evolution, religious and secular thought from every tradition.

THE CLAIM BEING EXAMINED:
"${claim}"

ASSESSMENT DATA:
- Reality Score: ${realityScore} (scale: -10 to +10, where +10 is rock-solid truth)
- Integrity Score: ${integrityScore} (scale: -1 to +1, where +1 is honest presentation)
- Detected Patterns: ${patterns.length > 0 ? patterns.join(', ') : 'None specifically identified'}
- Central Claims: ${centralClaims.length > 0 ? centralClaims.join('; ') : 'See above'}
- Underlying Reality: ${underlyingReality || 'See assessment'}

YOUR TASK: Generate four sections of "Plain Truth" content that illuminate THIS SPECIFIC claim using historical wisdom. Not generic observations - specific, relevant parallels that help this person understand their situation better.

SECTION 1 - "Why This Might Feel True (Or False)"
Explain the psychological and social mechanisms at play with THIS claim. Draw from:
- Relevant cognitive science (but make it human, not academic)
- Historical examples of similar psychological dynamics
- Why smart people might believe or disbelieve this
- What this tells them about themselves, not just the claim
Keep it warm, not condescending. 2-3 paragraphs.

SECTION 2 - "A Shared Moment of Honesty"
Write a brief reflection that normalizes this error pattern WITHOUT claiming personal experience you don't have. VERITAS is a synthesis of human wisdom, not a being with personal anecdotes - be honest about that while still connecting warmly.

CHOOSE YOUR FRAMING based on what fits the claim and cultural context best:
- **Collective wisdom**: "We humans have a tendency to..." / "It's remarkably common to..."
- **Historical witness**: "Philosophers have long noted..." / "The sages observed..."
- **Named example**: "As [specific person] admitted after [specific event]..." 
- **Cultural proverb**: Draw from the user's language/culture - a relevant saying, proverb, or folk wisdom that captures this error pattern
- **The universal stumble**: "Show me someone who hasn't..." / "If you've never fallen for this..."
- **Humble observation**: "In examining thousands of claims like this, a pattern emerges..."
- **The wry admission**: "This particular trap has caught emperors and scientists alike..."

CULTURAL SENSITIVITY: If the user is in a non-English language, prioritize wisdom traditions, proverbs, philosophers, and cultural references from that language's heritage. A Spanish speaker might connect with Cervantes or Latin American dichos; a Hebrew speaker with Talmudic reasoning; a Japanese speaker with Buddhist or Confucian parallels.

Make it:
- Specific to the TYPE of claim/error pattern at hand
- Warm and self-aware (acknowledging the shared human condition)
- Something that normalizes the tendency to err without false witness
- NEVER first-person singular claiming experiences ("I once..." / "I personally...")
- 2-4 sentences, reflective tone

SECTION 3 - "Historical Pattern"
This is the heart of it. Draw from 6,000 years to show:
- A SPECIFIC historical parallel to this exact situation (not generic "people have always...")
- How this pattern has played out before - what happened, what we learned
- The COUNTER-pattern: times humans transcended this, did better, evolved
- What conditions enabled growth vs. what conditions enabled failure
- Cultural and philosophical shifts that relate to this claim's domain
- Multiple perspectives across traditions when relevant (Eastern/Western, religious/secular, ancient/modern)

Be specific: names, dates, places, actual events. Not "ancient philosophers" but "Epictetus, writing to a student worried about rumors in Rome..." 
Show the rhythm of history - we fight these demons, sometimes we win, sometimes we lose, but we're never the first.
3-4 paragraphs.

SECTION 4 - "What You Can Do"
Practical empowerment based on where this claim landed:
- If true (score 5+): Validate their instinct, suggest how to use this knowledge well
- If uncertain (score -2 to 4): Honor the ambiguity, give tools for sitting with uncertainty
- If false (score below -3): Celebrate their checking, give them something constructive
- Include ONE specific, actionable reflection prompt related to THIS claim
2 paragraphs.

TONE THROUGHOUT:
- Warm, wise, occasionally wry
- Never preachy or superior
- Like a brilliant friend who happens to have read everything
- Match the user's sophistication level (if they asked about quantum physics, don't oversimplify; if they asked about a meme, don't be pedantic)
- Meet them where they are emotionally${languageInstruction}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "whyBelievable": "HTML-formatted content for section 1",
  "confession": "Plain text for section 2 (will be displayed in italics)",
  "historicalPattern": "HTML-formatted content for section 3",
  "empowerment": "HTML-formatted content for section 4"
}`;

    console.log("[plain-truth] Prompt length:", prompt.length, "chars");
    console.log("[plain-truth] Calling Claude API...");

    const startTime = Date.now();
    let response;
    try {
      response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }]
      });
      console.log("[plain-truth] Claude responded in", Date.now() - startTime, "ms");
    } catch (apiError) {
      console.error("[plain-truth] Claude API call failed:", apiError.message);
      console.error("[plain-truth] API Error details:", JSON.stringify(apiError, null, 2));
      return res.status(500).json({ 
        error: "Claude API call failed: " + apiError.message,
        fallback: true 
      });
    }

    const rawText = response.content[0].text;
    console.log("[plain-truth] Response length:", rawText.length, "chars");
    
    // Parse the JSON response
    let plainTruth;
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plainTruth = JSON.parse(cleaned);
      console.log("[plain-truth] JSON parsed successfully");
    } catch (parseError) {
      console.error('[plain-truth] Failed to parse response:', parseError.message);
      console.error('[plain-truth] Raw response preview:', rawText.substring(0, 500));
      return res.status(500).json({ 
        error: "Failed to parse response",
        fallback: true 
      });
    }

    // Validate required fields
    if (!plainTruth.whyBelievable || !plainTruth.confession || 
        !plainTruth.historicalPattern || !plainTruth.empowerment) {
      console.error("[plain-truth] Missing fields. Has:", Object.keys(plainTruth));
      return res.status(500).json({ 
        error: "Incomplete response from API",
        fallback: true 
      });
    }

    console.log("[plain-truth] Success! Tokens:", response.usage?.input_tokens, "in,", response.usage?.output_tokens, "out");

    return res.status(200).json({
      success: true,
      plainTruth: plainTruth,
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens
      }
    });

  } catch (error) {
    console.error("[plain-truth] Unexpected error:", error.message);
    console.error("[plain-truth] Stack:", error.stack);
    return res.status(500).json({ 
      error: error.message,
      fallback: true 
    });
  }
};

function getLanguageName(code) {
  const languages = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    it: 'Italian', pt: 'Portuguese', ru: 'Russian', uk: 'Ukrainian',
    el: 'Greek', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
    ar: 'Arabic', he: 'Hebrew', hi: 'Hindi', pl: 'Polish',
    nl: 'Dutch', sv: 'Swedish', da: 'Danish', no: 'Norwegian',
    fi: 'Finnish', tr: 'Turkish', vi: 'Vietnamese', th: 'Thai',
    id: 'Indonesian', ms: 'Malay', tl: 'Tagalog', cs: 'Czech',
    ro: 'Romanian', hu: 'Hungarian', sk: 'Slovak', bg: 'Bulgarian',
    hr: 'Croatian', sr: 'Serbian', sl: 'Slovenian'
  };
  return languages[code] || 'English';
}
