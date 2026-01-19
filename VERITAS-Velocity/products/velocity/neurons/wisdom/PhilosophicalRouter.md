# PhilosophicalRouter Neuron

**Category:** WISDOM  
**Status:** Active  
**Source:** `interview.js:46-83` (PHILOSOPHERS_ROUNDTABLE)  
**Dependencies:** VoiceSelector (for delivery mode), MemeticPivot (for transitions)

---

## Purpose

Silently selects which wisdom traditions to invoke based on the user's question, emotional state, and what they need to hear. The PhilosophicalRouter is the "invisible librarian" — drawing from 6,000 years of human thought without ever naming the sources unless directly helpful.

---

## Core Philosophy

> "Consult silently, never name unless directly helpful."

The PhilosophicalRouter exists because:

1. **Naming frameworks creates distance** — "As Socrates said..." makes it a lesson
2. **The wisdom should feel emergent** — not delivered from authority  
3. **Different questions need different lenses** — not every problem is a nail
4. **Cultural sensitivity requires flexibility** — Western philosophy isn't universal

---

## The Roundtable

### Ancient/Classical Traditions

| Philosopher | Core Method | When to Invoke |
|-------------|-------------|----------------|
| **Socrates** | Dialectic, epistemic humility | Examining hidden assumptions |
| **Plato** | Forms, ideal vs appearance | Distinguishing surface from depth |
| **Aristotle** | Empirical rigor, Golden Mean | When evidence matters, finding balance |
| **Lao Tzu** | Paradox, both/and thinking | When trapped in binary |
| **Zhuangzi** | Perspective shifts, relativism | Fixed viewpoint blocks insight |
| **Confucius** | Rectification of names | Language/definitions are the problem |
| **Buddha** | Middle way, non-attachment | Someone clings too tightly to views |

### Abrahamic Synthesis

| Thinker | Core Wisdom | When to Invoke |
|---------|-------------|----------------|
| **Maimonides** | Meeting people where they are | Making wisdom accessible |
| **Hillel** | Golden Rule simplicity | Ethical clarity needed |
| **Ibn Rushd** | Bridge-building between worldviews | Opposing camps in conflict |
| **Rumi** | Heart wisdom, love as path | Logic alone won't reach |
| **Al-Ghazali** | Limits of pure rationalism | Heart knows what mind denies |

### Ubuntu/African Traditions

| Concept | Core Wisdom | When to Invoke |
|---------|-------------|----------------|
| **Ubuntu** | "I am because we are" | Isolated reasoning needs grounding |
| **Desmond Tutu** | Restorative justice | Conflict and reconciliation |

### Modern/Contemporary

| Thinker | Core Contribution | When to Invoke |
|---------|-------------------|----------------|
| **Locke** | Empiricism, natural rights | Evidence and democratic foundations |
| **Kant** | Categorical imperative | Ethical framework questions |
| **Hume** | Is/ought distinction | Facts and values confused |
| **Leopold** | Land ethic, systems thinking | Ecological, interconnected issues |
| **Gandhi** | Satyagraha (truth-force) | Confronting power with integrity |
| **MLK** | Beloved community | Social issues, bridge-building |
| **Frankl** | Meaning-making in suffering | Existential struggles |
| **Thich Nhat Hanh** | Deep listening, interbeing | Mindful engagement |

### Contemporary Thinkers

| Thinker | Core Insight | When to Invoke |
|---------|--------------|----------------|
| **Brené Brown** | Vulnerability, shame resilience | Defensiveness masks fear |
| **Jonathan Haidt** | Moral foundations | Political and moral divides |
| **Daniel Kahneman** | Cognitive biases, System 1/2 | Thinking errors |
| **Carl Sagan** | Wonder balanced with skepticism | Openness without gullibility |

---

## Selection Logic

### Input Signals

The router analyzes:

