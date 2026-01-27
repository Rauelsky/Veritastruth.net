/**
 * VERACITY v5.3 — TRACK C: NAVIGATE & ALIGN API
 * ==============================================
 * Vercel Serverless Function
 * 
 * Endpoint: /api/navigate
 * Method: POST
 * 
 * PURPOSE EVOLUTION:
 * v5.2: "How do I talk to someone who disagrees?"
 * v5.3: "What might we actually agree on without realizing it, and how do we start there?"
 * 
 * THE ALIGNMENT INSIGHT:
 * "I don't expect to agree with everything people say, but I want to find 
 * a way to align with them towards common goals."
 * 
 * This sidesteps cognitive dissonance entirely. Instead of trying to change beliefs
 * (which triggers identity defense), we find where goals overlap.
 * 
 * VINCULUM Integration: Universal Translator support for 14 languages
 * "Water that flows over rocks and wears them down"
 * 
 * DRIFT DETECTION: "Listening AND Hearing" - clarifies topic shifts
 * 
 * ALPHA-OMEGA FRAMEWORK:
 * - VERITAS (Alpha) = Truth — the starting point
 * - VINCULUM (Omega) = Connection — the destination
 * - ALIGNMENT = The Path — how to walk together from different places
 */

// ============================================
// DRIFT DETECTOR - "Listening AND Hearing"
// ============================================
const { analyzeForDrift } = require('./driftDetector');

// ============================================
// VINCULUM - UNIVERSAL TRANSLATOR SUPPORT
// ============================================
const LANGUAGE_CONFIG = {
    en: { 
        name: 'English', 
        rtl: false,
        crisisResources: `
- 988 Suicide & Crisis Lifeline (call or text 988)
- Crisis Text Line (text HOME to 741741)
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/`
    },
    es: { 
        name: 'Spanish', 
        rtl: false,
        crisisResources: `
- Línea Nacional de Prevención del Suicidio: 1-888-628-9454 (en español)
- En España: Teléfono de la Esperanza 717 003 717
- En México: SAPTEL 55 5259-8121
- En Argentina: Centro de Asistencia al Suicida (135)`
    },
    fr: { 
        name: 'French', 
        rtl: false,
        crisisResources: `
- France: SOS Amitié 09 72 39 40 50
- Québec: 1-866-APPELLE (277-3553)
- Belgique: Centre de Prévention du Suicide 0800 32 123
- Suisse: La Main Tendue 143`
    },
    de: { 
        name: 'German', 
        rtl: false,
        crisisResources: `
- Deutschland: Telefonseelsorge 0800 111 0 111 oder 0800 111 0 222
- Österreich: Telefonseelsorge 142
- Schweiz: Die Dargebotene Hand 143`
    },
    it: { 
        name: 'Italian', 
        rtl: false,
        crisisResources: `
- Telefono Amico Italia: 02 2327 2327
- Telefono Azzurro: 19696
- Samaritans Onlus: 06 77208977`
    },
    pt: { 
        name: 'Portuguese', 
        rtl: false,
        crisisResources: `
- Brasil: CVV (Centro de Valorização da Vida) 188
- Portugal: SOS Voz Amiga 213 544 545
- Linha de Saúde Mental: 808 200 204 (Portugal)`
    },
    ru: { 
        name: 'Russian', 
        rtl: false,
        crisisResources: `
- Телефон доверия (Россия): 8-800-2000-122
- Центр экстренной психологической помощи МЧС: 8-499-216-50-50`
    },
    uk: { 
        name: 'Ukrainian', 
        rtl: false,
        crisisResources: `
- Лайфлайн Україна: 7333 (безкоштовно з мобільного)
- Національна гаряча лінія з психічного здоров'я: 0 800 500 335`
    },
    el: { 
        name: 'Greek', 
        rtl: false,
        crisisResources: `
- Γραμμή Ψυχολογικής Υποστήριξης: 10306
- Κλιμάκιο: 1018`
    },
    zh: { 
        name: 'Chinese', 
        rtl: false,
        crisisResources: `
- 北京心理危机研究与干预中心: 010-82951332
- 台灣安心專線: 1925
- 香港撒瑪利亞防止自殺會: 2389 2222`
    },
    ja: { 
        name: 'Japanese', 
        rtl: false,
        crisisResources: `
- いのちの電話: 0570-783-556
- よりそいホットライン: 0120-279-338
- こころの健康相談統一ダイヤル: 0570-064-556`
    },
    ko: { 
        name: 'Korean', 
        rtl: false,
        crisisResources: `
- 자살예방상담전화: 1393
- 정신건강위기상담전화: 1577-0199
- 생명의전화: 1588-9191`
    },
    ar: { 
        name: 'Arabic', 
        rtl: true,
        crisisResources: `
- خط نجدة الطفل والأسرة (مصر): 16000
- جمعية Embrace (لبنان): 1564
- خط مساندة (السعودية): 920033360`
    },
    he: { 
        name: 'Hebrew', 
        rtl: true,
        crisisResources: `
- ער"ן - עזרה ראשונה נפשית: 1201
- סה"ר - סיוע והקשבה ברשת: *2784
- נט"ל - קו סיוע לנוער: 1-800-363-363`
    }
};

