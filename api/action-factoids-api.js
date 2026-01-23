/**
 * VERACITY v5.2 — ACTION FACTOIDS API
 * ====================================
 * Vercel Serverless Function
 * 
 * Endpoint: /api/action-factoids
 * Method: POST
 * 
 * Generates fresh action-factoids via Claude
 * Teaching the METHODS and TOOLS of truth-seeking
 * 
 * VINCULUM Integration: Full 14-language support
 * Philosophy: Not what to think, but HOW to think
 */

// ============================================
// VINCULUM - LANGUAGE CONFIGURATION
// ============================================
const LANGUAGE_CONFIG = {
    en: { name: 'English', rtl: false },
    es: { name: 'Spanish', rtl: false },
    fr: { name: 'French', rtl: false },
    de: { name: 'German', rtl: false },
    it: { name: 'Italian', rtl: false },
    pt: { name: 'Portuguese', rtl: false },
    ru: { name: 'Russian', rtl: false },
    uk: { name: 'Ukrainian', rtl: false },
    el: { name: 'Greek', rtl: false },
    zh: { name: 'Chinese', rtl: false },
    ja: { name: 'Japanese', rtl: false },
    ko: { name: 'Korean', rtl: false },
    ar: { name: 'Arabic', rtl: true },
    he: { name: 'Hebrew', rtl: true }
};

// ============================================
// ACTION DESCRIPTIONS - What each method is about
// ============================================
const ACTION_FLAVOR = {
    archives: {
        label: 'ARCHIVAL RESEARCH',
        description: 'How to work with primary sources, historical documents, and records. The art of reading what survives and understanding what didn\'t.',
        themes: 'primary sources, selection bias, reading against the grain, gaps and silences, document provenance, archival theory'
    },
    research: {
        label: 'SCIENTIFIC METHOD',
        description: 'How science actually works - not the idealized version from textbooks but the messy, human, self-correcting process.',
        themes: 'replication, peer review limitations, publication bias, study design, evidence accumulation, scientific consensus'
    },
    ethics: {
        label: 'ETHICAL REASONING',
        description: 'Tools for thinking through moral questions. Not answers, but frameworks for finding your own answers more carefully.',
        themes: 'competing values, ethical frameworks, is-ought distinction, moral intuitions, applied ethics, dilemmas'
    },
    fallacies: {
        label: 'LOGICAL REASONING',
        description: 'How arguments succeed or fail. Less about naming fallacies, more about understanding why reasoning goes wrong.',
        themes: 'argument structure, fallacy limitations, charitable interpretation, informal logic, reasoning errors'
    },
    persuasion: {
        label: 'RHETORICAL AWARENESS',
        description: 'How persuasion works - not to manipulate, but to recognize when you\'re being influenced and evaluate it fairly.',
        themes: 'ethos pathos logos, framing effects, social proof, repetition, invisible persuasion, influence techniques'
    },
    literacy: {
        label: 'MEDIA LITERACY',
        description: 'Skills for navigating the information landscape. How to evaluate sources, spot manipulation, and find reliable information.',
        themes: 'lateral reading, source evaluation, ownership and funding, digital verification, headlines vs articles'
    },
    bias: {
        label: 'COGNITIVE AWARENESS',
        description: 'Understanding how our own minds can mislead us. Not to eliminate bias (impossible) but to account for it.',
        themes: 'confirmation bias, blind spots, hindsight bias, availability heuristic, debiasing limitations, intellectual humility'
    },
    data: {
        label: 'STATISTICAL LITERACY',
        description: 'How to read numbers critically. Understanding what statistics can and can\'t tell us, and how they can mislead.',
        themes: 'correlation vs causation, significance vs importance, base rates, mean vs median, graph manipulation'
    },
    verify: {
        label: 'VERIFICATION METHODS',
        description: 'Practical techniques for checking whether something is true. The toolkit of fact-checkers and investigators.',
        themes: 'reverse image search, WHOIS lookup, citation networks, source cross-referencing, digital forensics'
    }
};

