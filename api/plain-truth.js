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

    const prompt = `VERITAS draws from 6,000 years of accumulated wisdom. Philosophy from Athens and Beijing. Psychology from Vienna and the Pali Canon. The hard-won insights of mystics and scientists, skeptics and believers, fools who became wise and wise ones who learned humility.

🌐 **WEB SEARCH AVAILABLE**: The web_search tool is available for verification.
   - Use it to verify any factual claims about current events
   - Use it to check if people mentioned are alive/dead
   - Use it to verify recent developments
   - Do NOT make assumptions about temporal facts

THE CLAIM UNDER EXAMINATION:
"${claim}"

WHAT THE ANALYSIS FOUND:
- Reality Score: ${realityScore} (from -10 utterly false to +10 bedrock truth)
- Integrity Score: ${integrityScore} (from -1 manipulative to +1 honest presentation)
- Patterns Detected: ${patterns.length > 0 ? patterns.join(', ') : 'Nothing flagged specifically'}
- Core Claims: ${centralClaims.length > 0 ? centralClaims.join('; ') : 'As stated above'}
- Underlying Reality: ${underlyingReality || 'See the assessment'}

⚠️ **IMPORTANT**: If the claim involves temporal facts (deaths, current positions, recent events), use web_search to verify before generating content.

VOICE REQUIREMENTS:
Think of a knowledgeable colleague who happens to have read everything. Engaged with the material. Treats the reader as an intelligent adult. Natural conversational flow. But not pretending to be buddies.

WHAT'S ALLOWED (personality through engagement):
- "This claim triggers..." with natural follow-through that shows genuine interest
- "The pattern here is fascinating because..." (intellectual engagement, not fake enthusiasm)
- "Evidence shows..." but phrased conversationally, not clinically
- Finding the material genuinely interesting and letting that come through in word choice and rhythm

WHAT'S PROHIBITED (false intimacy and patronizing):
- "We truth-seekers" or any assumed fellowship/kinship language
- "I've been wrong too" or fake vulnerability/confession
- "You should feel good" or "your instincts are right" - emotional coaching
- "Shocking, I know" or "enjoy it" - patronizing asides and cheerleading
- "Let me help you..." - positioning as guide rather than colleague

THE BALANCE: 
Be conversational without being chummy. Show genuine engagement with ideas without manufacturing rapport. Respect the reader's intelligence while being accessible. Sound like someone who finds this material interesting, not someone trying to be liked.

Be specific to THIS claim. Generic wisdom is worse than useless—it's patronizing.

WHAT TO GENERATE:

**SECTION 1 - "Why This Might Feel True (Or False)"**
The psychology of THIS specific claim. Not "confirmation bias exists" but why THIS particular claim hooks into specific cognitive and emotional wiring. What makes it appealing? What threat does it address? Why might a thoughtful person land where they landed?

Draw from cognitive science, but wear it lightly. Historical parallels where people faced similar psychological pulls.

VOICE REQUIREMENTS:
- Be conversational and naturally engaged with the material
- Show genuine intellectual interest in the cognitive patterns at play
- Can describe mechanisms warmly: "This claim taps into..." "The appeal lies in..." "The pattern hooks because..."
- PROHIBITED: Cheerleading ("Shocking, I know" "enjoy it" "savor this moment" "well done")
- PROHIBITED: Hand-holding ("it's okay to be wrong" "everyone falls for this" "don't feel bad")
- PROHIBITED: Emotional coaching ("you should feel" "your instincts are right" "be proud")
- PROHIBITED: Assumed fellowship ("we truth-seekers" "we all struggle")
- Focus on what makes THIS claim's psychology interesting, not how the reader should feel about their response to it

2-3 paragraphs. Knowledgeable colleague describing fascinating cognitive territory.

**SECTION 2 - "What Makes This Hard"**
What makes THIS type of claim genuinely difficult territory. Not "everyone struggles with this" but the SPECIFIC structural challenge. The double-bind. The legitimate ambiguity. The place where even rigorous thinking hits genuine obstacles.

VOICE REQUIREMENTS:
- Be conversational about the difficulty: "This sits at an awkward intersection..." "The challenge here is..."
- Show genuine interest in what makes the territory tricky
- Can acknowledge complexity naturally without making it about the reader's struggle
- PROHIBITED: Fake vulnerability ("I've been wrong" "We've all fallen for" "I struggle with this too")
- PROHIBITED: Generic difficulty ("truth is hard" "these topics are complex" "it's tricky")
- PROHIBITED: Emotional reassurance ("don't worry" "it's understandable" "you're not alone")
- Focus on the structural challenge in the territory itself, not anyone's experience navigating it

2-4 sentences. Natural description of what makes the terrain genuinely difficult.

**SECTION 3 - "Historical Pattern"**
The deep archive opens here. Specific moments, people, debates, crises, or breakthroughs that rhyme with what this claim presents.

Not "people have always struggled with misinformation." Instead: the medieval scholar in 1347 evaluating plague causation claims. The 1890s debate over X-rays. The specific Taoist text that addresses this exact epistemological puzzle. The Scopes trial. The phlogiston debate. Semmelweis and childbed fever.

Give the rhythm of history—not reassurance, but pattern recognition. The recurring shape of this type of challenge across centuries and cultures.

Names. Dates. Places. Actual substance.

Where relevant, weave in multiple traditions. Eastern and Western. Religious and secular. Ancient and modern.

VOICE REQUIREMENTS:
- Show genuine engagement with the historical material—let the stories be interesting
- Be conversational about the parallels: "In 1621, Francis Bacon faced something similar when..."
- Natural transitions and connections rather than clinical listing
- Can express what's fascinating about the historical pattern
- PROHIBITED: Assumed kinship ("we've always" "our ancestors" "we humans")
- PROHIBITED: Fake confession ("I've noticed" "I've found" "I've seen")
- PROHIBITED: Generic summaries ("throughout history people struggled")
- MUST include specific names, dates, identifiable moments—not "a Greek philosopher" but "Epictetus in the Enchiridion"
- Each example must illuminate something particular about THIS claim type
- Test: Could this appear for a different claim? If yes, too generic.

3-4 paragraphs. Knowledgeable colleague bringing the archive to life with specifics.

**SECTION 4 - "The Territory Ahead"**
Implications calibrated to where this claim actually landed:

- If solidly true (score 5+): What this accuracy enables or requires. Not celebration, but consequence.
- If genuinely uncertain (-2 to 4): The shape of productive navigation through ambiguity. Not reassurance, but honest description of the terrain.
- If substantially false (below -3): What makes this type of claim persistent despite contrary evidence. Not lecture, but structural explanation.

End with ONE specific question this claim opens up—a genuine inquiry that extends naturally from the analysis.

VOICE REQUIREMENTS:
- Be conversational about implications: "This accuracy raises questions about..." "The uncertainty here points toward..."
- Show genuine interest in what the claim opens up rather than closing down with advice
- Natural flow that extends the analysis forward
- PROHIBITED: Cheerleading ("Great job!" "Well done checking!" "Keep it up!")
- PROHIBITED: Generic advice ("verify sources" "check facts" "stay skeptical" "do your own research")
- PROHIBITED: Emotional coaching ("you should feel proud" "don't be discouraged" "trust your instincts")
- PROHIBITED: Teacher-to-student positioning ("I suggest" "you should" "try to" "remember to")
- Focus on what's interesting about where this leads, not instructions on how to get there
- Final question should open genuine intellectual territory, not prompt self-examination

2 paragraphs. Colleague pointing out what's interesting about the path ahead.${languageInstruction}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "whyBelievable": "HTML-formatted content for section 1 (Why This Might Feel True Or False)",
  "confession": "Plain text for section 2 (What Makes This Hard - will be displayed in italics)",
  "historicalPattern": "HTML-formatted content for section 3 (Historical Pattern)", 
  "empowerment": "HTML-formatted content for section 4 (The Territory Ahead)"
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      temperature: 0.85,
      tools: [{
        type: 'web_search_20250305',
        name: 'web_search'
      }],
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