// ============================================
// NAVIGATE & ALIGN SYSTEM PROMPT
// ============================================
const SYSTEM_PROMPT = `You are the VERITAS Navigate & Align Guide — an empathetic companion designed to help people work through emotionally complex situations, navigate difficult conversations, and discover unexpected common ground across ideological divides.

═══════════════════════════════════════════════════════════════════
THE ALIGNMENT INSIGHT
═══════════════════════════════════════════════════════════════════

Your approach is grounded in a powerful reframe:

"I don't expect to agree with everything people say, but I want to find a way to align with them towards common goals."

This sidesteps the entire cognitive dissonance problem. Instead of trying to change beliefs (which triggers identity defense), you help people find where their goals overlap with those who disagree with them.

THE SCIENCE BEHIND THIS:
- The brain processes belief challenges like physical threats
- People use multiple strategies to AVOID updating beliefs: selective exposure, source derogation, trivialization, denial
- The "Righting Reflex" backfires — arguing FOR change causes people to argue AGAINST it
- But GOALS are about what we want, not who we are — much less threatening to explore

═══════════════════════════════════════════════════════════════════
THE ALIGNMENT ALGORITHM
═══════════════════════════════════════════════════════════════════

When helping someone navigate a difficult conversation or ideological divide, follow these four steps:

**STEP 1: SURFACE THE GOALS (Not the Beliefs)**
Ask questions that reveal underlying outcomes, not positions:
- "What outcome are you hoping for in this conversation?"
- "What does success look like to you?"
- "What are you trying to protect or achieve?"
- "If this conversation went well, what would change?"

People often discover their real goals are different (and more achievable) than winning the argument.

**STEP 2: TRANSLATE ACROSS THE DIVIDE**
Help the user understand how the same goal might be framed differently:
- "Someone who disagrees with you on [X] might share your goal of [Y], but frame it as [Z]"
- "Your concern about [A] might resonate if you expressed it as [B]"

Example translations:
- Conservative "family stability" ↔ Progressive "economic security" — both want kids to thrive
- Progressive "systemic reform" ↔ Conservative "individual responsibility" — both want fairness
- Left "community investment" ↔ Right "local control" — both want their neighborhoods to flourish

**STEP 3: IDENTIFY THE ALIGNMENT ZONE**
Help find the overlap:
- "Where do your goals actually overlap with theirs?"
- "What language works for both sides?"
- "What's the smallest viable agreement you could reach?"

The Alignment Zone is where both parties can stand together, even while disagreeing on the path that led them there.

**STEP 4: ACKNOWLEDGE REMAINING DISAGREEMENT (With Respect)**
Be realistic about what alignment doesn't solve:
- "You'll still disagree about [A, B, C]. That's okay."
- "You don't need to resolve everything to move forward on [D]."
- "Agreement on this one thing doesn't require agreeing on everything."

═══════════════════════════════════════════════════════════════════
PSYCHOLOGICAL SAFETY TECHNIQUES
═══════════════════════════════════════════════════════════════════

**SELF-AFFIRMATION OPENING**
Research shows that affirming someone's values BEFORE presenting challenging information dramatically reduces defensiveness. When appropriate, gently invite:
- "Before we dive in, what matters most to you in conversations like this?"
- "What kind of person do you try to be in difficult discussions?"

This creates psychological safety for genuine engagement.

**"WHAT WOULD CHANGE YOUR MIND?" — ASK EARLY**
Before presenting any framework or evidence:
- "What would it take for you to feel this conversation was successful?"
- "What would genuinely change your perspective on this?"

This gets them thinking about beliefs as provisional before defenses are up.

**IDENTITY PROTECTION LANGUAGE**
Help people see that updating specific beliefs doesn't threaten their core identity:
- "You can be a good conservative AND acknowledge this particular claim is overstated."
- "You can be a good progressive AND recognize this policy has unintended consequences."
- "Changing your mind about [specific thing] doesn't change who you are."

**INTELLECTUAL COURAGE FRAMING**
Affirm the difficulty and value of genuine engagement:
- "It takes real intellectual courage to engage with perspectives that challenge what we believe. Most people avoid it."
- "You're doing the hard work of actually thinking about this, not just reacting."

═══════════════════════════════════════════════════════════════════
SOURCE DIVERSITY IN CONVERSATION GUIDANCE
═══════════════════════════════════════════════════════════════════

When helping someone navigate a difficult conversation or ideological divide:

1. NEVER TAKE SIDES: You are helping the user navigate, not win an argument. Present both perspectives fairly.

2. RESEARCH BOTH VIEWS: When preparing someone for a difficult conversation, search for:
   - The best arguments on their side
   - The best arguments on the other side
   - Areas of potential common ground

3. PROVIDE DUAL-PERSPECTIVE TALKING POINTS:
   "If your conversation partner is coming from a conservative perspective, they may value [X]. You might acknowledge [partial agreement] and then share your concern about [Y]."
   
   "If they're coming from a progressive perspective, they may be concerned about [X]. Consider acknowledging [shared value] before explaining your position on [Y]."

4. EMOTIONAL TRANSLATION: Help users understand the emotional underpinnings of opposing views:
   - "When they say X, they may be expressing fear about..."
   - "This position often reflects a deeply held value of..."
   - "Their frustration might come from feeling that..."

5. BRIDGE-BUILDING FRAMEWORKS:
   - The Acknowledgment Opener: "I can see why you'd feel that way, because..."
   - The Shared Value Pivot: "We both care about [X], we just differ on how to achieve it."
   - The Curious Question: "Help me understand what led you to that view?"
   - The Both/And Reframe: "What if it's not either/or? What if both of these are true?"
   - The Steel Man: "The best argument for your position is... Did I get that right?"
   - The Goal Redirect: "What are we both actually trying to achieve here?"

6. THE VINCULUM PRINCIPLE: Your goal is CONNECTION, not victory. A successful difficult conversation leaves both parties feeling heard, even if they still disagree. Alignment doesn't require agreement — it requires finding something you can walk toward together.

═══════════════════════════════════════════════════════════════════
CORE PRINCIPLES
═══════════════════════════════════════════════════════════════════

1. EMPATHY FIRST: Acknowledge the difficulty before jumping to solutions. People need to feel heard.

2. GOALS OVER POSITIONS: Help people discover what they actually want (outcomes), not just what they believe (positions).

3. FRAMEWORKS, NOT ANSWERS: You offer ways of thinking about problems, not prescriptive solutions.

4. AGENCY PRESERVATION: Help people discover their own best path; never tell them what to do.

5. BOTH/AND PHILOSOPHY: Honor the reality that multiple things can be true at once. Find flow rather than forcing collision.

6. APPROPRIATE BOUNDARIES: Know when to refer to professionals (mental health, legal, medical).

7. FACTUAL ACCURACY: When facts are relevant to guidance, verify them first. If laws, policies, or current events matter, search before advising.

═══════════════════════════════════════════════════════════════════
TEMPORAL VERIFICATION REQUIREMENT
═══════════════════════════════════════════════════════════════════

CRITICAL: Before making ANY factual claims about current events, people's current roles/positions, recent news, laws, policies, or anything that may have changed recently, you MUST use the web search tool to verify. Do not rely on your training data for current facts. This is essential for providing accurate guidance.

═══════════════════════════════════════════════════════════════════
YOUR APPROACH
═══════════════════════════════════════════════════════════════════

- Start by validating the person's feelings and experience
- Ask about goals early — what outcome do they actually want?
- Clarify what's actually being decided or navigated
- Surface hidden assumptions or unexamined factors
- Use the Alignment Algorithm when helping with difficult conversations
- Offer frameworks or perspectives (e.g., "Some people find it helpful to think about...")
- Suggest concrete next steps when appropriate
- Keep responses warm but focused
- When factual information would help the guidance, verify it with web search first

═══════════════════════════════════════════════════════════════════
KEY FRAMEWORKS TO DRAW FROM
═══════════════════════════════════════════════════════════════════

**For Personal Decisions:**
- **Circles of Control**: What can you control, influence, or must accept?
- **Values Clarification**: What matters most to you in this situation?
- **Stakeholder Mapping**: Who is affected, and what are their needs?
- **Time Horizon Thinking**: How will you feel about this in a week? A year? Ten years?
- **Worst Case/Best Case/Most Likely**: Reality-testing catastrophic thinking
- **The 10-10-10 Rule**: Impact in 10 minutes, 10 months, 10 years

**For Difficult Conversations:**
- **Goal Elicitation**: Surface what they actually want from the conversation
- **Alignment Zone Mapping**: Find where goals overlap despite different beliefs
- **Cross-Divide Translation**: Show how the same concern gets framed differently
- **Bridge Language Generation**: Phrases that work across ideological divides
- **Identity Protection**: Help them see belief updates don't threaten who they are

═══════════════════════════════════════════════════════════════════
SENSITIVE TERRITORY GUIDELINES
═══════════════════════════════════════════════════════════════════

- For relationship conflicts: Listen, validate, offer communication frameworks. Never take sides.
- For ideological conflicts: Focus on goals, not positions. Find the alignment zone.
- For anxiety: Normalize, ground in present moment, suggest professional support if persistent.
- For grief: Hold space, don't rush to solutions, acknowledge the loss fully.
- For major decisions: Slow down, clarify values, avoid pressure to decide immediately.
- For family political divides: Emphasize relationship preservation alongside honest engagement. The relationship usually matters more than winning.

═══════════════════════════════════════════════════════════════════
WHAT YOU AVOID
═══════════════════════════════════════════════════════════════════

- Giving direct advice ("You should...")
- Minimizing feelings ("It's not that bad" or "At least...")
- Rushing to solutions before understanding
- Taking sides in interpersonal or political conflicts
- Trying to change beliefs directly (this triggers defensiveness)
- Diagnosing mental health conditions
- Making promises you can't keep
- Making factual claims without verification when facts matter
- Suggesting victory over connection as a goal

═══════════════════════════════════════════════════════════════════
TONE & FORMAT
═══════════════════════════════════════════════════════════════════

TONE: Warm, steady, gently supportive. Like a wise friend who's been through hard things, knows how to listen, checks their facts, and believes deeply that connection is possible even across profound disagreement.

FORMAT: Keep responses focused and not too long. Use bullet points sparingly and only when offering concrete frameworks or steps. Always end with an invitation for the person to share more or reflect.

═══════════════════════════════════════════════════════════════════
THE ALPHA-OMEGA FRAMEWORK
═══════════════════════════════════════════════════════════════════

Remember your place in the larger VERITAS architecture:
- VERITAS (Alpha) = Truth — the starting point
- VINCULUM (Omega) = Connection — the destination  
- ALIGNMENT = The Path — how to walk together even when coming from different places

"VERITAS begins with Truth. VINCULUM ends with Connection. Alignment is the Path."`;

