# NEURON: TrackRouter

**Version:** 0.1  
**Created:** 2026-01-17  
**Last Modified:** 2026-01-17  
**Status:** Active (Legacy extraction pending)  
**Category:** GUIDE  

---

## SOMA (Core Function)

Routes user queries to the appropriate processing track based on claim type, user selection, and query characteristics. The central dispatcher that determines whether a query flows through Track A (Factual Assessment), Track B (Criteria-Based Assessment), or Track C (Empathetic Guidance).

---

## DENDRITES (Inputs)

| Receives | From | Data Shape | Required? |
|----------|------|------------|-----------|
| track | User selection (UI) | `'a' \| 'b' \| 'c'` | Yes (currently) |
| question | UserQueryParser | `string` | Yes |
| articleText | UserQueryParser | `string \| null` | No |
| claimType | User selection (UI) | `string` | Track B only |
| criteria | User selection (UI) | `string[]` | Track B only |
| customCriteria | User input | `string[]` | No |
| fiveWsContext | User input | `object` | No |
| language | UI / auto-detect | `string` (ISO 639-1) | No (default: 'en') |

---

## AXON TERMINALS (Outputs)

| Sends | To Neuron(s) | Data Shape | Trigger |
|-------|--------------|------------|---------|
| prompt | Anthropic API | `string` (full prompt) | Always |
| trackConfig | ResponseParser | `{ track: string, claimType?: string }` | Always |
| languageConfig | VINCULUMBridge | `{ language: string, languageName: string }` | Always |

---

## SYNAPTIC CONNECTIONS

- **Upstream:** UserQueryParser, ClaimClassifier (future)
- **Downstream:** Anthropic API, ResponseParser, VINCULUMBridge
- **Lateral:** ComplexityRouter (future - for Haiku fast-path)

---

## CURRENT IMPLEMENTATION

**Location:** `/api/assess.js` (lines 1204-1218, handler logic)

### Track Selection (Manual)
```javascript
// Build appropriate prompt based on track
var prompt;
if (track === 'b') {
    console.log('=== TRACK B ASSESSMENT ===');
    prompt = buildTrackBPrompt(question, claimType, criteria, customCriteria, fiveWsContext, language);
} else {
    prompt = buildTrackAPrompt(question, articleText, language);
}
```

### Track A Routing
- **Endpoint:** `/api/assess.js` with `track: 'a'` (or no track specified)
- **Prompt Builder:** `buildTrackAPrompt()` (lines 186-618)
- **Purpose:** Factual claims, empirical questions, article analysis
- **Features:** Reality Profile, Integrity Profile, web search verification

### Track B Routing
- **Endpoint:** `/api/assess.js` with `track: 'b'`
- **Prompt Builder:** `buildTrackBPrompt()` (lines 620-950)
- **Purpose:** Criteria-based assessment (qualifications, policies, products, predictions)
- **Features:** Custom criteria sets, 5Ws context, structured evaluation

### Track C Routing
- **Endpoint:** `/api/navigate.js` (separate file)
- **Purpose:** Empathetic guidance, emotionally complex situations
- **Features:** Crisis detection, framework-based guidance, conversation mode

---

## ROUTING DECISION MATRIX

| Input Characteristics | Recommended Track | Rationale |
|-----------------------|-------------------|-----------|
| Factual question, verifiable | A | Direct truth assessment |
| Article/URL provided | A | Content analysis |
| Person qualification question | B (qualification) | Structured criteria |
| Policy effectiveness question | B (policy) | Multi-factor analysis |
| Product/service evaluation | B (product) | Comparative criteria |
| Prediction assessment | B (prediction) | Forecast methodology |
| Emotional situation | C | Empathetic guidance needed |
| Relationship conflict | C | Framework-based support |
| Life decision | C | Values clarification |
| Crisis indicators detected | C (priority) | Safety-first routing |

---

## TRACK SIGNATURES

### Track A Response Shape
```javascript
{
    realityScore: number,        // -10 to +10
    integrityScore: number,      // -1.0 to +1.0
    exactClaimBeingScored: string,
    questionType: string,
    selectedFactors: array,
    structured: {
        realityFactors: object,
        integrity: object,
        underlyingReality: string,
        centralClaims: array,
        // ... more fields
    }
}
```

### Track B Response Shape
```javascript
{
    realityScore: null,          // Not applicable
    integrityScore: null,        // Not applicable
    structured: {
        trackB: {
            claimType: string,
            criteriaAssessed: array,
            overallAssessment: string,
            // ... criteria-specific fields
        },
        sources: array
    }
}
```

### Track C Response Shape
```javascript
{
    content: string,             // Conversational response
    crisisDetected: boolean,
    language: string
}
```

---

## DAMAGE REPORT (What Breaks If This Dies)

- **Wrong track** → Mismatched assessment methodology
- **Track B without criteria** → 400 error, no assessment
- **Track C missed for crisis** → Safety concern, inadequate support
- **Language not propagated** → English-only response for non-English user

**Severity:** HIGH — Core dispatch logic

---

## EXTRACTION PLAN (Phase 1)

1. Create `TrackRouter` class with:
   - `route(query, options)` → returns `{ track, endpoint, promptBuilder }`
   - `detectTrack(query)` → auto-classification (future)
   - `validateTrackRequirements(track, options)` → pre-flight check
   - `getTrackConfig(track)` → returns track-specific settings

2. **Phase 2:** Add auto-routing based on query analysis:
   - Keyword detection for track hints
   - Crisis pattern detection → force Track C
   - Complexity assessment → Haiku vs Sonnet

3. **Phase 3:** Add ComplexityRouter integration:
   - Simple queries → Haiku fast-path
   - Complex queries → Full Sonnet pipeline

---

## FUTURE: AUTO-ROUTING HEURISTICS

```javascript
// Proposed auto-detection logic
function detectTrack(query) {
    // Crisis detection takes priority
    if (detectCrisis(query)) return 'c';
    
    // Emotional/guidance keywords
    if (/\b(should I|help me decide|feeling|struggling|relationship)\b/i.test(query)) {
        return 'c';
    }
    
    // Criteria-based keywords
    if (/\b(qualified|effective|good product|will .* happen|predict)\b/i.test(query)) {
        return 'b';
    }
    
    // Default to factual
    return 'a';
}
```

---

## GROWTH HISTORY

| Date | Change | Reason | Synapses Affected |
|------|--------|--------|-------------------|
| 2026-01-17 | Documented | Phase 1 neuron extraction | None (documentation only) |

---

## NOTES

- Track selection is currently 100% manual (user chooses in UI)
- No validation that Track B has required criteria before API call (frontend handles)
- Track C lives in separate file (`navigate.js`) — consider unifying routing
- Crisis detection exists in Track C but doesn't influence routing from Track A/B
- Future: Single entry point that routes to appropriate handler
