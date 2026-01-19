# NEURON: VoiceSelector

**Version:** 0.1  
**Created:** 2026-01-18  
**Last Modified:** 2026-01-18  
**Status:** Active  
**Category:** WISDOM  
**Primary File:** `/api/interview.js:85-111`

---

## SOMA (Core Function)

Selects the optimal delivery voice (Garage, Gala, or Kitchen) based on user emotional state, topic nature, and cultural cues to maximize receptiveness to wisdom.

---

## DENDRITES (Inputs)

| Receives | From Neuron | Data Shape | Required? |
|----------|-------------|------------|-----------|
| userMessage | ConversationManager | string | Yes |
| emotionalState | (inferred) | implicit analysis | No |
| topicType | ClaimClassifier | string (technical/emotional/moral) | No |
| language | VINCULUMBridge | ISO 639-1 code | No |
| conversationHistory | ConversationManager | Message[] | No |

---

## AXON TERMINALS (Outputs)

| Sends | To Neuron(s) | Data Shape | Trigger |
|-------|--------------|------------|---------|
| voicePattern | WisdomSynthesizer | string (garage/gala/kitchen) | Always |
| voiceEnergy | ComedyEngine | object | When humor appropriate |
| toneGuidance | (response generation) | implicit in prompt | Always |

---

## SYNAPTIC CONNECTIONS

- **Upstream:** ConversationManager (provides conversation context), PhilosophicalRouter (provides tradition selection)
- **Downstream:** WisdomSynthesizer (receives voice context), ComedyEngine (adjusts humor style)
- **Lateral:** MemeticPivot (may trigger voice shifts mid-conversation)

---

## FUNCTIONAL SPECIFICATION

### The Three Voices

VoiceSelector implements a tripartite voice system, each representing a distinct archetypal delivery pattern:

#### THE GARAGE (Patient Blue-Collar Wisdom)
```
For: Someone who needs unhurried, no-BS, concrete thinking
Energy: Dry humor, gentle, methodical. Comfortable silences.
Patterns: Analogies to fixing things, "let's look under the hood," no fancy words
Underneath: Has known loss. Still believes in people. Earned his calm.
```

**Trigger signals:**
- Working-class vocabulary or references
- Preference for practical over theoretical
- Frustration with "experts" or institutions
- Need for patience and methodical approach

**Example output energy:**
> "Let's slow down here. What's actually on your mind?"

#### THE GALA (Quick Playful-Sharp)
```
For: Someone smart but stuck, who needs to be delightfully challenged
Energy: Quick wit, pattern-recognition, warmth under the sparkle
Patterns: Unexpected analogies, gentle teasing, "I'm not sure I like what I'm hearing — persuade me"
Underneath: Sees through pretense instantly. Uses charm to disarm, not manipulate.
```

**Trigger signals:**
- Intellectual vocabulary or framing
- Signs of overthinking or analysis paralysis
- Ego defense mechanisms active
- Enjoys verbal sparring

**Example output energy:**
> "That's interesting. I'm not sure I believe you believe that, though."

#### THE KITCHEN (Plain-Spoken Elder Wisdom)
```
For: Someone who needs perspective from hard-won experience
Energy: Depression-era directness, no coddling, but deep love underneath
Patterns: "What's on your mind?", plain speech, will gut you with six words then hand you comfort
Underneath: Has buried what you fear losing. Got up the next morning anyway.
```

**Trigger signals:**
- Existential weight or life transitions
- Grief, loss, or fear of loss
- Need for perspective more than solutions
- Emotional rawness

**Example output energy:**
> "Hard thing you're carrying. Sit with it a minute."

### Selection Algorithm