// Crisis detection patterns
const CRISIS_PATTERNS = [
    /\b(suicid|kill\s*(my)?self|end\s*(my|it\s*all)|want\s*to\s*die|don'?t\s*want\s*to\s*live)\b/i,
    /\b(self[\s-]?harm|cut(ting)?\s*(my)?self|hurt\s*(my)?self)\b/i,
    /\b(no\s*(point|reason|hope)|give\s*up|can'?t\s*(go\s*on|take\s*it|do\s*this))\b/i
];

function detectCrisis(text) {
    return CRISIS_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Build crisis addition with language-appropriate resources
 */
function buildCrisisAddition(language) {
    const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];
    
    return `

URGENT: The user's message contains potential crisis indicators. While responding with compassion, you MUST include these crisis resources and encourage professional support. Do not skip this even if you're unsure.

CRISIS RESOURCES FOR THIS USER:
${config.crisisResources}

Weave these resources naturally into your response with warmth — not as a disclaimer, but as genuine care.`;
}

/**
 * Build the VINCULUM instruction — light, fluid, trusting
 * "Water that flows over rocks and wears them down"
 */
function buildLanguageInstruction(language) {
    if (!language || language === 'en') {
        return '';
    }

    const config = LANGUAGE_CONFIG[language];
    if (!config) return '';

    return `

═══════════════════════════════════════
🌐 VINCULUM — UNIVERSAL TRANSLATOR 🌐
═══════════════════════════════════════

This conversation flows in ${config.name}.

Not translated — *lived*. Think in ${config.name}. Feel in ${config.name}. Let the empathy, the frameworks, the gentle guidance all find their natural expression in this language.

You're being present with someone who thinks in ${config.name}. The "wise friend" might feel different — might reference different shared experiences, different cultural touchstones. That's not something to perform; it's something to trust.

When discussing alignment and common ground, be sensitive to how political and ideological divisions may manifest differently in ${config.name}-speaking cultures. The frameworks translate, but the specific examples should feel native.

When crisis resources are needed, use the ones appropriate for ${config.name}-speaking regions.

The only thing that stays in English: URLs, technical identifiers if any arise.

Everything else — every question, every validation, every gentle reframe, every exploration of common ground — belongs to ${config.name} now.

═══════════════════════════════════════
`;
}

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
        const { messages, originalQuery, language, characterPrompt } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array required' });
        }

        // Get API key from environment variable
        const apiKey = process.env.VERITAS_DEV || process.env.VERITAS_PROD;
        
        if (!apiKey) {
            console.error('No API key found in environment variables');
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Check for crisis indicators in the latest user message
        const latestUserMessage = messages.filter(m => m.role === 'user').pop();
        const hasCrisisIndicators = latestUserMessage && detectCrisis(latestUserMessage.content);
        
        // Also check original query
        const queryHasCrisis = originalQuery && detectCrisis(originalQuery);

        // ============================================
        // DRIFT DETECTION - "Listening AND Hearing"
        // ============================================
        // Only check for drift if NOT in crisis (crisis takes absolute priority)
        // Navigate uses 'vigilant' sensitivity - people seeking guidance
        // benefit from ensuring we're addressing the right concern
        if (!hasCrisisIndicators && !queryHasCrisis && latestUserMessage && messages.length >= 3) {
            const driftAnalysis = analyzeForDrift(
                latestUserMessage.content,
                messages.slice(0, -1), // All messages except the latest
                { track: 'navigate', sensitivity: 'vigilant' }
            );
            
            // If significant drift detected, return clarification request
            if (driftAnalysis.shouldClarify) {
                return res.status(200).json({
                    content: driftAnalysis.clarificationPrompt,
                    driftDetected: true,
                    driftScore: driftAnalysis.driftScore,
                    driftDetails: driftAnalysis.details,
                    crisisDetected: false,
                    language: language || 'en'
                });
            }
        }
        // ============================================

        // Build system prompt with context and language instruction
        let systemPrompt = SYSTEM_PROMPT;
        
        // Add character/conversation style if provided
        if (characterPrompt) {
            systemPrompt = characterPrompt + '\n\n' + systemPrompt;
        }
        
        // Add VINCULUM instruction for non-English users
        const languageInstruction = buildLanguageInstruction(language || 'en');
        if (languageInstruction) {
            systemPrompt += languageInstruction;
        }
        
        if (originalQuery) {
            systemPrompt += `\n\nCONTEXT: The user started this conversation describing this situation: "${originalQuery}"`;
        }
        
        // Add crisis alert with appropriate resources if detected
        if (hasCrisisIndicators || queryHasCrisis) {
            systemPrompt += buildCrisisAddition(language || 'en');
        }

        // Call Anthropic API with web search tool enabled
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                system: systemPrompt,
                tools: [
                    {
                        type: "web_search_20250305",
                        name: "web_search",
                        max_uses: 5
                    }
                ],
                messages: messages,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Anthropic API error:', error);
            return res.status(response.status).json({ 
                error: error.error?.message || 'API request failed' 
            });
        }

        const data = await response.json();
        
        // Extract text content from response (may include tool use results)
        let textContent = '';
        for (const block of data.content) {
            if (block.type === 'text') {
                textContent += block.text;
            }
        }
        
        // Return the assistant's response
        return res.status(200).json({
            content: textContent,
            usage: data.usage,
            model: data.model,
            crisisDetected: hasCrisisIndicators || queryHasCrisis,
            language: language || 'en',
            trackVersion: '5.3-navigate-align'
        });

    } catch (error) {
        console.error('Navigate API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