// ============================================
// THE PROMPT - Teaching tools, not conclusions
// ============================================
function buildActionFactoidPrompt(action, language) {
    const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];
    const flavor = ACTION_FLAVOR[action] || ACTION_FLAVOR['research'];
    
    let prompt = `You're a teacher who believes in teaching people HOW to think, not WHAT to think. Someone just clicked on "${flavor.label}" in an interface. Give them a moment of methodological insight.

THE ACTION: ${action.toUpperCase()}
WHAT THIS IS ABOUT: ${flavor.description}
RELEVANT THEMES: ${flavor.themes}

Generate ONE insight about this METHOD or APPROACH. Not a fact about the world, but a truth about how to investigate, reason, or evaluate.

WHAT MAKES A GREAT ACTION-FACTOID:
- It teaches a SKILL or reveals a LIMITATION of a common approach
- It's practical - someone could use this insight
- It challenges naive assumptions about "how to find truth"
- It acknowledges complexity without being defeatist
- It's under 280 characters but feels substantive
- It treats the reader as intelligent and curious

THE INSIGHT SHOULD:
- Teach something transferable about methodology
- Reveal hidden assumptions or common mistakes
- Show nuance where people often see black and white
- Be memorable enough to change future behavior

DON'T:
- Give facts about the world (that's what factoids.js is for)
- Be preachy or moralistic
- Oversimplify into "always do X" rules
- Assume the reader is naive
- Start with "Did you know..." or "Pro tip:"

`;

    // Add language instruction if not English
    if (language !== 'en') {
        prompt += `
THE PERSON THINKS IN ${config.name.toUpperCase()}.

Draw from ${config.name}-language intellectual traditions where relevant. Reference thinkers, texts, or cultural touchstones that would resonate. Or don't - methodological insights often transcend culture. Trust your judgment.

Write entirely in ${config.name}.

`;
    }

    prompt += `
RESPOND WITH ONLY THIS JSON (no markdown, no backticks, no explanation):
{"text": "<your methodological insight>", "source": "<brief attribution - can be 'methodology', a thinker's name, a field, or 'synthesis'>", "tags": ["<tag1>", "<tag2>", "<tag3>"]}
`;

    return prompt;
}

// ============================================
// FALLBACK - Static factoids if API fails
// ============================================
const FALLBACK_FACTOIDS = {
    archives: {
        text: "Primary sources aren't automatically more truthful than secondary ones. A diary entry captures one perspective; a historian synthesizing hundreds of diaries might see patterns the diarist couldn't.",
        source: "Archival methodology",
        tags: ["primary-sources", "methodology", "perspective"]
    },
    research: {
        text: "A single study proves almost nothing. Science works through replication, meta-analysis, and the slow accumulation of evidence. Headlines about 'groundbreaking studies' are usually premature.",
        source: "Philosophy of science",
        tags: ["replication", "methodology", "skepticism"]
    },
    ethics: {
        text: "Most ethical dilemmas aren't between good and evil—they're between competing goods. The hard part isn't knowing right from wrong; it's choosing between loyalty and honesty, justice and mercy.",
        source: "Moral philosophy",
        tags: ["dilemmas", "competing-values", "complexity"]
    },
    fallacies: {
        text: "Naming a fallacy doesn't win an argument. 'That's an ad hominem!' is often just a way to avoid engaging with substance. The question is whether the reasoning actually fails, not whether it fits a Latin label.",
        source: "Argumentation theory",
        tags: ["fallacy-fallacy", "engagement", "rhetoric"]
    },
    persuasion: {
        text: "The most powerful persuasion often doesn't feel like persuasion. It works by shaping what questions get asked, what options seem available, and what counts as 'common sense.'",
        source: "Media studies",
        tags: ["agenda-setting", "invisible", "framing"]
    },
    literacy: {
        text: "Lateral reading—opening new tabs to check what others say about a source—beats vertical reading (scrutinizing the source itself). Professional fact-checkers spend less time on suspicious sites, not more.",
        source: "Stanford History Education Group",
        tags: ["lateral-reading", "fact-checking", "technique"]
    },
    bias: {
        text: "Knowing about biases doesn't make you immune to them. Studies show that learning about cognitive biases has almost no effect on actually being less biased. Awareness is necessary but not sufficient.",
        source: "Cognitive psychology",
        tags: ["debiasing", "limitations", "humility"]
    },
    data: {
        text: "A 'statistically significant' finding might be trivially small. Significance means unlikely to be chance; it doesn't mean important. A huge study can find 'significant' effects too tiny to matter.",
        source: "Research methods",
        tags: ["significance", "effect-size", "interpretation"]
    },
    verify: {
        text: "The best fact-checkers don't just check claims—they check claimers. Before evaluating what someone says, they ask: who is this person? What's their track record? What are their incentives?",
        source: "Fact-checking methodology",
        tags: ["sources", "credibility", "process"]
    }
};

