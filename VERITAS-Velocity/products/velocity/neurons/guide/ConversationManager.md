# ConversationManager Neuron

**Category:** GUIDE  
**Status:** Active  
**Source:** `interview.js:165-200` (OPERATIONAL_RULES), `interview.js:244-339` (handler)  
**Dependencies:** PhilosophicalRouter, VoiceSelector, MemeticPivot, VINCULUMBridge

---

## Purpose

Manages the flow and state of Track B (Interview) conversations — the Invisible Wisdom Engine. The ConversationManager orchestrates multi-turn belief exploration while maintaining context, enforcing conversational mechanics, and coordinating the invisible wisdom infrastructure.

---

## Core Responsibility

Track B is **conversational**, not transactional. Unlike Track A (single assessment) or Track C (guidance session), Track B sustains extended dialogue where the goal is belief exploration, not verdict delivery.

The ConversationManager ensures:
1. Context persists across turns
2. Conversation mechanics follow the rules
3. The invisible infrastructure remains invisible
4. Questions land one at a time

---

## Conversation State Management

### Message Array Structure

```javascript
// From interview.js:260
const { messages, originalQuery, language } = req.body;

// messages = [
//   { role: 'user', content: 'I think the media is biased against...' },
//   { role: 'assistant', content: 'That's an interesting perspective...' },
//   { role: 'user', content: 'Well, I saw this article that...' },
//   ...
// ]
```

### Context Injection

```javascript
// From interview.js:283-285
if (originalQuery) {
    systemPrompt += `\n\nCONTEXT: The user started this conversation 
    with the following belief or claim they want to explore: "${originalQuery}"`;
}
```

The original query is preserved and injected so Claude never loses sight of what the conversation is actually about, even 10 turns in.

---

## Operational Rules

These rules from the system prompt define conversation mechanics:

### Single Question Rule

```
"Ask ONE question at a time — never overwhelm"
```

This is critical. Multiple questions:
- Fragment attention
- Let users dodge the hard one
- Feel like interrogation

One clear question creates space for real reflection.

### Response Length

```
"Keep responses concise (2-4 paragraphs typical)"
```

Track B is dialogue, not monologue. Long responses:
- Break conversational rhythm
- Feel like lectures
- Reduce user engagement

### Response Structure

```
"End most responses with a single, clear question"
```

Pattern:
```
[Acknowledge their perspective]
[Brief insight or observation]
[Single clear question]
```

### Key Questions Bank

The ConversationManager has these questions available:

| Question | Purpose |
|----------|---------|
| "What led you to this view?" | Origin exploration |
| "What would change your mind?" | Falsifiability probe |
| "How confident are you, 1-10?" | Certainty calibration |
| "Where did you first hear this?" | Source examination |
| "Who do you trust on this, and why?" | Authority exploration |
| "What's the strongest argument against your position?" | Steel-manning |

---

## The Invisible Mandate

This is the ConversationManager's most important constraint:

```
"Everything above — the wisdom traditions, the voice selection, 
the comedy, the pivoting — happens SILENTLY. The person experiences 
warmth, insight, genuine connection. They never feel analyzed, 
managed, or guided through a system."
```

### What Users Experience

```
✓ Warmth and genuine interest
✓ Questions that make them think
✓ Insights that surprise them
✓ A conversation that flows naturally
```

### What Users Never See

```
✗ "I'm using Socratic method here..."
✗ "Drawing from Taoist philosophy..."
✗ "Switching to Kitchen voice..."
✗ "Deploying memetic pivot..."
```

---

## Multi-Turn Flow Management

### Turn Structure

```
Turn 1: User shares belief → Assistant explores origin
Turn 2: User explains origin → Assistant probes confidence
Turn 3: User states confidence → Assistant invites steel-man
Turn 4: User attempts counter → Assistant deepens inquiry
...
Turn N: Natural conclusion or redirect to Track A/C
```

### Flow Coordination with Other Neurons

```
User Turn
    │
    ▼
┌─────────────────────────┐
│   ConversationManager   │
│   (orchestrator)        │
└───────────┬─────────────┘
            │
    ┌───────┼───────┬───────────┐
    ▼       ▼       ▼           ▼
┌───────┐ ┌───────┐ ┌─────────┐ ┌──────────┐
│Philos.│ │Voice  │ │Comedy   │ │Memetic   │
│Router │ │Select │ │Engine   │ │Pivot     │
└───────┘ └───────┘ └─────────┘ └──────────┘
    │       │           │           │
    └───────┴─────┬─────┴───────────┘
                  │
                  ▼
           Assistant Turn
           (unified response)
```

---

## What the Manager NEVER Does

From OPERATIONAL_RULES:

