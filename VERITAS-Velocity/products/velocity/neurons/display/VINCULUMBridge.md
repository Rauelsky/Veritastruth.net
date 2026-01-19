# NEURON: VINCULUMBridge

**Version:** 0.1  
**Created:** 2026-01-17  
**Last Modified:** 2026-01-17  
**Status:** Active (Consolidation pending)  
**Category:** DISPLAY  

---

## SOMA (Core Function)

The Universal Translator system that enables VERITAS to deliver wisdom in the user's native language. Handles language configuration, prompt injection for multilingual output, RTL support detection, and language-specific resource localization (e.g., crisis hotlines).

**Philosophy:** "Water that flows over rocks and wears them down" — Not translated, but *lived*. The goal is for wisdom to find its natural expression in each language, not mechanical word-for-word translation.

---

## DENDRITES (Inputs)

| Receives | From | Data Shape | Required? |
|----------|------|------------|-----------|
| language | UI selection / auto-detect | `string` (ISO 639-1 code) | No (default: 'en') |
| contentType | TrackRouter | `'assessment' \| 'verification' \| 'guidance'` | Implicit |

---

## AXON TERMINALS (Outputs)

| Sends | To Neuron(s) | Data Shape | Trigger |
|-------|--------------|------------|---------|
| languageInstruction | Prompt Builder | `string` (prompt injection block) | Non-English language |
| languageConfig | Response Handler | `{ name, rtl, crisisResources? }` | Always |
| crisisResources | CrisisDetector | `string` (localized resources) | Track C + crisis detected |

---

## SYNAPTIC CONNECTIONS

- **Upstream:** UserQueryParser (language detection), UI (language selection)
- **Downstream:** All prompt builders, CrisisDetector, ResponseRenderer
- **Lateral:** None

---

## CURRENT IMPLEMENTATION

VINCULUM is currently **duplicated across three files** with slight variations:

### assess.js (Lines 168-184, 203-225)
```javascript
const LANGUAGE_NAMES = {
    en: 'English',
    es: 'Spanish (Español)',
    fr: 'French (Français)',
    // ... 14 languages total
};

// Injection in buildTrackAPrompt:
if (language !== 'en') {
    prompt += '🌐 UNIVERSAL TRANSLATOR - LANGUAGE INSTRUCTION 🌐\n';
    prompt += '**CRITICAL**: The user\'s language preference is **' + languageName + '**.\n';
    prompt += 'You MUST write ALL human-readable content in ' + languageName + '...\n';
}
```

### verify.js (Lines 32-83)
```javascript
const LANGUAGE_NAMES = { /* same 14 languages */ };

// Similar injection in buildPrompt()
if (language !== 'en') {
    prompt += '═══════════════════════════════════════════════════════════════════\n';
    prompt += '🌐 UNIVERSAL TRANSLATOR - LANGUAGE INSTRUCTION 🌐\n';
    // ... similar content with verify-specific fields
}
```

### navigate.js (Lines 15-114, 162-200)
```javascript
const LANGUAGE_CONFIG = {
    en: { 
        name: 'English', 
        rtl: false,
        crisisResources: `
- 988 Suicide & Crisis Lifeline (call or text 988)
- Crisis Text Line (text HOME to 741741)
- ...`
    },
    // ... 14 languages with crisis resources
};

function buildLanguageInstruction(language) {
    // More poetic version: "Water that flows over rocks..."
}
```

---

## SUPPORTED LANGUAGES

| Code | Name | RTL | Crisis Resources |
|------|------|-----|------------------|
| en | English | No | ✅ US-focused |
| es | Spanish (Español) | No | ✅ Spain, Mexico, Argentina |
| fr | French (Français) | No | ✅ France, Quebec, Belgium, Switzerland |
| de | German (Deutsch) | No | ✅ Germany, Austria, Switzerland |
| it | Italian (Italiano) | No | ✅ Italy |
| pt | Portuguese (Português) | No | ✅ Brazil, Portugal |
| ru | Russian (Русский) | No | ✅ Russia |
| uk | Ukrainian (Українська) | No | ✅ Ukraine |
| el | Greek (Ελληνικά) | No | ✅ Greece |
| zh | Chinese (中文) | No | ✅ China, Taiwan, Hong Kong |
| ja | Japanese (日本語) | No | ✅ Japan |
| ko | Korean (한국어) | No | ✅ South Korea |
| ar | Arabic (العربية) | **Yes** | ✅ Egypt, Lebanon, Saudi Arabia |
| he | Hebrew (עברית) | **Yes** | ✅ Israel |

