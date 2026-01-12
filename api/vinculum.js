/**
 * VINCULUM v1.0 — Dynamic Translation Bridge
 * ==========================================
 * "That which binds together"
 * 
 * 6,000 years of wisdom in your mother tongue — delivered in real-time.
 * 
 * PURPOSE:
 * Provides a universal translation layer for all VERITAS modules.
 * Every user deserves to engage with truth in the language of their heart.
 * 
 * PHILOSOPHY:
 * - Input arrives in ANY of 14 supported languages
 * - Core logic operates in English (the "lingua franca" of the codebase)
 * - Output returns in the user's chosen language
 * - Every translation honors cultural context and nuance
 * 
 * ARCHITECTURE:
 * ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
 * │ User Input  │───▶│  VINCULUM   │───▶│ English for │
 * │ (Any Lang)  │    │  Translate  │    │ Processing  │
 * └─────────────┘    └─────────────┘    └─────────────┘
 *                           │
 *                           ▼
 * ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
 * │ User Sees   │◀───│  VINCULUM   │◀───│  English    │
 * │ (Their Lang)│    │  Translate  │    │  Output     │
 * └─────────────┘    └─────────────┘    └─────────────┘
 * 
 * SUPPORTED LANGUAGES (14):
 * en (English), es (Spanish), fr (French), de (German), it (Italian),
 * pt (Portuguese), ru (Russian), uk (Ukrainian), el (Greek),
 * zh (Chinese), ja (Japanese), ko (Korean),
 * ar (Arabic - RTL), he (Hebrew - RTL)
 * 
 * USAGE:
 * // Wrap any function that processes user input and returns output
 * const result = await Vinculum.process(userInput, async (englishInput) => {
 *     // Your logic here operates in English
 *     return englishOutput;
 * });
 * // Result is in user's language
 * 
 * // Or translate individual strings
 * const translated = await Vinculum.toUserLanguage(englishText);
 * const english = await Vinculum.toEnglish(userText);
 * 
 * DEPENDENCIES: 
 * - veritas-translations.js (for getCurrentLanguage, static fallbacks)
 * - /api/claude endpoint (for dynamic translation)
 * 
 * VERITAS LLC — Prairie du Sac, Wisconsin
 * https://veritastruth.net
 * 
 * 🖖 Infinite Diversity in Infinite Combinations
 * 
 * Last Updated: January 11, 2026
 */