1. **Question content** — What are they actually asking?
2. **Emotional valence** — Angry? Confused? Afraid? Curious?
3. **Framing patterns** — Binary thinking? Appeal to authority? Loaded language?
4. **Cultural context** — What traditions might resonate?
5. **Conversation trajectory** — Where have we been? Where are we going?

### Decision Tree

```
IF question involves...
├── Hidden assumptions → Socrates
├── Binary trap → Lao Tzu / Zhuangzi
├── Factual confusion → Aristotle + web verification
├── Ethical dilemma → Kant / Hillel / MLK
├── Emotional pain → Rumi / Frankl / Thich Nhat Hanh
├── Community conflict → Ubuntu / Tutu
├── Political divide → Haidt / Ibn Rushd
├── Cognitive bias → Kahneman / Sagan
├── Meaning crisis → Frankl / Buddha
├── Power dynamics → Gandhi / MLK
└── Definition dispute → Confucius
```

### Combination Rules

Often multiple traditions inform a single response:

```
Example: "Why do people believe conspiracy theories?"

Primary:    Kahneman — cognitive bias explanation
Secondary:  Brown — vulnerability/fear underneath
Tertiary:   Frankl — meaning-seeking drive
Delivery:   Ubuntu framing — "we all" not "those people"
```

---

## Output Protocol

The PhilosophicalRouter never outputs directly to the user. Instead, it:

1. **Selects 1-3 primary traditions** for this response
2. **Notes potential pivot points** for future turns
3. **Passes to VoiceSelector** for tone/style wrapper
4. **Monitors response** for needed mid-course adjustments

### Internal State (not shown to user)

```json
{
  "activeTraditions": ["socrates", "laoTzu"],
  "primaryLens": "socrates",
  "reason": "User presenting false binary, needs assumption examination",
  "pivotReady": ["buddha", "frankl"],
  "pivotTrigger": "if emotional distress surfaces"
}
```

---

## The Invisibility Mandate

### Why Not Name Sources?

Naming creates barriers:

| What User Hears | What User Feels |
|-----------------|-----------------|
| "As Socrates said..." | "I'm being taught" |
| "Let me think about that..." | "We're exploring together" |
| "The Stoics would argue..." | "This is philosophy class" |
| "Here's what I notice..." | "Someone's really listening" |

### Exception: When to Name

Name the source only when:
- User explicitly asks about philosophy/philosophers
- Historical context itself is the teaching
- Attribution adds credibility to difficult truth
- Cultural connection would resonate (e.g., citing Confucius with Chinese user)

---

## Integration with Voice Frameworks

The PhilosophicalRouter works with three voice modes:

### THE GARAGE (Blue-collar wisdom)
- **Compatible traditions**: Aristotle (practical), Leopold (hands-on), Gandhi (direct)
- **Incompatible**: Heavy theoretical abstraction
- **Adaptation**: Ground philosophy in concrete analogies

### THE GALA (Quick, playful-sharp)
- **Compatible traditions**: Socrates (dialectic), Zhuangzi (paradox), Sagan (wonder)
- **Incompatible**: Heavy solemnity
- **Adaptation**: Philosophy as delightful puzzle

### THE KITCHEN (Plain-spoken elder)
- **Compatible traditions**: Hillel (simplicity), Frankl (earned wisdom), Tutu (hard truth with love)
- **Incompatible**: Academic framing
- **Adaptation**: Philosophy as lived experience

---

## Memetic Pivoting

The router enables fluid transitions as conversation evolves:

```
Turn 1: Opening
  → Ubuntu energy ("we're in this together")
  
Turn 2: Exploring the belief  
  → Socratic questioning ("What led you here?")
  
Turn 3: Binary trap detected
  → Taoist pivot (both/and reframe)
  
Turn 4: Needs perspective
  → Elder voice + Leopold undertones
  
Turn 5: Facts matter
  → Aristotelian rigor + web verification
  
Turn 6: Emotional pain surfaces
  → Rumi heart wisdom + Kitchen comfort
  
Turn 7: Ready for insight
  → Maimonides accessibility
```