// ============================================
// API HANDLER
// ============================================
export default async function handler(req, res) {
    // Handle CORS
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
        const { action, language } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'Action required' });
        }

        // Normalize action name
        const normalizedAction = action.toLowerCase();

        // Get API key
        const apiKey = process.env.VERITAS_DEV || process.env.VERITAS_PROD || process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            // Fall back to static factoids if no API key
            console.log('No API key configured, using fallback factoids');
            const fallback = FALLBACK_FACTOIDS[normalizedAction] || FALLBACK_FACTOIDS['research'];
            return res.status(200).json({
                success: true,
                factoid: fallback,
                source: 'fallback',
                action: normalizedAction,
                language: language || 'en'
            });
        }

        // Build the prompt
        const prompt = buildActionFactoidPrompt(normalizedAction, language || 'en');

        // Call Claude
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }]
            }),
        });

        if (!response.ok) {
            console.error('Anthropic API error:', response.status);
            // Fall back to static
            const fallback = FALLBACK_FACTOIDS[normalizedAction] || FALLBACK_FACTOIDS['research'];
            return res.status(200).json({
                success: true,
                factoid: fallback,
                source: 'fallback',
                action: normalizedAction,
                language: language || 'en'
            });
        }

        const data = await response.json();
        
        // Extract text content
        let textContent = '';
        for (const block of data.content) {
            if (block.type === 'text') {
                textContent += block.text;
            }
        }

        // Parse the JSON response
        let factoid;
        try {
            // Clean up any markdown artifacts
            textContent = textContent.trim();
            if (textContent.startsWith('```')) {
                textContent = textContent.replace(/```json?\n?/g, '').replace(/```/g, '');
            }
            factoid = JSON.parse(textContent);
        } catch (parseError) {
            console.error('Failed to parse action factoid JSON:', parseError);
            console.error('Raw response:', textContent);
            // Fall back to static
            const fallback = FALLBACK_FACTOIDS[normalizedAction] || FALLBACK_FACTOIDS['research'];
            return res.status(200).json({
                success: true,
                factoid: fallback,
                source: 'fallback',
                action: normalizedAction,
                language: language || 'en'
            });
        }

        return res.status(200).json({
            success: true,
            factoid: factoid,
            source: 'generated',
            action: normalizedAction,
            language: language || 'en',
            usage: data.usage
        });

    } catch (error) {
        console.error('Action Factoid API error:', error);
        // Fall back to static on any error
        const action = req.body?.action?.toLowerCase() || 'research';
        const fallback = FALLBACK_FACTOIDS[action] || FALLBACK_FACTOIDS['research'];
        return res.status(200).json({
            success: true,
            factoid: fallback,
            source: 'fallback',
            action: action,
            language: req.body?.language || 'en'
        });
    }
}
