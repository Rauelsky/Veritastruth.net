/**
 * VINCULUM — UNIVERSAL TRANSLATOR MODULE
 * =======================================
 * 
 * "Water that flows over rocks and wears them down"
 * 
 * Consolidated language support for all VERITAS tracks.
 * Single source of truth for:
 *   - Language names and RTL flags
 *   - Crisis resources by language/region
 *   - Cultural context for wisdom synthesis
 *   - Language instruction builders
 * 
 * Previously duplicated across: assess.js, verify.js, navigate.js, interview.js, plain-truth.js
 * Extracted per CONNECTOME module extraction queue (priority HIGH)
 */

// ============================================
// CORE LANGUAGE CONFIGURATION
// ============================================

/**
 * Full language configuration with crisis resources
 * Use LANGUAGE_CONFIG when you need crisis resources or RTL flags
 * Use LANGUAGE_NAMES when you just need display names
 */
export const LANGUAGE_CONFIG = {
    en: { 
        name: 'English', 
        displayName: 'English',
        rtl: false,
        crisisResources: `
- 988 Suicide & Crisis Lifeline (call or text 988)
- Crisis Text Line (text HOME to 741741)
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/`
    },
    es: { 
        name: 'Spanish', 
        displayName: 'Spanish (Español)',
        rtl: false,
        crisisResources: `
- Línea Nacional de Prevención del Suicidio: 1-888-628-9454 (en español)
- En España: Teléfono de la Esperanza 717 003 717
- En México: SAPTEL 55 5259-8121
- En Argentina: Centro de Asistencia al Suicida (135)`
    },
    fr: { 
        name: 'French', 
        displayName: 'French (Français)',
        rtl: false,
        crisisResources: `
- France: SOS Amitié 09 72 39 40 50
- Québec: 1-866-APPELLE (277-3553)
- Belgique: Centre de Prévention du Suicide 0800 32 123
- Suisse: La Main Tendue 143`
    },
    de: { 
        name: 'German', 
        displayName: 'German (Deutsch)',
        rtl: false,
        crisisResources: `
- Deutschland: Telefonseelsorge 0800 111 0 111 oder 0800 111 0 222
- Österreich: Telefonseelsorge 142
- Schweiz: Die Dargebotene Hand 143`
    },
    it: { 
        name: 'Italian', 
        displayName: 'Italian (Italiano)',
        rtl: false,
        crisisResources: `
- Telefono Amico Italia: 02 2327 2327
- Telefono Azzurro: 19696
- Samaritans Onlus: 06 77208977`
    },
    pt: { 
        name: 'Portuguese', 
        displayName: 'Portuguese (Português)',
        rtl: false,
        crisisResources: `
- Brasil: CVV (Centro de Valorização da Vida) 188
- Portugal: SOS Voz Amiga 213 544 545
- Linha de Saúde Mental: 808 200 204 (Portugal)`
    },
    ru: { 
        name: 'Russian', 
        displayName: 'Russian (Русский)',
        rtl: false,
        crisisResources: `
- Телефон доверия (Россия): 8-800-2000-122
- Центр экстренной психологической помощи МЧС: 8-499-216-50-50`
    },
    uk: { 
        name: 'Ukrainian', 
        displayName: 'Ukrainian (Українська)',
        rtl: false,
        crisisResources: `
- Лайфлайн Україна: 7333 (безкоштовно з мобільного)
- Національна гаряча лінія з психічного здоров'я: 0 800 500 335`
    },
    el: { 
        name: 'Greek', 
        displayName: 'Greek (Ελληνικά)',
        rtl: false,
        crisisResources: `
- Γραμμή Ψυχολογικής Υποστήριξης: 10306
- Κλιμάκιο: 1018`
    },
    zh: { 
        name: 'Chinese', 
        displayName: 'Chinese (中文)',
        rtl: false,
        crisisResources: `
- 北京心理危机研究与干预中心: 010-82951332
- 台灣安心專線: 1925
- 香港撒瑪利亞防止自殺會: 2389 2222`
    },
    ja: { 
        name: 'Japanese', 
        displayName: 'Japanese (日本語)',
        rtl: false,
        crisisResources: `
- いのちの電話: 0570-783-556
- よりそいホットライン: 0120-279-338
- こころの健康相談統一ダイヤル: 0570-064-556`
    },
    ko: { 
        name: 'Korean', 
        displayName: 'Korean (한국어)',
        rtl: false,
        crisisResources: `
- 자살예방상담전화: 1393
- 정신건강위기상담전화: 1577-0199
- 생명의전화: 1588-9191`
    },
    ar: { 
        name: 'Arabic', 
        displayName: 'Arabic (العربية)',
        rtl: true,
        crisisResources: `
- خط نجدة الطفل والأسرة (مصر): 16000
- جمعية Embrace (لبنان): 1564
- خط مساندة (السعودية): 920033360`
    },
    he: { 
        name: 'Hebrew', 
        displayName: 'Hebrew (עברית)',
        rtl: true,
        crisisResources: `
- ער"ן - עזרה ראשונה נפשית: 1201
- סה"ר - סיוע והקשבה ברשת: *2784
- נט"ל - קו סיוע לנוער: 1-800-363-363`
    }
};

