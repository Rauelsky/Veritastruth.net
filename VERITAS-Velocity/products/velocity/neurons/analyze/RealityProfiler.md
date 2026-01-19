# RealityProfiler Neuron

**Category:** ANALYZE  
**Status:** Active  
**Source:** `assess.js:330-600` (prompt builder)  
**Dependencies:** ClaimClassifier (for claim type identification)

---

## Purpose

Constructs the comprehensive Reality and Integrity PROFILE for claims, generating the dual-axis assessment that is VERITAS's signature output. Implements the "show your math" philosophy — transparent reasoning that teaches critical thinking rather than delivering verdicts.

---

## Core Philosophy

> "Reality and Integrity PROFILES — not scores."

The RealityProfiler doesn't tell users what to believe. It:
1. **Shows the evidence landscape** — what supports and contradicts
2. **Reveals hidden assumptions** — what's being smuggled in
3. **Exposes framing effects** — whose interests are served
4. **Calculates transparently** — every number has visible math

---

## The Dual-Axis Framework

### Reality Score (-10 to +10)

Measures **truth alignment** of factual claims.

| Score Range | Meaning |
|-------------|---------|
| +8 to +10 | Strongly supported by evidence |
| +4 to +7 | Generally supported, some uncertainty |
| +1 to +3 | Slightly supported, significant gaps |
| 0 | Cannot determine / Insufficient evidence |
| -1 to -3 | Slightly contradicted |
| -4 to -7 | Generally contradicted |
| -8 to -10 | Strongly contradicted by evidence |

### Integrity Score (-1.0 to +1.0)

Measures **presentation quality** independent of truth.

A claim can be:
- True but presented badly (high Reality, low Integrity)
- False but presented honestly (low Reality, high Integrity)
- True and presented well (both high)
- False and presented deceptively (both low)

---

## Factor Selection Framework

### Step 1: Identify Question Type

```
| Type            | Key Characteristics                      |
|-----------------|------------------------------------------|
| Empirical Fact  | Testable, observable, measurable         |
| Efficacy Claim  | Requires effect size, replication        |
| Rationale       | Logic + factual components               |
| Compound        | Multiple claims needing separate eval    |
| Predictive      | Future-oriented, track record matters    |
| Historical      | Documentation, corroboration             |
| Definitional    | Conceptual clarity needed                |
| Quantified      | Scope precision critical                 |
```

### Step 2: Select Relevant Factors (3-6)

**Evidence-Based Factors:**
- Evidence Quality
- Effect Size & Replication  
- Predictive Track Record
- Historical Documentation

**Source-Based Factors:**
- Source Reliability
- Expert Consensus Level
- Independence of Sources

**Logic-Based Factors:**
- Logical Coherence
- Premise Validity
- Internal Consistency
- Definitional Clarity

**Context-Based Factors:**
- Scope Precision
- Temporal Accuracy
- Context Dependency
- Burden of Proof Met

### Step 3: Weight and Calculate

```
Reality Score = Σ(factor_score × factor_weight)

Where:
- Weights must sum to 1.0
- Each factor scored -10 to +10
- Final score rounded to integer
- ALL math shown explicitly
```

---

## Integrity 2.0 Framework

Three dimensions, each weighted 33%:

### Dimension 1: Observable Integrity

Binary checklist (Y/P/N):
- **Sources Cited**: Adequate / Partial / None
- **Limitations Acknowledged**: Y/P/N
- **Counter-Arguments Addressed**: Y/P/N
- **Fallacies Present**: Y (bad) / N (good)

### Dimension 2: Comparative Integrity

- **Percentile**: 0-100 vs typical coverage quality
- **Baseline**: What quality discourse includes
- **Gaps**: Specific missing elements

### Dimension 3: Bias Integrity

Detection of advocacy patterns:
- Inflammatory language
- Playbook patterns (known manipulation tactics)
- Factual inaccuracies
- One-sided framing

---

## Output Structure

```json
{
  "questionType": "...",
  "selectedFactors": [
    {
      "name": "Evidence Quality",
      "weight": 0.4,
      "score": 7,
      "rationale": "..."
    }
  ],
  "scoreCalculation": "(7 × 0.4) + (5 × 0.3) + ...",
  "realityScore": 6,
  "integrityScore": 0.3,
  
  "underlyingReality": {
    "coreFinding": "What is actually true here",
    "howWeKnow": "Evidence basis and methods",
    "whyItMatters": "Stakes and significance"
  },
  
  "centralClaims": {
    "explicit": "Surface-level assertion",
    "hidden": "Unstated assumptions",
    "whatFramingServes": "Whose interests"
  },
  
  "frameworkAnalysis": {
    "hiddenPremises": "Smuggled assumptions",
    "ideologicalOrigin": "Source worldview",
    "whatBeingObscured": "Hidden context",
    "reframingNeeded": "Better framing"
  },
  
  "truthDistortionPatterns": [...],
  
  "integrity": {
    "observable": { ... },
    "comparative": { ... },
    "bias": { ... }
  },
  
  "evidenceAnalysis": {
    "forTheClaim": [...],
    "againstTheClaim": [...]
  }
}
```

---

## Critical Rules

### The Math Must Match

> "The displayed score MUST match the calculation (rounded to integer). If you apply any adjustment, EXPLAIN it explicitly."

No hidden adjustments. Every number traceable.

### The Core Rule (for embedded claims)

> "If a question CONTAINS or REFERENCES a factual claim, your Reality Score must reflect that claim's truth value, not whether the question itself is 'valid'."

Example: A question about "Flat Earth tactics" should score -10 (for the Flat Earth claim), not +8 (for "yes, they use tactics").

### No False Confidence

```
❌ WRONG: "I have no evidence he died, so Reality Score -9 (definitely alive)"
✅ RIGHT: "This requires real-time verification I cannot complete" → Reality Score 0
```

---

## Integration Points

| Component | Interaction |
|-----------|-------------|
| **ClaimClassifier** | Provides claim type for factor selection |
| **AgenticLoop** | Verify track may re-evaluate with new evidence |
| **VINCULUMBridge** | All output translated to user's language |
| **CRITERIA_SETS** | Used for Track B structured criteria |

---

## Design Decisions

### Why Show Math?

- **Trust**: Users can verify reasoning
- **Teaching**: Models critical thinking process
- **Accountability**: Claims about claims are checkable
- **Anti-manipulation**: Harder to game transparent systems

### Why Two Scores?

Separating Reality (truth) from Integrity (presentation) allows nuanced assessment:
- Propaganda about true things (low integrity, high reality)
- Honest discussion of false beliefs (high integrity, low reality)
- Quality journalism (both high)
- Deliberate misinformation (both low)

### Why Not Just "True/False"?

- Reality is often uncertain, partial, contextual
- Binary thinking is what we're trying to cure
- Showing the gradient teaches epistemic humility

---

## Future Enhancements

1. **Factor recommendation engine**: Auto-suggest factors based on claim type
2. **Historical calibration**: Track accuracy over time
3. **Comparative scoring**: "This claim is more/less supported than..."
4. **Confidence intervals**: Express uncertainty in the score itself
5. **Source weighting**: Different weight for primary vs secondary sources

---

## Module Interaction Diagram

```
User Query
    │
    ▼
┌─────────────────┐
│ ClaimClassifier │ → Identifies claim type
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RealityProfiler │ → Selects factors, calculates scores
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ VINCULUM Bridge │ → Translates output to user language
└────────┬────────┘
         │
         ▼
    Rendered Profile
```

---

*"Teaching critical thinking, not delivering verdicts."*  
— VERITAS Philosophy