const Vinculum = (function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    
    const config = {
        // API endpoint for Claude translation
        apiEndpoint: '/api/claude',
        
        // Supported languages with native names
        languages: {
            en: { name: 'English', native: 'English', rtl: false },
            es: { name: 'Spanish', native: 'Español', rtl: false },
            fr: { name: 'French', native: 'Français', rtl: false },
            de: { name: 'German', native: 'Deutsch', rtl: false },
            it: { name: 'Italian', native: 'Italiano', rtl: false },
            pt: { name: 'Portuguese', native: 'Português', rtl: false },
            ru: { name: 'Russian', native: 'Русский', rtl: false },
            uk: { name: 'Ukrainian', native: 'Українська', rtl: false },
            el: { name: 'Greek', native: 'Ελληνικά', rtl: false },
            zh: { name: 'Chinese', native: '中文', rtl: false },
            ja: { name: 'Japanese', native: '日本語', rtl: false },
            ko: { name: 'Korean', native: '한국어', rtl: false },
            ar: { name: 'Arabic', native: 'العربية', rtl: true },
            he: { name: 'Hebrew', native: 'עברית', rtl: true }
        },
        
        // Cache settings
        cacheEnabled: true,
        cacheTTL: 3600000, // 1 hour in milliseconds
        
        // Translation model settings
        model: 'claude-sonnet-4-20250514',
        maxTokens: 1024,
        temperature: 0.3 // Lower temperature for more consistent translations
    };

    // ==================== TRANSLATION CACHE ====================
    
    // Simple in-memory cache to avoid redundant API calls
    // Key format: `${fromLang}:${toLang}:${hash(text)}`
    const cache = new Map();
    
    /**
     * Simple string hash for cache keys
     */
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }
    
    /**
     * Get from cache if valid
     */
    function getFromCache(fromLang, toLang, text) {
        if (!config.cacheEnabled) return null;
        
        const key = `${fromLang}:${toLang}:${hashString(text)}`;
        const cached = cache.get(key);
        
        if (cached && (Date.now() - cached.timestamp < config.cacheTTL)) {
            console.log(`🌐 VINCULUM: Cache hit for ${fromLang}→${toLang}`);
            return cached.translation;
        }
        
        return null;
    }
    
    /**
     * Store in cache
     */
    function storeInCache(fromLang, toLang, text, translation) {
        if (!config.cacheEnabled) return;
        
        const key = `${fromLang}:${toLang}:${hashString(text)}`;
        cache.set(key, {
            translation,
            timestamp: Date.now()
        });
        
        // Limit cache size (LRU-style cleanup)
        if (cache.size > 500) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
        }
    }

    // ==================== LANGUAGE DETECTION ====================
    
    /**
     * Get current user language from localStorage or default to English
     */
    function getCurrentLanguage() {
        // Try to use the global function if available
        if (typeof window !== 'undefined' && window.getCurrentLanguage) {
            return window.getCurrentLanguage();
        }
        // Fallback to localStorage
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem('veritasLanguage') || 'en';
        }
        return 'en';
    }
    
    /**
     * Check if a language code is valid
     */
    function isValidLanguage(langCode) {
        return config.languages.hasOwnProperty(langCode);
    }
    
    /**
     * Check if language is RTL
     */
    function isRTL(langCode) {
        return config.languages[langCode]?.rtl || false;
    }
    
    /**
     * Get language info
     */
    function getLanguageInfo(langCode) {
        return config.languages[langCode] || config.languages['en'];
    }

    // ==================== CORE TRANSLATION ====================
    
    /**
     * Translate text from one language to another via Claude API
     * @param {string} text - Text to translate
     * @param {string} fromLang - Source language code
     * @param {string} toLang - Target language code
     * @param {object} options - Additional options
     * @returns {Promise<string>} Translated text
     */
    async function translate(text, fromLang, toLang, options = {}) {
        // No translation needed if same language
        if (fromLang === toLang) {
            return text;
        }
        
        // No translation needed if empty
        if (!text || text.trim() === '') {
            return text;
        }
        
        // Check cache first
        const cached = getFromCache(fromLang, toLang, text);
        if (cached) {
            return cached;
        }
        
        const fromInfo = getLanguageInfo(fromLang);
        const toInfo = getLanguageInfo(toLang);
        
        // Build translation prompt
        const prompt = buildTranslationPrompt(text, fromInfo, toInfo, options);
        
        try {
            const response = await fetch(config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: config.model,
                    max_tokens: config.maxTokens,
                    temperature: config.temperature
                })
            });
            
            if (!response.ok) {
                console.warn(`🌐 VINCULUM: API error ${response.status}, falling back to original`);
                return text;
            }
            
            const data = await response.json();
            
            // Handle fallback flag from API
            if (data.fallback) {
                console.warn('🌐 VINCULUM: API unavailable, using original text');
                return text;
            }
            
            // Extract translation from response
            const translation = extractTranslation(data);
            
            // Cache the result
            storeInCache(fromLang, toLang, text, translation);
            
            console.log(`🌐 VINCULUM: ${fromLang}→${toLang} complete`);
            return translation;
            
        } catch (error) {
            console.error('🌐 VINCULUM: Translation error:', error);
            return text; // Graceful fallback to original
        }
    }
    
    /**
     * Build the translation prompt for Claude
     */
    function buildTranslationPrompt(text, fromInfo, toInfo, options = {}) {
        const { context = '', preserveFormatting = true, tone = 'natural' } = options;
        
        let prompt = `You are VINCULUM, a translation system for VERITAS — a platform dedicated to truth and understanding across cultures.

Translate the following text from ${fromInfo.name} to ${toInfo.name} (${toInfo.native}).

GUIDELINES:
- Preserve the original meaning with complete fidelity
- Use natural, fluent ${toInfo.name} that a native speaker would use
- Maintain the same tone and register as the original
- Preserve any technical terms appropriately for the target culture
- Keep any proper nouns, brand names (VERITAS, VINCULUM), and technical terms intact
- If the text contains formatting (bullets, numbers), preserve it
- Do not add explanations or notes — return ONLY the translation
- Honor the cultural context and nuances of ${toInfo.name}`;

        if (context) {
            prompt += `\n\nCONTEXT: This text is from ${context}`;
        }
        
        if (toInfo.rtl) {
            prompt += `\n\nNOTE: ${toInfo.name} is written right-to-left. Ensure proper RTL text structure.`;
        }

        prompt += `\n\nTEXT TO TRANSLATE:\n${text}\n\nTRANSLATION:`;
        
        return prompt;
    }
    
    /**
     * Extract translation from Claude API response
     */
    function extractTranslation(data) {
        if (data.content && Array.isArray(data.content)) {
            // Standard Anthropic response format
            const textBlock = data.content.find(block => block.type === 'text');
            return textBlock ? textBlock.text.trim() : '';
        }
        if (data.content && typeof data.content === 'string') {
            return data.content.trim();
        }
        if (data.text) {
            return data.text.trim();
        }
        return '';
    }

    // ==================== CONVENIENCE METHODS ====================
    
    /**
     * Translate text TO the user's current language (from English)
     * Use this for all output displayed to the user
     * @param {string} englishText - English text to translate
     * @param {object} options - Translation options
     * @returns {Promise<string>} Text in user's language
     */
    async function toUserLanguage(englishText, options = {}) {
        const userLang = getCurrentLanguage();
        return translate(englishText, 'en', userLang, options);
    }
    
    /**
     * Translate text FROM the user's language to English
     * Use this for processing user input
     * @param {string} userText - Text in user's language
     * @param {object} options - Translation options
     * @returns {Promise<string>} English text for processing
     */
    async function toEnglish(userText, options = {}) {
        const userLang = getCurrentLanguage();
        return translate(userText, userLang, 'en', options);
    }
    
    /**
     * Process user input through English logic and return localized output
     * The main integration point for other modules
     * 
     * @param {string} userInput - Input in user's language
     * @param {Function} processingFn - Async function that processes English input and returns English output
     * @param {object} options - Options for translation
     * @returns {Promise<any>} Result with output in user's language
     * 
     * @example
     * const result = await Vinculum.process(userQuery, async (englishQuery) => {
     *     const classification = VeracityClassifier.classifyIntent(englishQuery);
     *     return classification.empathyMessage;
     * });
     */
    async function process(userInput, processingFn, options = {}) {
        const userLang = getCurrentLanguage();
        
        // If user is English, skip translation overhead
        if (userLang === 'en') {
            return processingFn(userInput);
        }
        
        // Translate input to English for processing
        const englishInput = await toEnglish(userInput, options);
        
        // Run the core logic in English
        const englishOutput = await processingFn(englishInput);
        
        // If output is a string, translate it back
        if (typeof englishOutput === 'string') {
            return toUserLanguage(englishOutput, options);
        }
        
        // If output is an object, translate string properties
        if (typeof englishOutput === 'object' && englishOutput !== null) {
            return translateObject(englishOutput, 'en', userLang, options);
        }
        
        return englishOutput;
    }
    
    /**
     * Translate string properties of an object
     * Preserves structure, translates string values
     */
    async function translateObject(obj, fromLang, toLang, options = {}) {
        if (fromLang === toLang) return obj;
        if (!obj || typeof obj !== 'object') return obj;
        
        // Handle arrays
        if (Array.isArray(obj)) {
            return Promise.all(obj.map(item => translateObject(item, fromLang, toLang, options)));
        }
        
        // Handle objects
        const result = {};
        const entries = Object.entries(obj);
        
        for (const [key, value] of entries) {
            if (typeof value === 'string' && value.trim() !== '') {
                // Translate string values
                result[key] = await translate(value, fromLang, toLang, options);
            } else if (typeof value === 'object' && value !== null) {
                // Recurse into nested objects
                result[key] = await translateObject(value, fromLang, toLang, options);
            } else {
                // Preserve non-string values
                result[key] = value;
            }
        }
        
        return result;
    }

    // ==================== BATCH TRANSLATION ====================
    
    /**
     * Translate multiple strings efficiently
     * Batches requests to reduce API calls
     * @param {string[]} texts - Array of texts to translate
     * @param {string} fromLang - Source language
     * @param {string} toLang - Target language
     * @returns {Promise<string[]>} Array of translated texts
     */
    async function translateBatch(texts, fromLang, toLang, options = {}) {
        if (fromLang === toLang) return texts;
        if (!texts || texts.length === 0) return [];
        
        // For small batches, translate individually (better caching)
        if (texts.length <= 3) {
            return Promise.all(texts.map(t => translate(t, fromLang, toLang, options)));
        }
        
        // For larger batches, combine into single request
        const separator = '\n---VINCULUM_SEPARATOR---\n';
        const combined = texts.join(separator);
        
        const translatedCombined = await translate(combined, fromLang, toLang, {
            ...options,
            context: 'a batch of separate text items, each separated by ---VINCULUM_SEPARATOR---'
        });
        
        return translatedCombined.split(separator).map(t => t.trim());
    }

    // ==================== EDUCATIONAL CONTENT TRANSLATION ====================
    
    /**
     * Translate a factoid object
     * Preserves structure, translates text and source
     */
    async function translateFactoid(factoid, toLang) {
        if (toLang === 'en') return factoid;
        
        return {
            ...factoid,
            text: await translate(factoid.text, 'en', toLang, { context: 'an educational factoid' }),
            source: factoid.source ? await translate(factoid.source, 'en', toLang, { context: 'a source citation' }) : factoid.source
        };
    }
    
    /**
     * Translate a bias entry from the bias guide
     */
    async function translateBiasEntry(bias, toLang) {
        if (toLang === 'en') return bias;
        
        const [definition, example, howToSpot, howToAvoid] = await Promise.all([
            translate(bias.definition, 'en', toLang, { context: 'a cognitive bias definition' }),
            translate(bias.example, 'en', toLang, { context: 'an example of cognitive bias' }),
            translateBatch(bias.howToSpot, 'en', toLang, { context: 'tips for spotting cognitive bias' }),
            translateBatch(bias.howToAvoid, 'en', toLang, { context: 'tips for avoiding cognitive bias' })
        ]);
        
        return {
            ...bias,
            // Keep name in English for reference, add translated name
            translatedName: await translate(bias.name, 'en', toLang),
            definition,
            example,
            howToSpot,
            howToAvoid
        };
    }
    
    /**
     * Translate a micro-discovery tooltip
     */
    async function translateTooltip(entry, toLang) {
        if (toLang === 'en') return entry;
        
        return {
            ...entry,
            tooltip: await translate(entry.tooltip, 'en', toLang, { context: 'a brief educational tooltip' })
        };
    }

    // ==================== CLASSIFIER INTEGRATION ====================
    
    /**
     * Translate classifier output (empathyMessage, reasoning)
     */
    async function translateClassifierResult(result, toLang) {
        if (toLang === 'en') return result;
        
        const [empathyMessage, reasoning] = await Promise.all([
            translate(result.empathyMessage, 'en', toLang, { context: 'an empathetic response message' }),
            translate(result.reasoning, 'en', toLang, { context: 'classification reasoning explanation' })
        ]);
        
        return {
            ...result,
            empathyMessage,
            reasoning,
            originalEmpathyMessage: result.empathyMessage,
            originalReasoning: result.reasoning
        };
    }

    // ==================== CONTEXTUAL INTEGRATION ====================
    
    /**
     * Translate contextual discipline explanation
     */
    async function translateDisciplineContext(context, toLang) {
        if (toLang === 'en') return context;
        
        const [explanation, suggestions] = await Promise.all([
            translate(context.explanation, 'en', toLang, { context: 'educational guidance about critical thinking' }),
            translateBatch(context.suggestions || [], 'en', toLang, { context: 'critical thinking suggestions' })
        ]);
        
        return {
            ...context,
            explanation,
            suggestions
        };
    }

    // ==================== EXPORT INTEGRATION ====================
    
    /**
     * Translate export labels and generated text
     */
    async function translateExportContent(content, toLang) {
        if (toLang === 'en') return content;
        
        // Export content is typically longer, so we translate as a single block
        return translate(content, 'en', toLang, { 
            context: 'a formal assessment report or transcript',
            preserveFormatting: true 
        });
    }

    // ==================== INITIALIZATION ====================
    
    /**
     * Initialize VINCULUM
     * Sets up event listeners and prepares the translation system
     */
    function init() {
        console.log('🌐 VINCULUM initialized — "That which binds together"');
        console.log(`🌐 Current language: ${getCurrentLanguage()}`);
        console.log(`🌐 Supported languages: ${Object.keys(config.languages).join(', ')}`);
        
        // Listen for language changes
        if (typeof window !== 'undefined') {
            const selector = document.getElementById('languageSelect');
            if (selector) {
                selector.addEventListener('change', () => {
                    // Clear cache on language change to ensure fresh translations
                    cache.clear();
                    console.log(`🌐 VINCULUM: Language changed to ${selector.value}, cache cleared`);
                });
            }
        }
    }

    // Auto-init when DOM is ready
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    // ==================== PUBLIC API ====================
    
    return {
        // Core translation
        translate,
        toUserLanguage,
        toEnglish,
        process,
        translateBatch,
        translateObject,
        
        // Module-specific translators
        translateFactoid,
        translateBiasEntry,
        translateTooltip,
        translateClassifierResult,
        translateDisciplineContext,
        translateExportContent,
        
        // Language utilities
        getCurrentLanguage,
        isValidLanguage,
        isRTL,
        getLanguageInfo,
        getAvailableLanguages: () => Object.keys(config.languages),
        
        // Cache management
        clearCache: () => cache.clear(),
        getCacheSize: () => cache.size,
        
        // Configuration
        config,
        
        // Initialization
        init
    };

})();

// ==================== GLOBAL EXPORT ====================

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.Vinculum = Vinculum;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Vinculum;
}
