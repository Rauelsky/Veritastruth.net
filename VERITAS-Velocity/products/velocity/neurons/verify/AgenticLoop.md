# NEURON: AgenticLoop

**Version:** 0.1  
**Created:** 2026-01-17  
**Last Modified:** 2026-01-17  
**Status:** Active (verify.js only)  
**Category:** VERIFY  

---

## SOMA (Core Function)

Manages multi-turn web search iterations, allowing Claude to conduct multiple searches within a single assessment. Handles the conversation loop between Claude's tool requests and tool results, accumulating text content across iterations until the model signals completion.

This is the "Socrates with a search engine" implementation — the mechanism that allows the Second Philosopher to actively research rather than rely solely on training data.

---

## DENDRITES (Inputs)

| Receives | From | Data Shape | Required? |
|----------|------|------------|-----------|
| initialPrompt | Prompt Builder | `string` | Yes |
| maxIterations | Configuration | `number` (default: 10) | No |
| anthropic | API Client | `Anthropic` instance | Yes |

---

## AXON TERMINALS (Outputs)

| Sends | To Neuron(s) | Data Shape | Trigger |
|-------|--------------|------------|---------|
| finalTextContent | ResponseParser | `string` (accumulated text) | Loop completion |
| toolUseLog | Diagnostics (future) | `array` of tool calls | Future |

---

## SYNAPTIC CONNECTIONS

- **Upstream:** TrackRouter (via verify.js handler)
- **Downstream:** ResponseParser
- **Lateral:** WebSearcher (Anthropic tool)

---

## CURRENT IMPLEMENTATION

**Location:** `/api/verify.js` (lines 495-570)

### Core Loop Logic
```javascript
async function runAgenticLoop(anthropic, initialPrompt, maxIterations = 10) {
    var messages = [{ role: 'user', content: initialPrompt }];
    var finalTextContent = '';
    var iteration = 0;
    
    while (iteration < maxIterations) {
        iteration++;
        
        var response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 16000,
            tools: [{
                type: 'web_search_20250305',
                name: 'web_search'
            }],
            messages: messages
        });
        
        // Collect text content
        for (var block of response.content) {
            if (block.type === 'text') {
                finalTextContent += block.text;
            }
        }
        
        // Check exit conditions
        if (response.stop_reason === 'end_turn') break;
        if (!response.content.some(b => b.type === 'tool_use')) break;
        
        // Continue conversation with tool results
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });
    }
    
    return finalTextContent;
}
```

### Exit Conditions
1. `stop_reason === 'end_turn'` — Model finished naturally
2. No `tool_use` blocks in response — Model chose not to search
3. `iteration >= maxIterations` — Safety limit reached

### Tool Result Handling
```javascript
// For each tool_use block, acknowledge completion
toolResults.push({
    type: 'tool_result',
    tool_use_id: block.id,
    content: 'Search completed'
});
```

---

## ITERATION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENTIC LOOP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  START                                                           │
│    │                                                             │
│    ▼                                                             │
│  ┌─────────────────┐                                            │
│  │ Send prompt to  │                                            │
│  │ Claude + tools  │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ Response has    │ NO  │ Accumulate text │                   │
│  │ tool_use?       │────▶│ Return result   │──▶ END            │
│  └────────┬────────┘     └─────────────────┘                   │
│           │ YES                                                  │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Accumulate any  │                                            │
│  │ text content    │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Add assistant   │                                            │
│  │ response to     │                                            │
│  │ messages        │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Add tool_result │                                            │
│  │ acknowledgments │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ iteration <     │ NO  │ Return partial  │                   │
│  │ maxIterations?  │────▶│ result + warn   │──▶ END            │
│  └────────┬────────┘     └─────────────────┘                   │
│           │ YES                                                  │
│           │                                                      │
│           └──────────────────────────────────────────┐          │
│                                                       │          │
│  ◀────────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## USAGE COMPARISON

### verify.js (WITH Agentic Loop)
```javascript
// Uses runAgenticLoop for multi-search capability
var assessment = await runAgenticLoop(anthropic, prompt);
```

### assess.js (WITHOUT Agentic Loop)
```javascript
// Single API call — Claude can search, but only one "turn"
message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }]
});
```

### navigate.js (WITHOUT Agentic Loop)
```javascript
// Single API call — simpler guidance flow
const response = await fetch('https://api.anthropic.com/v1/messages', {
    // ... single turn
});
```

---

## DAMAGE REPORT (What Breaks If This Dies)

- **Second Philosopher loses research depth** → Single search instead of iterative
- **Complex claims under-verified** → May miss important updates
- **"Socrates with a search engine" degraded** → Just Socrates

**Severity:** MEDIUM — Affects verification quality, not core functionality

---

## EXTRACTION PLAN (Phase 1)

1. Extract to `/modules/agentic-loop.js`:
   ```javascript
   export async function runAgenticLoop(anthropic, prompt, options = {}) {
       const { maxIterations = 10, tools = defaultTools } = options;
       // ... loop logic
   }
   ```

2. Add to assess.js for Track A (currently single-turn)

3. Add instrumentation:
   - Track number of searches per assessment
   - Log search queries for diagnostics
   - Measure time per iteration

---

## FUTURE ENHANCEMENTS

### Iteration Limits by Complexity
```javascript
const ITERATION_LIMITS = {
    simple: 3,      // Quick verification
    moderate: 5,    // Standard research
    complex: 10,    // Deep investigation
    breaking: 15    // Breaking news (higher limit)
};
```

### Search Quality Tracking
```javascript
// Track what searches were performed
const searchLog = [];
// ... in loop:
if (block.type === 'tool_use' && block.name === 'web_search') {
    searchLog.push({
        iteration,
        query: block.input.query,
        timestamp: Date.now()
    });
}
```

### Streaming Integration (Phase 1 Target)
The agentic loop is a key target for streaming enhancement:
- Emit events as each search completes
- Stream partial text as it accumulates
- Provide real-time search status to frontend

---

## GROWTH HISTORY

| Date | Change | Reason | Synapses Affected |
|------|--------|--------|-------------------|
| 2026-01-17 | Documented | Phase 1 neuron extraction | None (documentation only) |

---

## NOTES

- Only verify.js currently uses the agentic loop
- assess.js could benefit from same pattern (currently single-turn)
- Max iterations of 10 is conservative — could tune based on query type
- Tool result handling is minimal ("Search completed") — could add richer feedback
- No timeout per iteration — long searches could stall the loop
- Consider adding circuit breaker for repeated failed searches
