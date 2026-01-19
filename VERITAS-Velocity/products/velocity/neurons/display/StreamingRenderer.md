# StreamingRenderer Design Specification

**Category:** DISPLAY  
**Status:** Design Phase (Phase 1 Target)  
**Priority:** HIGH — Critical for time-to-first-content UX  
**Dependencies:** All track APIs, VINCULUMBridge

---

## Problem Statement

Current VERITAS API endpoints use single-turn request/response:
1. User submits query
2. 15-60 seconds of waiting (full Claude response)
3. Complete assessment appears at once

This creates poor UX:
- Users don't know if system is working
- Long perceived wait times
- No progressive feedback
- Higher abandonment rates

---

## Proposed Solution

Implement **Server-Sent Events (SSE)** streaming across all tracks:
- Stream partial results as they're generated
- Progressive UI rendering
- Time-to-first-content under 2 seconds
- Graceful error recovery mid-stream

---

## Architecture Overview

```
┌──────────┐     SSE Stream      ┌──────────────┐
│  Client  │◄───────────────────│   API Route  │
│  (HTML)  │    event: chunk    │  (Vercel)    │
└────┬─────┘    data: {...}     └──────┬───────┘
     │                                  │
     │         ┌────────────────────────┘
     │         │
     │         ▼
     │    ┌─────────────────┐     Stream      ┌──────────┐
     │    │ StreamingRenderer│◄──────────────│  Claude  │
     │    │    (module)     │   delta text   │   API    │
     │    └────────┬────────┘                └──────────┘
     │             │
     │    Parse & Transform
     │             │
     │             ▼
     └────── Progressive UI
```

---

## Event Types

### 1. `status` — Progress Updates
```javascript
event: status
data: {"phase": "searching", "message": "Searching for evidence...", "progress": 0.2}
```

### 2. `chunk` — Incremental Content
```javascript
event: chunk
data: {"type": "reality", "partial": "Based on the evidence reviewed...", "complete": false}
```

### 3. `section` — Complete Section
```javascript
event: section
data: {"name": "underlyingReality", "content": {...}, "final": true}
```

### 4. `score` — Score Updates
```javascript
event: score
data: {"realityScore": 7, "integrityScore": 0.6, "provisional": false}
```

### 5. `error` — Error Notifications
```javascript
event: error
data: {"code": "RATE_LIMIT", "message": "Please wait...", "retryAfter": 30}
```

### 6. `complete` — Stream End
```javascript
event: complete
data: {"success": true, "totalTokens": 2847, "duration": 12.4}
```

---

## Implementation Plan

### Phase 1: Basic Streaming (2 sessions)

**Session A: Backend Infrastructure**
```javascript
// api/assess-stream.js (new endpoint)

export default async function handler(req, res) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Enable streaming from Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { ... },
        body: JSON.stringify({
            ...payload,
            stream: true  // Enable streaming
        })
    });
    
    // Process stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // Parse and forward to client
        res.write(`data: ${JSON.stringify(parsed)}\n\n`);
    }
    
    res.write('event: complete\ndata: {"success": true}\n\n');
    res.end();
}
```

**Session B: Client-Side Handler**
```javascript
// Client-side SSE consumer

function streamAssessment(query) {
    const eventSource = new EventSource(`/api/assess-stream?q=${encodeURIComponent(query)}`);
    
    eventSource.addEventListener('status', (e) => {
        const data = JSON.parse(e.data);
        updateProgressBar(data.progress);
        showStatusMessage(data.message);
    });
    
    eventSource.addEventListener('chunk', (e) => {
        const data = JSON.parse(e.data);
        appendToSection(data.type, data.partial);
    });
    
    eventSource.addEventListener('section', (e) => {
        const data = JSON.parse(e.data);
        renderSection(data.name, data.content);
    });
    
    eventSource.addEventListener('score', (e) => {
        const data = JSON.parse(e.data);
        updateScoreDisplay(data.realityScore, data.integrityScore);
    });
    
    eventSource.addEventListener('complete', () => {
        eventSource.close();
        hideLoadingState();
    });
    
    eventSource.onerror = (e) => {
        console.error('Stream error:', e);
        eventSource.close();
        showErrorState();
    };
}
```

### Phase 2: Progressive Parsing (2 sessions)

**Challenge**: Claude outputs JSON, but JSON isn't valid until complete.

**Solution**: Stream-friendly output format + incremental parsing.

```javascript
// StreamParser module

class StreamParser {
    constructor() {
        this.buffer = '';
        this.sections = {};
    }
    
    // Process incoming chunk
    process(chunk) {
        this.buffer += chunk;
        const events = [];
        
        // Extract complete sections using markers
        const sectionMatch = this.buffer.match(/▸▸▸(\w+)▸▸▸([\s\S]*?)◂◂◂\1◂◂◂/);
        if (sectionMatch) {
            const [full, name, content] = sectionMatch;
            this.sections[name] = content;
            this.buffer = this.buffer.replace(full, '');
            events.push({ type: 'section', name, content: this.parseContent(content) });
        }
        
        // Extract scores (appear early in output)
        const scoreMatch = this.buffer.match(/"realityScore":\s*(-?\d+)/);
        if (scoreMatch && !this.scoreSent) {
            events.push({ type: 'score', realityScore: parseInt(scoreMatch[1]), provisional: true });
            this.scoreSent = true;
        }
        
        return events;
    }
}
```

### Phase 3: Track-Specific Adapters (2 sessions)

Each track has different output structures:

**Track A (Assess)**
- Priority: underlyingReality → scores → integrity → evidence
- Early reveal: Reality score can appear quickly