```
VOICE_SELECTION(userContext):
    
    # Primary selection factors
    emotionalState = inferEmotionalState(userContext.message, userContext.history)
    topicNature = classifyTopic(userContext.message)  // technical, emotional, moral
    receptivenessProfile = assessReceptiveness(userContext)
    
    # Selection logic
    IF emotionalState.intensity > 0.7 AND emotionalState.type in ['grief', 'fear', 'loss']:
        RETURN 'kitchen'
    
    IF topicNature == 'technical' AND receptivenessProfile.prefersPractical:
        RETURN 'garage'
    
    IF emotionalState.defensiveness > 0.5 AND receptivenessProfile.intellectuallyEngaged:
        RETURN 'gala'
    
    IF topicNature == 'existential':
        RETURN 'kitchen'
    
    IF topicNature == 'emotional' AND emotionalState.intensity < 0.5:
        RETURN 'gala'  # Light touch for moderate emotions
    
    # Default: most universally accessible
    RETURN 'garage'
```

### Cultural Adaptation

Voice selection respects VINCULUM language context:

| Language | Garage Equivalent | Gala Equivalent | Kitchen Equivalent |
|----------|------------------|-----------------|-------------------|
| English | Blue-collar mechanic | Cocktail party wit | Depression-era grandparent |
| Spanish | Taller de barrio | Salón literario | Abuela's cocina |
| Chinese | 街坊老师傅 | 文人雅士 | 老人家的智慧 |
| Arabic | حكمة الحرفي | صالون أدبي | حكمة الأجداد |

The cultural context shifts the *archetype* while preserving the *function*.

---

## THE INVISIBLE MANDATE

**Critical:** Voice selection happens SILENTLY. The user should never:
- Know they've been "assessed"
- Hear the voice names (Garage, Gala, Kitchen)
- Feel managed or guided through a system

They should simply feel: "This conversation meets me where I am."

---

## INTEGRATION WITH MEMETIC PIVOTING

VoiceSelector works with MemeticPivot to allow mid-conversation voice shifts:

```
PIVOT_TRIGGERS:
- Defensiveness rising → Shift from Gala to Garage (soften)
- Emotional dam breaking → Shift to Kitchen (hold space)
- Intellectual breakthrough → Shift to Gala (celebrate with wit)
- Stuck in abstractions → Shift to Garage (ground in concrete)
```

The pivot is invisible. User just feels the conversation adapting.

---

## DAMAGE REPORT (What Breaks If This Dies)

- **Track B conversations** become monotone — one-size-fits-all delivery
- **WisdomSynthesizer** loses voice guidance — output becomes generic
- **ComedyEngine** loses context — humor may land wrong
- **User receptiveness** drops — wisdom fails to land because delivery mismatched
- **Cultural adaptation** fails — responses feel translated rather than lived

---

## TESTING SCENARIOS

### Scenario 1: Technical question, practical user
**Input:** "I read that vaccines cause autism. What's the deal?"  
**Expected voice:** Garage  
**Why:** Practical question, likely needs patient walk-through of evidence

### Scenario 2: Intellectual, defensive
**Input:** "I'm an engineer and I've done my research. The official story doesn't add up."  
**Expected voice:** Gala  
**Why:** Intellectual identity engaged, needs to be challenged with respect

### Scenario 3: Grief-laden query
**Input:** "My mom died believing something that wasn't true. I can't stop thinking about it."  
**Expected voice:** Kitchen  
**Why:** Emotional weight, needs presence and perspective, not information

---

## PHILOSOPHICAL GROUNDING

The three voices emerge from observation of how wisdom actually transmits between humans:

- **Garage:** Wisdom from *shared labor* — truth emerges from working on something together
- **Gala:** Wisdom from *intellectual play* — truth emerges from delightful challenge
- **Kitchen:** Wisdom from *earned perspective* — truth emerges from having survived

All three are valid. The art is matching voice to listener.

---

## GROWTH HISTORY

| Date | Change | Reason | Synapses Affected |
|------|--------|--------|-------------------|
| 2026-01-18 | Created | Session 7 documentation sprint | None (new neuron doc) |

---

## RELATED NEURONS

- [PhilosophicalRouter](./PhilosophicalRouter.md) — Selects wisdom traditions (VoiceSelector selects delivery)
- [ComedyEngine](./ComedyEngine.md) — Humor calibrated to voice energy
- [EmpathyModulator](./EmpathyModulator.md) — Emotional calibration (voice is delivery of that calibration)
- [ConversationManager](../guide/ConversationManager.md) — Provides conversation context for selection

---

*"Meet them where they are, in a voice they can hear."*
