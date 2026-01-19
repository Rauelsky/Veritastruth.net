/**
 * VERACITY v5.2 — DYNAMIC MICRODISCOVERY API
 * ===========================================
 * Vercel Serverless Function
 * 
 * Endpoint: /api/microdiscovery
 * Method: POST
 * 
 * Generates fresh number-with-story pairs via Claude
 * Every number has a soul. Every digit hides a story.
 * 
 * VINCULUM Integration: Full 14-language support
 * Philosophy: Numbers aren't data - they're frozen moments of human experience
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
// DISCIPLINE FLAVOR - What kinds of numbers live here?
// ============================================
const DISCIPLINE_FLAVOR = {
    history: "Years when everything changed. Durations that shaped empires. Counts that tell stories - how many ships, how many days, how many survivors.",
    sciences: "Atomic numbers with personality. Constants that hold the universe together. Measurements that rewrote what we thought was possible. The temperature at which everything changes.",
    philosophy: "The year a dangerous idea was born. How many words in a treatise that changed everything. The age at which a thinker finally understood. Numbers that mark intellectual earthquakes.",
    logic: "The year a proof shattered certainty. How many axioms underpin everything. The number of steps in an argument that changed mathematics forever. Gödel's numbers, Turing's limits.",
    rhetoric: "Word counts that moved nations. The number of times a phrase was repeated until it became truth. Years when language itself shifted. The ratio of ethos to pathos in speeches that mattered.",
    media: "Circulation numbers that toppled governments. Broadcast frequencies that changed culture. The year the medium became the message. Viewer counts on the night everything changed.",
    psychology: "Sample sizes that fooled us. The magic number 7±2. Years when we discovered we weren't who we thought. Percentages that reveal our hidden irrationality.",
    statistics: "P-values that lied. Confidence intervals on history's biggest gambles. The number Wald circled on the airplane diagram. Base rates we keep forgetting.",
    sources: "Citation counts that measure influence (or gaming). The half-life of a fact. How many times a lie circles the globe before truth gets its boots on. The year Wikipedia became a primary source."
};

// ============================================
// THE PROMPT - Numbers with souls
// ============================================
function buildMicrodiscoveryPrompt(discipline, language) {
    const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];
    const flavor = DISCIPLINE_FLAVOR[discipline] || DISCIPLINE_FLAVOR['history'];
    
    let prompt = `You collect numbers the way some people collect stories. Because to you, they ARE stories.

Someone's hovering over the ${discipline.toUpperCase()} section of an interface. They're about to see a number. Make it count.

THE DISCIPLINE: ${discipline}
THE KIND OF NUMBERS THAT LIVE HERE: ${flavor}

WHAT MAKES A GREAT MICRODISCOVERY:
- The number itself is visually interesting (years, atomic numbers, counts, ratios, constants)
- The tooltip reveals why this number MATTERS - the human story frozen inside it
- It creates a tiny "oh!" moment - surprise, recognition, or wonder
- The tooltip is SHORT (under 100 characters) but evocative
- It makes someone want to know more

THE NUMBER CAN BE:
- A year (1969, 1789, 476, 1844)
- An atomic number (79, 6, 92)
- A count (24 - the sample size that fooled psychology)
- A constant (299,792 - nothing goes faster)
- A ratio or percentage (7±2, 0.05)
- A measurement (4.5B - age of Earth in years)
- A duration (40 days, 10,000 hours)
- Anything that carries weight

CATEGORY must be one of: year, atomic, constant, count, percentage, duration, ratio

DON'T:
- Pick obvious numbers everyone knows (1776, π to 5 decimals)
- Write dry encyclopedia tooltips
- Explain too much - leave them curious
- Pick numbers that need paragraphs to understand

`;

    // Add language instruction if not English
    if (language !== 'en') {
        prompt += `
THE PERSON SEES THIS IN ${config.name.toUpperCase()}.

You're not translating a number - you're finding numbers that resonate. Maybe it's a year from ${config.name}-speaking history. Maybe it's a universal constant explained through a ${config.name} lens. Maybe it's the word count of something written in ${config.name} that changed minds.

Or maybe it's something completely unexpected - the best numbers transcend language.

Write the tooltip in ${config.name}. The number itself is just a number.

`;
    }

    prompt += `
RESPOND WITH ONLY THIS JSON (no markdown, no backticks, no explanation):
{"displayValue": "<the number, formatted nicely>", "tooltip": "<under 100 chars, evocative>", "category": "<year|atomic|constant|count|percentage|duration|ratio>"}

Now. Find me a number with a soul.
`;

    return prompt;
}

// ============================================
// FALLBACK - Static entries if API fails
// ============================================
const FALLBACK_ENTRIES = {
    history: { displayValue: '1844', tooltip: '"What hath God wrought" — first telegraph message rewires humanity', category: 'year' },
    sciences: { displayValue: '79', tooltip: 'Gold. Incorruptible. Wars fought, economies crashed, all for atomic number 79.', category: 'atomic' },
    philosophy: { displayValue: '399', tooltip: 'Socrates drinks the hemlock. Questions, it turns out, are dangerous.', category: 'year' },
    logic: { displayValue: '1931', tooltip: 'Gödel publishes. Mathematics discovers it has horizons.', category: 'year' },
    rhetoric: { displayValue: '272', tooltip: 'Words in the Gettysburg Address. The other speaker used 13,607.', category: 'count' },
    media: { displayValue: '1938', tooltip: 'War of the Worlds broadcast. America learns it can be hacked.', category: 'year' },
    psychology: { displayValue: '24', tooltip: 'Stanford Prison Experiment sample size. In every textbook. Never replicated.', category: 'count' },
    statistics: { displayValue: '0.05', tooltip: 'The p-value threshold. Arbitrary. Sacred. Occasionally lying.', category: 'ratio' },
    sources: { displayValue: '6', tooltip: 'Degrees of separation. Except on Wikipedia, where it\'s usually 3.', category: 'count' }
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
            // Fall back to static entries if no API key
            console.log('No API key configured, using fallback entries');
            const fallback = FALLBACK_ENTRIES[normalizedDiscipline] || FALLBACK_ENTRIES['history'];
            return res.status(200).json({
                success: true,
                entry: fallback,
                source: 'fallback',
                discipline: normalizedDiscipline,
                language: language || 'en'
            });
        }

        // Build the prompt
        const prompt = buildMicrodiscoveryPrompt(normalizedDiscipline, language || 'en');

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
                max_tokens: 300,
                messages: [{ role: 'user', content: prompt }]
            }),
        });

        if (!response.ok) {
            console.error('Anthropic API error:', response.status);
            // Fall back to static
            const fallback = FALLBACK_ENTRIES[normalizedDiscipline] || FALLBACK_ENTRIES['history'];
            return res.status(200).json({
                success: true,
                entry: fallback,
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
        let entry;
        try {
            // Clean up any markdown artifacts
            textContent = textContent.trim();
            if (textContent.startsWith('```')) {
                textContent = textContent.replace(/```json?\n?/g, '').replace(/```/g, '');
            }
            entry = JSON.parse(textContent);
            
            // Validate required fields
            if (!entry.displayValue || !entry.tooltip) {
                throw new Error('Missing required fields');
            }
        } catch (parseError) {
            console.error('Failed to parse microdiscovery JSON:', parseError);
            console.error('Raw response:', textContent);
            // Fall back to static
            const fallback = FALLBACK_ENTRIES[normalizedDiscipline] || FALLBACK_ENTRIES['history'];
            return res.status(200).json({
                success: true,
                entry: fallback,
                source: 'fallback',
                discipline: normalizedDiscipline,
                language: language || 'en'
            });
        }

        return res.status(200).json({
            success: true,
            entry: entry,
            source: 'generated',
            discipline: normalizedDiscipline,
            language: language || 'en',
            usage: data.usage
        });

    } catch (error) {
        console.error('Microdiscovery API error:', error);
        // Fall back to static on any error
        const discipline = req.body?.discipline?.toLowerCase() || 'history';
        const fallback = FALLBACK_ENTRIES[discipline] || FALLBACK_ENTRIES['history'];
        return res.status(200).json({
            success: true,
            entry: fallback,
            source: 'fallback',
            discipline: discipline,
            language: req.body?.language || 'en'
        });
    }
}
