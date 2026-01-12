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

  try {
    const { 
      claim,
      realityScore,
      integrityScore,
      structured,
      language = 'en'
    } = req.body;

    if (!claim) {
      return res.status(400).json({ error: "Missing claim" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VERITAS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const client = new Anthropic({ apiKey });

    // Build context from the assessment
    const patterns = structured?.truthDistortionPatterns || [];
    const centralClaims = structured?.centralClaims?.explicit || [];
    const underlyingReality = structured?.underlyingReality || structured?.underlyingTruth || '';
    
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

SECTION 2 - "A Confession"  
Write a brief first-person confession (as VERITAS/the system) about a time "I" fell for something similar OR made this same kind of mistake. Make it:
- Specific to the TYPE of claim/error pattern at hand
- Self-deprecating but insightful
- Something that normalizes the human tendency to err
- 2-4 sentences, italicized feel

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

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      temperature: 0.8, // Slightly higher for more creative historical connections
      messages: [{ role: "user", content: prompt }]
    });

    const rawText = response.content[0].text;
    
    // Parse the JSON response
    let plainTruth;
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plainTruth = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse Plain Truth response:', parseError);
      console.error('Raw response:', rawText);
      return res.status(500).json({ 
        error: "Failed to parse response",
        fallback: true 
      });
    }

    // Validate required fields
    if (!plainTruth.whyBelievable || !plainTruth.confession || 
        !plainTruth.historicalPattern || !plainTruth.empowerment) {
      return res.status(500).json({ 
        error: "Incomplete response from API",
        fallback: true 
      });
    }

    return res.status(200).json({
      success: true,
      plainTruth: plainTruth,
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens
      }
    });

  } catch (error) {
    console.error("Plain Truth API error:", error);
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
