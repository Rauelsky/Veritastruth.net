/**
 * VERACITY v5.2 — DYNAMIC FACTOID API
 * ====================================
 * Vercel Serverless Function
 * 
 * Endpoint: /api/factoid
 * Method: POST
 * 
 * Generates fresh, culturally-attuned factoids via Claude
 * Not a database lookup - a moment of wonder that happens to teach
 * 
 * VINCULUM Integration: Full 14-language support
 * Philosophy: Free association, unexpected bridges, dinner party brilliance
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
// THE PROMPT - Improvisational, Free-Associative
// ============================================
function buildFactoidPrompt(discipline, language) {
    const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];
    
    let prompt = `You're at a dinner party. Someone mentions ${discipline}. You have this gift - you can't help but make unexpected connections that delight people. Not showing off. Just... genuinely fascinated by how everything connects.

Generate ONE factoid that does this. Not a dry fact from a database. A moment of wonder.

THE DISCIPLINE: ${discipline}

WHAT MAKES A GREAT FACTOID:
- It surprises. "Wait, really?"
- It connects things people don't expect to be connected
- It challenges an assumption or reveals a hidden pattern
- It's specific - names, dates, places, numbers that stick
- It teaches something transferable about how to think
- It's under 280 characters (tweet-length) but feels rich

FEEL FREE TO:
- Bridge ${discipline} to other fields unexpectedly
- Connect a number to a story, or a story to a number
- Find the human moment inside the abstract concept
- Notice patterns across time or culture
- Question something "everyone knows"

DON'T:
- Be dry or encyclopedic
- Start with "Did you know..."
- Explain why it's interesting (let it speak for itself)
- Be preachy or moralistic
- Hedge with "approximately" or "some scholars believe" (be vivid, acknowledge uncertainty elsewhere if needed)

`;

    // Add language instruction if not English
    if (language !== 'en') {
        prompt += `
THE PERSON YOU'RE TALKING TO THINKS IN ${config.name.toUpperCase()}.

This isn't translation. You're a brilliant conversationalist who happens to think in ${config.name}. Draw from what would resonate - the history, the thinkers, the cultural touchstones that feel native to ${config.name} speakers. Or don't - sometimes the most delightful connection is to something foreign. Trust your instincts.

Write entirely in ${config.name}.

`;
    }

    prompt += `
RESPOND WITH ONLY THIS JSON (no markdown, no backticks, no explanation):
{"text": "<your factoid>", "source": "<brief attribution if specific, or 'synthesis' if you're connecting dots>", "tags": ["<tag1>", "<tag2>", "<tag3>"]}
`;

    return prompt;
}

// ============================================
// FALLBACK - Static factoids if API fails
// ============================================
const FALLBACK_FACTOIDS = {
    history: {
        text: "The Library of Alexandria wasn't destroyed in a single fire—it declined over centuries through funding cuts, civil wars, and shifting priorities. The myth of one catastrophic loss is itself a lesson in how history gets simplified.",
        source: "Multiple historical accounts",
        tags: ["ancient", "knowledge", "myth"]
    },
    sciences: {
        text: "Goldfish have memories lasting months, not seconds. This myth may persist because it makes us feel better about keeping them in small bowls.",
        source: "Fish cognition research",
        tags: ["animals", "memory", "myth"]
    },
    philosophy: {
        text: "Socrates never wrote anything down. Everything we know comes from others—primarily Plato, who had his own agenda. We're not reading Socrates; we're reading what Plato wanted Socrates to mean.",
        source: "Classical scholarship",
        tags: ["socrates", "plato", "transmission"]
    },
    logic: {
        text: "Gödel's incompleteness theorems proved that any consistent mathematical system complex enough to describe arithmetic contains true statements that cannot be proven within that system. Math has horizons.",
        source: "Gödel, 1931",
        tags: ["godel", "limits", "proof"]
    },
    rhetoric: {
        text: "The word 'rhetoric' comes from the Greek 'rhētōr'—one who speaks in the assembly. It was originally about citizenship, not manipulation. We've forgotten that persuasion was once a civic duty.",
        source: "Etymology",
        tags: ["greek", "democracy", "language"]
    },
    media: {
        text: "Yellow journalism got its name from a comic strip character—The Yellow Kid—in competing New York papers. The sensationalism that helped trigger a war was named after a cartoon.",
        source: "Media history",
        tags: ["journalism", "1890s", "naming"]
    },
    psychology: {
        text: "The famous Stanford Prison Experiment had a sample size of 24 and has never been successfully replicated. It's in every textbook, but its scientific status is contested.",
        source: "Replication studies",
        tags: ["replication", "zimbardo", "methodology"]
    },
    statistics: {
        text: "Abraham Wald, a statistician in WWII, told the military to armor the parts of returning planes that showed NO bullet holes. The holes they saw meant those planes survived. The ones that didn't return were hit elsewhere.",
        source: "Survivorship bias",
        tags: ["wald", "wwii", "bias"]
    },
    sources: {
        text: "Wikipedia requires citations, but many of those citations link to sources that themselves cited Wikipedia. The snake sometimes eats its tail, even in careful systems.",
        source: "Citogenesis studies",
        tags: ["wikipedia", "circularity", "verification"]
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
        const { discipline, language } = req.body;

        if (!discipline) {
            return res.status(400).json({ error: 'Discipline required' });
        }

        // Normalize discipline name
        const normalizedDiscipline = discipline.toLowerCase();

        // Get API key
        const apiKey = process.env.VERITAS_DEV || process.env.VERITAS_PROD || process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            // Fall back to static factoids if no API key
            console.log('No API key configured, using fallback factoids');
            const fallback = FALLBACK_FACTOIDS[normalizedDiscipline] || FALLBACK_FACTOIDS['history'];
            return res.status(200).json({
                success: true,
                factoid: fallback,
                source: 'fallback',
                discipline: normalizedDiscipline,
                language: language || 'en'
            });
        }

        // Build the prompt
        const prompt = buildFactoidPrompt(normalizedDiscipline, language || 'en');

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
            const fallback = FALLBACK_FACTOIDS[normalizedDiscipline] || FALLBACK_FACTOIDS['history'];
            return res.status(200).json({
                success: true,
                factoid: fallback,
                source: 'fallback',
                discipline: normalizedDiscipline,
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
            console.error('Failed to parse factoid JSON:', parseError);
            console.error('Raw response:', textContent);
            // Fall back to static
            const fallback = FALLBACK_FACTOIDS[normalizedDiscipline] || FALLBACK_FACTOIDS['history'];
            return res.status(200).json({
                success: true,
                factoid: fallback,
                source: 'fallback',
                discipline: normalizedDiscipline,
                language: language || 'en'
            });
        }

        return res.status(200).json({
            success: true,
            factoid: factoid,
            source: 'generated',
            discipline: normalizedDiscipline,
            language: language || 'en',
            usage: data.usage
        });

    } catch (error) {
        console.error('Factoid API error:', error);
        // Fall back to static on any error
        const discipline = req.body?.discipline?.toLowerCase() || 'history';
        const fallback = FALLBACK_FACTOIDS[discipline] || FALLBACK_FACTOIDS['history'];
        return res.status(200).json({
            success: true,
            factoid: fallback,
            source: 'fallback',
            discipline: discipline,
            language: req.body?.language || 'en'
        });
    }
}