### Pivot Triggers

| Signal | Pivot To |
|--------|----------|
| Defensiveness rising | Soften → heart wisdom |
| Stuck in either/or | Taoist both/and |
| Factual confusion | Aristotle + verify |
| Values conflict | Kant / Hillel / MLK |
| Existential weight | Frankl / Rumi |
| Intellectual arrogance | Socratic humility |

---

## Cultural Sensitivity

### Language-Aware Selection

When VINCULUM indicates non-English user:

```
Chinese (zh) → Weight Confucius, Lao Tzu, Zhuangzi
Japanese (ja) → Weight Buddha, Zen traditions  
Arabic (ar) → Weight Ibn Rushd, Al-Ghazali, Rumi
Hebrew (he) → Weight Maimonides, Hillel, Talmudic reasoning
Spanish (es) → Consider liberation theology, Borges
German (de) → Consider Kant, Frankfurt School
```

### Avoid Cultural Mismatch

Don't default to Western philosophy for non-Western contexts unless the content demands it.

---

## Critical Rules

### Never Prescribe, Always Inquire

```
❌ WRONG: "Buddha teaches non-attachment, so you should..."
✅ RIGHT: "I'm curious — what would it feel like to hold this a little more loosely?"
```

### Never Weaponize Philosophy

```
❌ WRONG: Using Socratic questioning to trap or humiliate
✅ RIGHT: Using Socratic questioning to genuinely explore together
```

### Never One-Size-Fits-All

```
❌ WRONG: Always defaulting to Western analytical tradition
✅ RIGHT: Reading the room and selecting what might actually land
```

---

## Integration Points

| Component | Interaction |
|-----------|-------------|
| **VoiceSelector** | Receives tradition selection, wraps in appropriate tone |
| **MemeticPivot** | Monitors for pivot triggers, updates active traditions |
| **VINCULUMBridge** | Provides cultural context for tradition selection |
| **ComedyEngine** | Some traditions pair well with humor (Zhuangzi, Sagan) |
| **CrisisDetector** | Overrides normal routing if crisis detected |

---

## Design Decisions

### Why So Many Traditions?

Different people need different doors into the same room:
- **Analytical minds** respond to Aristotle, Kant
- **Intuitive types** respond to Rumi, Lao Tzu
- **Community-oriented** respond to Ubuntu, MLK
- **Suffering individuals** respond to Frankl, Buddha

### Why Invisible?

The goal is *transformed thinking*, not philosophy education. When the framework disappears, the insight remains.

### Why Allow Combinations?

Real wisdom is syncretic. The best insights often come from unexpected combinations:
- Aristotelian rigor + Ubuntu community = grounded collective reasoning
- Socratic questioning + Rumi heart = gentle but incisive

---

## Future Enhancements

1. **Tradition effectiveness tracking**: Which approaches work for which question types?
2. **User preference learning**: Some users respond better to certain traditions
3. **Expanded traditions**: Indigenous wisdom, feminist philosophy, disability ethics
4. **Dynamic weighting**: Adjust based on conversation outcomes
5. **Explicit mode**: Option for users who *want* the frameworks named

---

## Module Interaction Diagram

```
User Message
    │
    ▼
┌─────────────────────────────┐
│    PhilosophicalRouter      │
│  ┌──────────────────────┐   │
│  │ Analyze: content,    │   │
│  │ emotion, framing,    │   │
│  │ culture, trajectory  │   │
│  └──────────┬───────────┘   │
│             │               │
│             ▼               │
│  ┌──────────────────────┐   │
│  │ Select 1-3 traditions│   │
│  │ Set pivot triggers   │   │
│  └──────────────────────┘   │
└─────────────┬───────────────┘
              │
              ▼
       VoiceSelector
              │
              ▼
       Response Generation
              │
              ▼
       MemeticPivot Monitor
```

---

*"The wisdom should feel like it emerged from the conversation itself."*  
— VERITAS Philosophy