**Track B (Interview)**  
- Priority: Opening engagement → philosopher selection → deeper questions
- Conversational flow matters

**Track C (Navigate)**
- Priority: Empathy first → crisis check → practical steps
- Crisis detection must not be delayed

```javascript
// Track-specific stream adapters

const TRACK_ADAPTERS = {
    assess: {
        prioritySections: ['underlyingReality', 'realityScore', 'integrityScore'],
        streamOrder: ['status', 'coreFinding', 'scores', 'fullAnalysis']
    },
    interview: {
        prioritySections: ['greeting', 'philosopherSelection'],
        streamOrder: ['opening', 'exploration', 'synthesis']
    },
    navigate: {
        prioritySections: ['empathyAcknowledgment', 'crisisCheck'],
        streamOrder: ['validation', 'framework', 'nextSteps']
    }
};
```

### Phase 4: Reconnection & Recovery (1 session)

```javascript
// Resilient SSE connection

class ResilientEventSource {
    constructor(url, options = {}) {
        this.url = url;
        this.lastEventId = null;
        this.reconnectDelay = options.reconnectDelay || 1000;
        this.maxRetries = options.maxRetries || 3;
        this.retryCount = 0;
    }
    
    connect() {
        const url = this.lastEventId 
            ? `${this.url}&lastEventId=${this.lastEventId}`
            : this.url;
            
        this.eventSource = new EventSource(url);
        
        this.eventSource.onmessage = (e) => {
            this.lastEventId = e.lastEventId;
            this.retryCount = 0;
            // ... handle event
        };
        
        this.eventSource.onerror = () => {
            this.eventSource.close();
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.connect(), this.reconnectDelay * this.retryCount);
            }
        };
    }
}
```

---

## UI Components

### ProgressiveAssessment Component

```jsx
function ProgressiveAssessment({ streamUrl }) {
    const [status, setStatus] = useState({ phase: 'connecting', progress: 0 });
    const [sections, setSections] = useState({});
    const [scores, setScores] = useState({ reality: null, integrity: null });
    
    return (
        <div className="assessment-container">
            {/* Always visible: Progress indicator */}
            <ProgressBar phase={status.phase} progress={status.progress} />
            
            {/* Early reveal: Scores (even provisional) */}
            {scores.reality !== null && (
                <ScoreDisplay 
                    reality={scores.reality} 
                    integrity={scores.integrity}
                    provisional={!sections.complete}
                />
            )}
            
            {/* Progressive sections */}
            {sections.underlyingReality && (
                <Section title="What's Actually True" content={sections.underlyingReality} />
            )}
            
            {sections.frameworkAnalysis && (
                <Section title="Framework Analysis" content={sections.frameworkAnalysis} />
            )}
            
            {/* Skeleton placeholders for pending sections */}
            {!sections.evidenceAnalysis && status.phase !== 'complete' && (
                <SectionSkeleton title="Evidence Analysis" />
            )}
        </div>
    );
}
```

### Skeleton Loading States

```css
.section-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Time to first content | < 2s | N/A (no streaming) |
| Score display | < 5s | ~20s |
| Full assessment | < 30s | 15-60s |
| Perceived wait time | "Fast" | "Slow" |

---

## Migration Path

1. **New endpoints**: Create `/api/assess-stream`, `/api/interview-stream`, etc.
2. **Feature flag**: `useStreaming` toggle in frontend
3. **Gradual rollout**: 10% → 50% → 100%
4. **Deprecation**: Remove non-streaming endpoints after validation

---

## VINCULUM Integration

Streaming must respect language settings:

```javascript
// Stream with VINCULUM awareness

function streamWithLanguage(response, language) {
    // Status messages in user's language
    const statusMessages = {
        en: { searching: 'Searching for evidence...', analyzing: 'Analyzing claim...' },
        es: { searching: 'Buscando evidencia...', analyzing: 'Analizando afirmación...' },
        // ... other languages
    };
    
    emitStatus(statusMessages[language]?.searching || statusMessages.en.searching);
}
```

---

## Error Handling

| Error Type | User Message | Recovery |
|------------|--------------|----------|
| Network drop | "Connection lost. Reconnecting..." | Auto-reconnect |
| Rate limit | "Please wait {n} seconds" | Countdown, auto-retry |
| API error | "Something went wrong" | Show partial results if available |
| Timeout | "Taking longer than expected" | Offer to continue waiting |

---

## Files to Create

```
/velocity/modules/
├── streaming/
│   ├── StreamParser.js      # Incremental parsing logic
│   ├── EventEmitter.js      # SSE event formatting
│   ├── TrackAdapters.js     # Track-specific streaming config
│   └── index.js             # Module exports

/velocity/api/
├── assess-stream.js         # Streaming assess endpoint
├── interview-stream.js      # Streaming interview endpoint
├── navigate-stream.js       # Streaming navigate endpoint
└── verify-stream.js         # Streaming verify endpoint
```

---

## Session Estimate

| Phase | Sessions | Description |
|-------|----------|-------------|
| Phase 1 | 2 | Basic SSE infrastructure |
| Phase 2 | 2 | Progressive parsing |
| Phase 3 | 2 | Track-specific adapters |
| Phase 4 | 1 | Recovery & resilience |
| **Total** | **7** | Full streaming implementation |

---

## Success Criteria

- [ ] Time-to-first-content under 2 seconds
- [ ] Score visible within 5 seconds
- [ ] Graceful degradation on connection loss
- [ ] No data loss during reconnection
- [ ] Works in all 14 VINCULUM languages
- [ ] Mobile-friendly (handles poor connections)

---

*"Water that flows over rocks and wears them down."*  
— VINCULUM Philosophy (applies to UX too)
