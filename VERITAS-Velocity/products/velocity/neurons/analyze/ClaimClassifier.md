# NEURON: ClaimClassifier

**Version:** 0.1  
**Created:** 2026-01-17  
**Last Modified:** 2026-01-17  
**Status:** Active (Legacy extraction pending)  
**Category:** ANALYZE  

---

## SOMA (Core Function)

Determines the type and complexity of a claim, selects appropriate assessment criteria, and routes to the correct processing track (A: Factual, B: Criteria-Based, C: Empathetic Guidance).

---

## DENDRITES (Inputs)

| Receives | From | Data Shape | Required? |
|----------|------|------------|-----------|
| parsedQuery | UserQueryParser | `{ question: string, articleText?: string, language: string }` | Yes |
| track | User selection (UI) | `'a' \| 'b' \| 'c'` | No (can be auto-determined) |
| claimType | User selection (UI) | `string` | No (Track B only) |
| selectedCriteria | User selection (UI) | `string[]` | No (Track B only) |

---

## AXON TERMINALS (Outputs)

| Sends | To Neuron(s) | Data Shape | Trigger |
|-------|--------------|------------|---------|
| classification | TrackRouter | `{ track: string, claimType: string, complexity: string }` | Always |
| criteria | TrackBProcessor | `CriteriaSet` | Track B only |
| questionType | RealityProfiler | `string` | Track A only |

---

## SYNAPTIC CONNECTIONS

- **Upstream:** UserQueryParser
- **Downstream:** TrackRouter, TrackBProcessor (future), RealityProfiler
- **Lateral:** ComplexityRouter (future - for Haiku fast-path)

---

## CURRENT IMPLEMENTATION

**Location:** `/api/assess.js` (lines 109-162, 186-618)

### Criteria Sets (lines 109-162)
```javascript
const CRITERIA_SETS = {
    qualification: { /* Person Qualification - 5 criteria */ },
    policy: { /* Policy Effectiveness - 5 criteria */ },
    product: { /* Product/Service Quality - 5 criteria */ },
    prediction: { /* Prediction/Forecast - 5 criteria */ },
    generic: { /* General Assessment - 6 criteria */ }
};
```

### Question Type Detection (embedded in prompt, lines 489-491)
```javascript
"questionType": "<Empirical Fact | Efficacy Claim | Rationale Validity | 
                 Compound Claim | Predictive | Historical | Definitional | Quantified>"
```

### Track Selection Logic
Currently manual (user selects). No auto-classification implemented.

---

## CRITERIA DEFINITIONS

### Qualification (Person Assessment)
| ID | Label | Description |
|----|-------|-------------|
| legal | Legal Eligibility | Constitutional/legal requirements |
| experience | Experience & Credentials | Relevant background |
| record | Historical Record | Track record in similar roles |
| alignment | Value Alignment | Stated values vs role requirements |
| controversies | Controversies & Concerns | Documented red flags |

### Policy (Policy Effectiveness)
| ID | Label | Description |
|----|-------|-------------|
| goals | Stated Goals Clarity | Clear, measurable goals? |
| outcomes | Measurable Outcomes | Evidence of actual outcomes |
| costbenefit | Cost/Benefit Analysis | Costs vs benefits |
| alternatives | Comparison to Alternatives | How does it compare? |
| implementation | Implementation Challenges | Practical obstacles |

### Product (Product/Service Quality)
| ID | Label | Description |
|----|-------|-------------|
| audience | Who Benefits | Target audience appropriateness |
| measure | Success Criteria | How is quality defined? |
| comparison | Comparison to Alternatives | Competitive analysis |
| timeframe | Timeframe Considerations | Short vs long-term |
| credibility | Source Credibility | Conflicts of interest |

### Prediction (Forecast Assessment)
| ID | Label | Description |
|----|-------|-------------|
| trackrecord | Predictor Track Record | Historical accuracy |
| transparency | Model Transparency | Is reasoning visible? |
| baserates | Base Rates Acknowledged | Historical context |
| uncertainty | Uncertainty Quantified | Error bars present? |
| falsifiability | Falsifiability Defined | What would disprove it? |

### Generic (General Assessment)
| ID | Label | Description |
|----|-------|-------------|
| evidence | Evidence Quality | Supporting/refuting evidence |
| expertise | Source Expertise | Relevant credentials |
| audience | Who Benefits | Cui bono? |
| alternatives | Alternative Perspectives | Competing viewpoints |
| outcomes | Measurable Outcomes | Concrete measurements |
| timeframe | Timeframe Considerations | Time horizon effects |

---

## DAMAGE REPORT (What Breaks If This Dies)

- **TrackRouter** doesn't know where to send → wrong track, poor results
- **Track B** has no criteria → assessment has no structure
- **RealityProfiler** doesn't know question type → wrong factor weights
- **Haiku fast-path** (future) can't identify simple queries

**Severity:** HIGH — Core routing logic

---

## EXTRACTION PLAN (Phase 1)

1. Extract `CRITERIA_SETS` to shared module (`/modules/criteria.js`)
2. Create `ClaimClassifier` class with:
   - `classify(query)` → returns classification object
   - `detectComplexity(query)` → 'simple' | 'moderate' | 'complex'
   - `suggestTrack(query)` → 'a' | 'b' | 'c'
   - `getCriteria(claimType)` → CriteriaSet
3. **Phase 2:** Add Haiku-based auto-classification for complexity routing

---

## GROWTH HISTORY

| Date | Change | Reason | Synapses Affected |
|------|--------|--------|-------------------|
| 2026-01-17 | Documented | Phase 1 neuron extraction | None (documentation only) |

---

## NOTES

- Question type detection is currently done by Claude in the prompt, not pre-classified
- Track selection is entirely manual — auto-routing would improve UX
- Complexity detection (for Haiku fast-path) doesn't exist yet — Phase 2 target
- Criteria sets are hardcoded — could be configurable in future
