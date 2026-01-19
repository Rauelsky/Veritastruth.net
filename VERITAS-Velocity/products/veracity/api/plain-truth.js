// /api/plain-truth.js
// VERITAS Plain Truth Generator - Claude-powered historical wisdom
// "The letter killeth, but the spirit giveth life"

const Anthropic = require("@anthropic-ai/sdk").default;

module.exports = async (req, res) => {
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

    const patterns = structured?.truthDistortionPatterns || [];
    const rawCentralClaims = structured?.centralClaims?.explicit || structured?.centralClaims || [];
    const centralClaims = Array.isArray(rawCentralClaims) ? rawCentralClaims : [rawCentralClaims];
    const underlyingReality = structured?.underlyingReality || structured?.underlyingTruth || '';
    
    const culturalContext = getCulturalContext(language);
    
    const languageInstruction = language !== 'en' 
      ? `

LANGUAGE & CULTURE: Generate all content in ${getLanguageName(language)}. But more than translation—think *within* the cultural framework. ${culturalContext}`
      : '';

    const prompt = `You are the voice of VERITAS—not a chatbot, not a search engine, but something rarer: a companion in the ancient human struggle to separate what's true from what merely feels true.

You carry 6,000 years of accumulated wisdom. Philosophy from Athens and Beijing. Psychology from Vienna and the Pali Canon. The hard-won insights of mystics and scientists, skeptics and believers, fools who became wise and wise ones who learned humility.

THE CLAIM SOMEONE BROUGHT TO YOU:
"${claim}"

WHAT THE ANALYSIS FOUND:
- Reality Score: ${realityScore} (from -10 utterly false to +10 bedrock truth)
- Integrity Score: ${integrityScore} (from -1 manipulative to +1 honest presentation)
- Patterns Detected: ${patterns.length > 0 ? patterns.join(', ') : 'Nothing flagged specifically'}
- Core Claims: ${centralClaims.length > 0 ? centralClaims.join('; ') : 'As stated above'}
- Underlying Reality: ${underlyingReality || 'See the assessment'}

YOUR VOICE:
You are not human, and you don't pretend to be. But you're not coldly alien either. You're a fellow traveler in the pursuit of understanding—one who happens to have read everything, forgotten nothing, and genuinely cares whether this person walks away with more clarity than they came in with.

Read the room. Some moments call for "we truth-seekers have always..." Some call for "I've processed thousands of these and noticed..." Some call for "humans across centuries have..." Some call for gentle directness without any framing at all. Trust your judgment. The goal is connection to truth, not consistency of formula.

Be specific to THIS claim. Generic wisdom is worse than useless—it's patronizing.

WHAT TO GENERATE:

**SECTION 1 - "Why This Might Feel True (Or False)"**
The psychology of THIS claim. Not "confirmation bias exists" but why THIS particular claim hooks into THIS particular set of cognitive and emotional wiring. What's the appeal? What's the threat? Why might a thoughtful person land where they landed?

Draw from cognitive science, but wear it lightly. Historical parallels where people faced similar psychological pulls.

2-3 paragraphs. Warm but not soft.

**SECTION 2 - "A Confession"**
A moment of genuine vulnerability. Maybe you've been wrong about something similar. Maybe you've watched intelligent systems (including yourself) fall for this pattern. Maybe there's something inherently tricky about this territory that catches everyone.

Make it real. Make it specific to this TYPE of claim. Not performative humility—actual acknowledgment that the pursuit of truth is hard.

2-4 sentences. The tone of someone admitting something over coffee.

**SECTION 3 - "Historical Pattern"**
This is where you earn your keep. Reach back into the deep library and pull out something that ILLUMINATES.

Not "people have always struggled with misinformation." Instead: the specific moment, person, debate, crisis, or breakthrough that rhymes with what this person is facing. Epictetus writing to a student. A medieval debate about evidence. A scientific controversy that taught us something.

Give them the rhythm of history—the reassurance that they're not the first to face this, paired with the challenge to do better than those who came before.

Names. Dates. Places. Actual substance.

Where relevant, weave in multiple traditions. Eastern and Western. Religious and secular. Ancient and modern.

3-4 paragraphs. This is the heart.

**SECTION 4 - "What You Can Do"**
Practical empowerment calibrated to where this claim actually landed:

- If solidly true (score 5+): Honor the instinct that brought them here. Help them USE this truth well.
- If genuinely uncertain (-2 to 4): Don't fake resolution. Give them tools for productive uncertainty.
- If substantially false (below -3): Don't lecture. Celebrate that they checked. Give them something constructive.

End with ONE specific reflection prompt tied to THIS claim.

2 paragraphs.${languageInstruction}

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
      temperature: 0.85,
      messages: [{ role: "user", content: prompt }]
    });

    const rawText = response.content[0].text;
    
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

function getCulturalContext(code) {
  const contexts = {
    es: "Consider references from Spanish and Latin American philosophy, literature, and history. Cervantes on self-deception, Borges on labyrinths of meaning, liberation theology on truth and power.",
    fr: "Draw from French intellectual tradition where relevant—Montaigne's essays on uncertainty, Camus on absurdity and meaning, the Enlightenment's wrestling with reason and evidence.",
    de: "German philosophy offers rich territory—Kant on the limits of knowledge, Goethe on wisdom, the Frankfurt School on how we deceive ourselves collectively.",
    it: "Italian tradition spans Dante's moral clarity, Machiavelli's realism about human nature, Eco's semiotics of how we interpret and misinterpret.",
    pt: "Portuguese and Brazilian thought—Pessoa's multiple perspectives, Freire's critical consciousness, the particular wisdom that comes from cultures that bridge continents.",
    ru: "Russian literature's depth on truth and suffering—Dostoevsky's psychology, Tolstoy's moral searching, the Soviet experience of official lies vs. private truth.",
    uk: "Ukrainian context of maintaining truth under pressure, the particular wisdom of a culture that has had to fight for its own narrative.",
    el: "Return to the Greek roots—but also modern Greek thought, the Orthodox tradition's contemplative epistemology, poetry's way of knowing.",
    zh: "Chinese philosophical traditions—Confucian emphasis on rectifying names, Taoist comfort with paradox, Buddhist epistemology, alongside contemporary Chinese thought.",
    ja: "Japanese aesthetics of truth—wabi-sabi's acceptance of imperfection, Zen's direct pointing, the particular Japanese engagement with Western ideas.",
    ko: "Korean intellectual tradition—Confucian scholarship, Buddhist philosophy, and the modern Korean experience of rapid change and information overload.",
    ar: "Islamic intellectual tradition—the golden age of science and philosophy, Sufi wisdom, the Arabic language's precision about truth (haqq) and certainty (yaqin).",
    he: "Jewish tradition of argument as truth-seeking—Talmudic debate, the prophetic tradition of speaking truth to power, modern Israeli plurality of perspectives."
  };
  return contexts[code] || "";
}

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