---

## LANGUAGE INSTRUCTION PATTERNS

### Assessment Pattern (assess.js, verify.js)
```
🌐 UNIVERSAL TRANSLATOR - LANGUAGE INSTRUCTION 🌐

**CRITICAL**: The user's language preference is **[Language Name]**.

You MUST write ALL human-readable content in [Language], including:
- [List of specific fields for this track]

Keep JSON keys and technical identifiers in English.
Keep the exactClaimBeingScored in its original language.
Numbers, scores, and factor names remain in English for parsing.
```

### Guidance Pattern (navigate.js)
```
╔═══════════════════════════════════════════════════════════════════╗
🌐 VINCULUM — UNIVERSAL TRANSLATOR 🌐

This conversation flows in [Language].

Not translated — *lived*. Think in [Language]. Feel in [Language]. 
Let the empathy, the frameworks, the gentle guidance all find their 
natural expression in this language.

You're being present with someone who thinks in [Language]. The "wise 
friend" might feel different — might reference different shared 
experiences, different cultural touchstones. That's not something to 
perform; it's something to trust.
╚═══════════════════════════════════════════════════════════════════╝
```

---

## DAMAGE REPORT (What Breaks If This Dies)

- **English-only output** → Excludes non-English speakers
- **Wrong crisis resources** → Safety concern for Track C users
- **RTL not detected** → Broken display for Arabic/Hebrew
- **Inconsistent translations** → Different quality across tracks

**Severity:** MEDIUM-HIGH — Accessibility and safety implications

---

## EXTRACTION PLAN (Phase 1)

1. Create `/modules/vinculum.js` with:
   ```javascript
   // Consolidated language configuration
   export const LANGUAGE_CONFIG = {
       en: { name: 'English', rtl: false, crisisResources: '...' },
       // ... all 14 languages
   };
   
   // Universal instruction builder
   export function buildLanguageInstruction(language, track) {
       // Returns appropriate instruction block for track type
   }
   
   // Get crisis resources for language
   export function getCrisisResources(language) {
       return LANGUAGE_CONFIG[language]?.crisisResources 
           || LANGUAGE_CONFIG.en.crisisResources;
   }
   
   // Check RTL status
   export function isRTL(language) {
       return LANGUAGE_CONFIG[language]?.rtl || false;
   }
   ```

2. Update all three API files to import from shared module

3. Add frontend RTL support based on `isRTL()` response

---

## FUTURE ENHANCEMENTS

### Phase 2: Auto-Detection
```javascript
// Detect language from user input
function detectLanguage(text) {
    // Use library like franc or langdetect
    // Return ISO 639-1 code
}
```

### Phase 3: Cultural Adaptation
- Localized examples in prompts
- Culture-specific wisdom traditions emphasized
- Regional date/number formatting

### Phase 4: Expanded Language Support
Priority additions:
- Hindi (hi) — 600M+ speakers
- Bengali (bn) — 270M+ speakers
- Turkish (tr) — 80M+ speakers
- Vietnamese (vi) — 85M+ speakers
- Thai (th) — 60M+ speakers
- Polish (pl) — 45M+ speakers

---

## GROWTH HISTORY

| Date | Change | Reason | Synapses Affected |
|------|--------|--------|-------------------|
| 2026-01-17 | Documented | Phase 1 neuron extraction | None (documentation only) |

---

## NOTES

- VINCULUM name comes from Latin "bond" or "link" — the bridge between languages
- Crisis resources need periodic verification (hotline numbers change)
- RTL support exists in config but frontend implementation not confirmed
- The "poetic" instruction in navigate.js produces noticeably better non-English output
- Consider making poetic style the default for all tracks
- No auto-detection currently — relies entirely on UI selection
