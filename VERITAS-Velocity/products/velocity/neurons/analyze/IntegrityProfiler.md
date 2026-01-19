# IntegrityProfiler Neuron

**Category:** ANALYZE  
**Status:** Active  
**Source:** `assess.js:377-556` (Integrity 2.0 Framework)  
**Dependencies:** RealityProfiler (shared output structure)

---

## Purpose

Evaluates **how claims are presented** independent of their truth value. The IntegrityProfiler measures communication quality, transparency, and intellectual honesty — enabling VERITAS to identify propaganda about true things and honest discussion of false beliefs.

---

## Core Philosophy

> "A claim can be true but presented deceptively, or false but presented honestly."

The IntegrityProfiler answers: "Is this source trying to help you understand, or trying to manipulate you?" This separation from truth-value is crucial because:

1. **Propaganda often contains true facts** — weaponized selectively
2. **Honest inquiry sometimes explores false ideas** — that's how learning works
3. **Manipulation tactics are detectable** — regardless of underlying truth
4. **Trust requires transparency** — not just accuracy

---

## The Three-Dimension Framework

Each dimension contributes 33% to the final Integrity Score (-1.0 to +1.0).

### Dimension 1: Observable Integrity (33%)

Binary checklist measuring visible markers of honest communication:

| Indicator | Y (Good) | P (Partial) | N (Bad) |
|-----------|----------|-------------|---------|
| **Sources Cited** | Adequate sourcing | Some sources, gaps | None/inadequate |
| **Limitations Acknowledged** | States uncertainties | Hints at limits | Claims certainty |
| **Counter-Arguments Addressed** | Engages opposition | Mentions but dismisses | Ignores/strawmans |
| **Fallacies Present** | N (none found) | — | Y (fallacies detected) |

**Scoring Logic:**
- Each Y = +0.25, P = 0, N = -0.25
- Fallacies inverted: N = +0.25, Y = -0.25
- Sum normalized to -1.0 to +1.0

### Dimension 2: Comparative Integrity (33%)

Contextual quality assessment against typical discourse on the topic:

```json
{
  "percentile": 75,
  "baseline": "Quality coverage of this topic typically includes...",
  "gaps": [
    "Missing: primary source links",
    "Missing: acknowledgment of ongoing debate"
  ],
  "score": 0.5
}
```

**Scoring Logic:**
- Percentile 0-100 mapped to -1.0 to +1.0
- Formula: `(percentile - 50) / 50`
- 50th percentile = neutral (0.0)
- Below 50 = negative, Above 50 = positive

### Dimension 3: Bias Integrity (33%)

Detection of presentation patterns signaling advocacy over inquiry:

| Pattern | What to Look For |
|---------|------------------|
| **Inflammatory Language** | Loaded words, emotional manipulation |
| **Playbook Patterns** | Known propaganda tactics, misdirection |
| **Inaccuracies** | Factual errors that serve a narrative |
| **One-Sided Framing** | Missing perspectives, selective evidence |

**Scoring Logic:**
- Each detected pattern reduces score
- Clean presentation approaches +1.0
- Heavy bias approaches -1.0

---

## Output Structure

```json
{
  "integrityScore": 0.45,
  
  "integrity": {
    "observable": {
      "sourcesCited": "P",
      "sourcesCitedEvidence": "Article cites two studies but links are broken...",
      "limitationsAcknowledged": "N",
      "limitationsEvidence": "Claims definitive conclusions despite...",
      "counterArgumentsAddressed": "Y",
      "counterArgumentsEvidence": "Fairly represents opposing view that...",
      "fallaciesPresent": "Y",
      "fallaciesEvidence": "Appeal to authority in paragraph 3...",
      "score": -0.25
    },
    
    "comparative": {
      "percentile": 65,
      "baseline": "Quality coverage includes peer-reviewed sources...",
      "gaps": ["Missing methodology details", "No error bars on data"],
      "score": 0.30
    },
    
    "bias": {
      "inflammatoryLanguage": "Uses 'catastrophic' and 'undeniable' without...",
      "playbookPatterns": ["False dilemma in conclusion"],
      "inaccuracies": ["Misquotes the 2023 study as saying..."],
      "oneSidedFraming": "Only interviews proponents, no critics...",
      "score": -0.15
    }
  }
}
```

---

## Final Score Calculation

```
Integrity Score = (Observable × 0.33) + (Comparative × 0.33) + (Bias × 0.33)

Example:
  Observable:  -0.25 × 0.33 = -0.0825
  Comparative:  0.30 × 0.33 =  0.099
  Bias:        -0.15 × 0.33 = -0.0495
  ─────────────────────────────────────
  Final:                     = -0.033 → -0.03
```

---

## Interpretation Guide