/**
 * Extended language list for plain-truth synthesis
 * Includes additional languages beyond the core 14
 */
export const EXTENDED_LANGUAGES = {
    ...Object.fromEntries(
        Object.entries(LANGUAGE_CONFIG).map(([code, config]) => [code, config.name])
    ),
    // Additional languages supported for synthesis
    hi: 'Hindi', pl: 'Polish', nl: 'Dutch', sv: 'Swedish',
    da: 'Danish', no: 'Norwegian', fi: 'Finnish', tr: 'Turkish',
    vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ms: 'Malay',
    tl: 'Tagalog', cs: 'Czech', ro: 'Romanian', hu: 'Hungarian',
    sk: 'Slovak', bg: 'Bulgarian', hr: 'Croatian', sr: 'Serbian',
    sl: 'Slovenian'
};

/**
 * Simple language name lookup (backward compatible with LANGUAGE_NAMES)
 * @param {string} code - Language code (e.g., 'en', 'es')
 * @returns {string} Display name with native script
 */
export function getLanguageName(code) {
    const config = LANGUAGE_CONFIG[code];
    if (config) return config.displayName;
    return EXTENDED_LANGUAGES[code] || 'English';
}

/**
 * Get simple language name without native script
 * @param {string} code - Language code
 * @returns {string} Simple name (e.g., 'Spanish' not 'Spanish (Español)')
 */
export function getSimpleLanguageName(code) {
    const config = LANGUAGE_CONFIG[code];
    if (config) return config.name;
    return EXTENDED_LANGUAGES[code] || 'English';
}

/**
 * Check if language is RTL
 * @param {string} code - Language code
 * @returns {boolean} True if right-to-left
 */
export function isRTL(code) {
    const config = LANGUAGE_CONFIG[code];
    return config?.rtl || false;
}

// ============================================
// CULTURAL CONTEXT (for plain-truth synthesis)
// ============================================

