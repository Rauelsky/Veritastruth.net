# NEURON: UserQueryParser

**Version:** 0.1  
**Created:** 2026-01-17  
**Last Modified:** 2026-01-17  
**Status:** Active (Legacy extraction pending)  
**Category:** INGEST  

---

## SOMA (Core Function)

Parses raw user input to extract the query, detect input type (text/URL/article), identify language, and prepare normalized input for downstream processing.

---

## DENDRITES (Inputs)

| Receives | From | Data Shape | Required? |
|----------|------|------------|-----------|
| rawInput | User (via UI) | `string` | Yes |
| inputType | User selection | `'question' \| 'url' \| 'article'` | No (auto-detected) |
| language | UI language selector | `string` (ISO 639-1) | No (default: 'en') |

---

## AXON TERMINALS (Outputs)

| Sends | To Neuron(s) | Data Shape | Trigger |
|-------|--------------|------------|---------|
| parsedQuery | ClaimClassifier, TrackRouter | `{ question: string, articleText?: string, language: string }` | Always |
| urlContent | ClaimClassifier | `string` (extracted text) | When URL detected |
| detectedLanguage | VINCULUMBridge | `string` | Always |

---

## SYNAPTIC CONNECTIONS

- **Upstream:** None (entry point)
- **Downstream:** ClaimClassifier, TrackRouter, VINCULUMBridge
- **Lateral:** None

---

## CURRENT IMPLEMENTATION

**Location:** `/api/assess.js` (lines 10-79, 1173-1176)

### URL Fetcher (lines 10-79)
```javascript
async function fetchUrlContent(url, redirectCount = 0) {
    // Handles redirects (max 5)
    // Strips HTML tags, decodes entities
    // Truncates to 15000 chars
    // Returns cleaned text
}
```

### Input Normalization (lines 1145-1176)
```javascript
// URL detection and normalization
if (url) {
    try {
        let normalizedUrl = url.trim();
        if (!normalizedUrl.match(/^https?:\/\//i)) {
            normalizedUrl = 'https://' + normalizedUrl;
        }
        // ... fetch and extract
    }
}
```

### Language Detection
Currently relies on UI selection (`language` parameter). Auto-detection not implemented.

---

## DAMAGE REPORT (What Breaks If This Dies)

- **ClaimClassifier** receives nothing → cannot classify
- **TrackRouter** cannot route → user stuck on input screen
- **Assessment pipeline** never starts
- **VINCULUM** doesn't know target language → defaults to English

**Severity:** CRITICAL — System entry point

---

## EXTRACTION PLAN (Phase 1)

1. Extract `fetchUrlContent()` to standalone module
2. Create `UserQueryParser` class with:
   - `parse(rawInput, options)` → returns normalized query object
   - `detectInputType(input)` → 'question' | 'url' | 'article'
   - `detectLanguage(input)` → ISO code (future: use library)
3. Add input validation and sanitization
4. Emit events for trace logging

---

## GROWTH HISTORY

| Date | Change | Reason | Synapses Affected |
|------|--------|--------|-------------------|
| 2026-01-17 | Documented | Phase 1 neuron extraction | None (documentation only) |

---

## NOTES

- URL fetching has 15-second timeout
- Max 5 redirects before failure
- Content truncated at 15,000 characters
- No rate limiting on URL fetches (potential abuse vector)