| Score Range | Interpretation | Example |
|-------------|----------------|---------|
| +0.7 to +1.0 | Exemplary honesty | Academic papers, quality journalism |
| +0.3 to +0.6 | Generally honest | Most mainstream reporting |
| -0.2 to +0.2 | Mixed/neutral | Opinion pieces, advocacy with disclosure |
| -0.6 to -0.3 | Significant bias | Partisan media, undisclosed conflicts |
| -1.0 to -0.7 | Manipulative | Propaganda, deliberate misinformation |

---

## The Reality × Integrity Matrix

```
                    HIGH INTEGRITY
                         │
         Honest Error    │    Trustworthy Truth
         (Learn from)    │    (Rely on)
                         │
LOW REALITY ─────────────┼───────────── HIGH REALITY
                         │
         Deliberate      │    Weaponized Truth
         Misinformation  │    (Propaganda)
                         │
                    LOW INTEGRITY
```

**Quadrant Analysis:**

1. **High Reality + High Integrity**: Ideal source — accurate and honest
2. **High Reality + Low Integrity**: Dangerous — true facts used manipulatively
3. **Low Reality + High Integrity**: Honest mistake — correctable through dialogue
4. **Low Reality + Low Integrity**: Deliberate deception — requires exposure

---

## Detection Patterns

### Fallacy Recognition

The IntegrityProfiler detects common logical fallacies:

- **Ad Hominem**: Attacking the person instead of argument
- **Straw Man**: Misrepresenting opposing view
- **False Dilemma**: Presenting only two options when more exist
- **Appeal to Authority**: Using status instead of evidence
- **Slippery Slope**: Claiming inevitable chain without justification
- **Whataboutism**: Deflecting by pointing to other wrongs

### Playbook Pattern Detection

Known manipulation tactics from misinformation research:

- **Firehose of Falsehood**: Overwhelming with volume
- **DARVO**: Deny, Attack, Reverse Victim/Offender
- **Gish Gallop**: Too many weak arguments to refute
- **Moving Goalposts**: Changing criteria when met
- **JAQing Off**: "Just Asking Questions" to imply without asserting

---

## Integration Points

| Component | Interaction |
|-----------|-------------|
| **RealityProfiler** | Paired output — always assessed together |
| **VINCULUMBridge** | All evidence text translated to user language |
| **AgenticLoop** | Verify track may update integrity based on source discovery |
| **WisdomSynthesizer** | Integrity score influences Plain Truth tone |

---

## Design Decisions

### Why Separate from Reality?

Traditional fact-checking conflates "Is it true?" with "Is it presented honestly?" This creates blind spots:

- **True propaganda passes** — because the facts check out
- **Honest uncertainty fails** — because there's no verdict
- **Context manipulation invisible** — selective truth is still selection

### Why Three Dimensions?

1. **Observable**: What anyone can verify by reading carefully
2. **Comparative**: Requires domain knowledge — is this normal?
3. **Bias**: Requires pattern recognition — is this manipulation?

Each catches different integrity failures.

### Why Binary for Observable?

Simplicity and auditability. "Did they cite sources?" has a clear answer. Fuzzy metrics invite gaming.

---

## Critical Rules

### Independence from Truth

> "Rate the presentation AS IF you didn't know whether the claim was true."

This prevents:
- Assuming bad presentation means false
- Assuming good presentation means true
- Letting truth-value bias integrity assessment

### Evidence Required

Every indicator must cite specific evidence:

```
❌ WRONG: "limitationsAcknowledged": "N"
✅ RIGHT: "limitationsAcknowledged": "N", 
          "limitationsEvidence": "Claims 'definitely proven' in paragraph 2 
           despite only two small studies cited..."
```

### Context Sensitivity

Comparative integrity must account for genre:
- Academic paper vs. blog post
- Breaking news vs. investigative report
- Opinion piece vs. news article

Different standards, same rigor.

---

## Future Enhancements

1. **Source credibility database**: Track integrity history of publishers
2. **Manipulation fingerprinting**: Identify coordinated campaigns
3. **Improvement suggestions**: "To improve integrity, add..."
4. **Temporal tracking**: How has this source's integrity changed?
5. **Cross-reference detection**: Identify citation networks

---

## Module Interaction Diagram

```
Claim Input
    │
    ├───────────────┬───────────────┐
    ▼               ▼               ▼
┌────────┐    ┌──────────┐    ┌────────┐
│Observable│   │Comparative│   │  Bias  │
│ Markers │   │ Analysis  │   │Patterns│
└────┬────┘   └─────┬─────┘   └───┬────┘
     │              │             │
     └──────────────┼─────────────┘
                    │
                    ▼
            ┌──────────────┐
            │ INTEGRITY    │
            │   SCORE      │
            │  (-1 to +1)  │
            └──────────────┘
                    │
                    ▼
            Combined with
            Reality Score
                    │
                    ▼
            ┌──────────────┐
            │   PROFILE    │
            │  COMPLETE    │
            └──────────────┘
```

---

*"How something is said matters as much as whether it's true."*  
— VERITAS Philosophy