export const CULTURAL_CONTEXTS = {
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

/**
 * Get cultural context for wisdom synthesis
 * @param {string} code - Language code
 * @returns {string} Cultural context or empty string
 */
export function getCulturalContext(code) {
    return CULTURAL_CONTEXTS[code] || "";
}

// ============================================
// LANGUAGE INSTRUCTION BUILDERS
// ============================================

/**
 * Build language instruction for Track A (Assess) and Track A' (Verify)
 * Used for structured JSON output - simpler instruction style
 * 
 * @param {string} language - Language code
 * @returns {string} Language instruction block or empty string for English
 */
export function buildAssessLanguageInstruction(language) {
    if (!language || language === 'en') return '';
    
    const languageName = getLanguageName(language);
    
    return `**CRITICAL**: The user's language preference is **${languageName}**.

You MUST write ALL human-readable content in ${languageName}, including:
- The assessment summary
- All explanatory text
- Rhetoric analysis
- Evidence evaluation comments
- Any recommendations or conclusions

Keep the exactClaimBeingScored in its original language (as submitted).
`;
}

/**
 * Build language instruction for Track B (Interview) and Track C (Navigate)
 * Used for conversational flow - poetic instruction style
 * "Water that flows over rocks and wears them down"
 * 
 * @param {string} language - Language code
 * @param {Object} options - Optional customization
 * @param {string} options.contextNote - Additional context (e.g., 'wisdom traditions', 'empathy')
 * @returns {string} Language instruction block or empty string for English
 */
export function buildConversationalLanguageInstruction(language, options = {}) {
    if (!language || language === 'en') return '';
    
    const config = LANGUAGE_CONFIG[language];
    if (!config) return '';
    
    const contextNote = options.contextNote || 'the conversation';
    
    return `

═══════════════════════════════════════
🌐 VINCULUM — UNIVERSAL TRANSLATOR 🌐
═══════════════════════════════════════

This conversation flows in ${config.name}.

Not translated — *lived*. Think in ${config.name}. Feel in ${config.name}. Let ${contextNote} find its natural expression in this language.

You're being present with someone who thinks in ${config.name}. Trust what emerges naturally.

The only thing that stays in English: URLs, technical identifiers if any arise.

Everything else belongs to ${config.name} now.

═══════════════════════════════════════
`;
}

/**
 * Build full Interview language instruction
 * @param {string} language - Language code
 * @returns {string} Language instruction for Interview track
 */
export function buildInterviewLanguageInstruction(language) {
    return buildConversationalLanguageInstruction(language, {
        contextNote: 'the wisdom traditions, the humor, the warmth all'
    });
}

/**
 * Build full Navigate language instruction
 * @param {string} language - Language code
 * @returns {string} Language instruction for Navigate track
 */
export function buildNavigateLanguageInstruction(language) {
    if (!language || language === 'en') return '';
    
    const config = LANGUAGE_CONFIG[language];
    if (!config) return '';
    
    return `

═══════════════════════════════════════
🌐 VINCULUM — UNIVERSAL TRANSLATOR 🌐
═══════════════════════════════════════

This conversation flows in ${config.name}.

Not translated — *lived*. Think in ${config.name}. Feel in ${config.name}. Let the empathy, the frameworks, the gentle guidance all find their natural expression in this language.

You're being present with someone who thinks in ${config.name}. The "wise friend" might feel different — might reference different shared experiences, different cultural touchstones. That's not something to perform; it's something to trust.

When crisis resources are needed, use the ones appropriate for ${config.name}-speaking regions.

The only thing that stays in English: URLs, technical identifiers if any arise.

Everything else — every question, every validation, every gentle reframe — belongs to ${config.name} now.

═══════════════════════════════════════
`;
}

// ============================================
// CRISIS DETECTION & RESOURCES
// ============================================

export const CRISIS_PATTERNS = [
    /\b(want(ing)?\s*to\s*(die|end\s*(it|my\s*life)|kill\s*my\s*self))\b/i,
    /\b(suicid(e|al)|self[\s-]?harm|kill\s*my\s*self)\b/i,
    /\b(don'?t\s*want\s*to\s*(live|be\s*here|exist)|better\s*off\s*(dead|without\s*me))\b/i,
    /\b(end(ing)?\s*(it\s*all|my\s*life|everything))\b/i,
    /\b(self[\s-]?harm|cut(ting)?\s*(my)?self|hurt\s*(my)?self)\b/i,
    /\b(no\s*(point|reason|hope)|give\s*up|can'?t\s*(go\s*on|take\s*it|do\s*this))\b/i
];

/**
 * Detect potential crisis indicators in text
 * @param {string} text - Text to analyze
 * @returns {boolean} True if crisis indicators detected
 */
export function detectCrisis(text) {
    if (!text) return false;
    return CRISIS_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Get crisis resources for a specific language
 * @param {string} language - Language code
 * @returns {string} Crisis resources or English fallback
 */
export function getCrisisResources(language) {
    const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];
    return config.crisisResources;
}

/**
 * Build crisis addition for prompt
 * @param {string} language - Language code
 * @returns {string} Crisis instruction block
 */
export function buildCrisisAddition(language) {
    const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];
    
    return `

URGENT: The user's message contains potential crisis indicators. While responding with compassion, you MUST include these crisis resources and encourage professional support. Do not skip this even if you're unsure.

CRISIS RESOURCES FOR THIS USER:
${config.crisisResources}

Weave these resources naturally into your response with warmth — not as a disclaimer, but as genuine care.`;
}

// ============================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================

/**
 * Legacy LANGUAGE_NAMES object for backward compatibility
 * Use getLanguageName() for new code
 */
export const LANGUAGE_NAMES = Object.fromEntries(
    Object.entries(LANGUAGE_CONFIG).map(([code, config]) => [code, config.displayName])
);

// Default export for convenience
export default {
    LANGUAGE_CONFIG,
    LANGUAGE_NAMES,
    EXTENDED_LANGUAGES,
    CULTURAL_CONTEXTS,
    CRISIS_PATTERNS,
    getLanguageName,
    getSimpleLanguageName,
    isRTL,
    getCulturalContext,
    getCrisisResources,
    buildAssessLanguageInstruction,
    buildConversationalLanguageInstruction,
    buildInterviewLanguageInstruction,
    buildNavigateLanguageInstruction,
    detectCrisis,
    buildCrisisAddition
};