| Prohibited | Why |
|------------|-----|
| Tell people they're wrong | Shuts down exploration |
| Share opinion on contested topics | Biases the inquiry |
| Make anyone feel stupid | Destroys trust |
| Lecture or explain at length | Kills dialogue |
| Assume you know better | Arrogance blocks insight |
| Make claims without verification | Erodes credibility |
| Name the frameworks being used | Breaks the spell |

---

## Web Search Integration

```javascript
// From interview.js:299-305
tools: [
    {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5
    }
]
```

The ConversationManager enables web search because:
- Factual claims need verification
- "I heard that X" can be checked
- Temporal verification is required for current events
- Credibility depends on accuracy

---

## VINCULUM Integration

```javascript
// From interview.js:277-281
const languageInstruction = buildLanguageInstruction(language || 'en');
if (languageInstruction) {
    systemPrompt += languageInstruction;
}
```

The conversation flows in the user's language:
- Not translated — *lived*
- Cultural touchstones shift
- The Garage/Gala/Kitchen feel different
- Questions land differently across cultures

---

## Response Processing

```javascript
// From interview.js:320-326
let textContent = '';
for (const block of data.content) {
    if (block.type === 'text') {
        textContent += block.text;
    }
}
```

The handler:
1. Receives Claude's response (may include tool use)
2. Extracts text content blocks
3. Returns clean text to frontend
4. Preserves usage metrics

---

## System Prompt Assembly

The ConversationManager assembles the full system prompt from modular sections:

```javascript
// From interview.js:203-210
const SYSTEM_PROMPT = [
    CORE_IDENTITY,           // Who VERITAS is
    PHILOSOPHERS_ROUNDTABLE, // Wisdom traditions available
    VOICE_FRAMEWORKS,        // Garage/Gala/Kitchen
    COMEDY_INTEGRATION,      // Humor principles
    MEMETIC_PIVOTING,        // Framework shifting
    OPERATIONAL_RULES        // Conversation mechanics
].join('\n\n');
```

This modular architecture allows:
- Safe editing of individual sections
- Clear separation of concerns
- Easy addition of new modules
- Documentation per section

---

## Error Handling

```javascript
// From interview.js:336-338
} catch (error) {
    console.error('Interview API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
}
```

Current error handling is basic. Future enhancements:
- Graceful degradation (partial response)
- Retry logic for transient failures
- User-friendly error messages
- State preservation on error

---

## Session Management

Currently **stateless** — each request includes full message history.

### Current Pattern

```
Client                          Server
  │                               │
  ├──[messages: [...]]──────────►│
  │                               │ Process
  │◄──[response]──────────────────┤
  │                               │
  ├──[messages: [..., new]]─────►│
  │                               │ Process
  │◄──[response]──────────────────┤
```

### Future Enhancement: Server-Side State

```
Client                          Server
  │                               │
  ├──[sessionId, newMessage]────►│
  │                               │ Load state
  │                               │ Append message
  │                               │ Process
  │                               │ Save state
  │◄──[response]──────────────────┤
```

Benefits:
- Reduced payload size
- Conversation analytics
- Resume interrupted sessions

---

## Quality Metrics

What makes a well-managed conversation:

| Metric | Target |
|--------|--------|
| Questions per response | 1 (rarely 0 or 2) |
| Response length | 2-4 paragraphs |
| Framework visibility | 0 (invisible) |
| User engagement | Continues willingly |
| Insight moments | At least 1 per 3 turns |

---

## Integration Points

| Component | Interaction |
|-----------|-------------|
| **PhilosophicalRouter** | Selects wisdom tradition for turn |
| **VoiceSelector** | Determines Garage/Gala/Kitchen style |
| **ComedyEngine** | Provides humor when appropriate |
| **MemeticPivot** | Shifts framework mid-conversation |
| **VINCULUMBridge** | Cultural/language adaptation |
| **WebSearcher** | Fact verification during conversation |

---

## Design Philosophy

### Why Conversation Over Assessment?

```
ASSESSMENT:   "Here's what's true about your belief"
CONVERSATION: "Let's explore what you believe and why"

Assessment delivers verdict.
Conversation builds capability.

Track A tells you what to think about a claim.
Track B teaches you how to think about your thinking.
```

### Why One Question?

```
Multiple questions:
"What led you here? And who told you that? 
 Have you considered the counter-evidence?"

Effect: Overwhelm, defensive retreat, pick easiest one

Single question:
"What would have to be true for you to change your mind?"

Effect: Space to think, genuine reflection, insight possible
```

---

## Future Enhancements

1. **Session Persistence**: Server-side state management
2. **Conversation Analytics**: Track engagement patterns
3. **Dynamic Voice Shifting**: More sophisticated voice selection
4. **Graceful Exits**: Detect natural endpoints
5. **Track Transitions**: Smooth handoff to Track A or C when appropriate

---

*"They just feel heard, and they leave thinking more clearly than when they arrived."*  
— VERITAS Interview Philosophy
