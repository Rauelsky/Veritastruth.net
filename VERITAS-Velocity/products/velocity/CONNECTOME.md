# VERITAS VELOCITY — CONNECTOME

**Version:** 0.7  
**Last Updated:** 2026-01-19 (Session 8)  
**Status:** Phase 1 - Foundation (70% Complete — Streaming Integrated)  

---

## Overview

This document maps all neurons in the VERITAS Velocity architecture, their connections, and the signal flow between them. It serves as the master reference for understanding how information moves through the system.

---

## Signal Flow Diagram

```
USER INPUT
    │
    ▼
┌──────────────────┐
│ UserQueryParser  │ [INGEST] ✅ Documented
│   Entry Point    │
└────────┬─────────┘
         │ parsedQuery, language
         ▼
┌──────────────────┐      ┌──────────────────┐
│ ClaimClassifier  │─────▶│ ComplexityRouter │ [GUIDE]
│  [ANALYZE] ✅    │      │   (Phase 2)      │
└────────┬─────────┘      └────────┬─────────┘
         │ classification          │ route
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│   TrackRouter    │◀─────│  Simple → Haiku  │
│  [GUIDE] ✅      │      │ Complex → Sonnet │
└────────┬─────────┘      └──────────────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
Track A   Track B      Track C
    │         │            │
    ▼         ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐
│assess  │ │interview│ │navigate│
│ .js    │ │  .js   │ │  .js   │
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    ▼          ▼          ▼
┌──────────────┴───────────────────────────┐
│         WebSearcher [VERIFY]             │
│      (web_search_20250305 tool)          │
└────────────────┬─────────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │   AgenticLoop    │ [VERIFY] ✅ Documented
         │  (verify.js)     │ (multi-search iteration)
         └────────┬─────────┘
                  │
    ┌─────────────┴─────────────┐
    ▼                           ▼
┌──────────────────┐  ┌──────────────────┐
│ RealityProfiler  │  │IntegrityProfiler │
│  [ANALYZE] ✅    │  │  [ANALYZE] ✅    │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
         ┌──────────────────┐
         │WisdomSynthesizer │ [WISDOM] ✅ Documented
         │ (plain-truth.js) │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │StreamingRenderer │ [DISPLAY] (Design Spec)
         │   (Phase 1)      │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  VINCULUMBridge  │ [DISPLAY] ✅ Documented
         │   Translation    │
         └────────┬─────────┘
                  │
                  ▼
            USER SEES RESULTS
```

---

## Track B (Interview) Flow

```
User enters Track B
    │
    ▼
┌──────────────────┐
│PhilosophicalRouter│ [WISDOM] ✅ Documented
│ (invisible)       │ Selects wisdom traditions
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  VoiceSelector   │ [WISDOM] 
│ Garage/Gala/     │ Picks delivery style
│ Kitchen          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  ComedyEngine    │ [WISDOM] ✅ Documented
│ (when appropriate)│ Bewildered reasonableness
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  MemeticPivot    │ [WISDOM]
│ (monitors flow)  │ Shifts traditions as needed
└────────┬─────────┘
         │
         ▼
    Conversational Response
```

---

## Neuron Registry

### INGEST (How information enters)

| Neuron | Status | Location | Documented |
|--------|--------|----------|------------|
| **UserQueryParser** | Legacy | `/api/assess.js:10-79` | ✅ |
| ClaimExtractor | Planned | — | ❌ |
| SourceScraper | Planned | — | ❌ |
| FeedMonitor | Planned (VENOM/VITAL) | — | ❌ |
| DocumentProcessor | Planned | — | ❌ |
| TemporalDetector | Planned | — | ❌ |

### ANALYZE (How information gets evaluated)

| Neuron | Status | Location | Documented |
|--------|--------|----------|------------|
| **ClaimClassifier** | Legacy | `/api/assess.js:109-162` | ✅ |
| **RealityProfiler** | Legacy | `/api/assess.js:330-600` | ✅ |
| **IntegrityProfiler** | Legacy | `/api/assess.js:377-556` | ✅ |
| BiasDetector | Embedded | `/api/assess.js` (in prompt) | ❌ |
| PatternMatcher | Planned (VENOM) | — | ❌ |
| TrendAnalyzer | Planned (VENOM/VITAL) | — | ❌ |
| ArgumentMapper | Planned (VALOR) | — | ❌ |

### VERIFY (How claims get checked)

| Neuron | Status | Location | Documented |
|--------|--------|----------|------------|
| WebSearcher | Active | Anthropic tool | ❌ |
| **AgenticLoop** | Active | `/api/verify.js:495-570` | ✅ |
| **Adjudicator** | Active | `/api/adjudicate.js` | ❌ **Track A' — Third Philosopher** |
| **Amplifier** | Active | `/api/amplify.js` | ❌ **Track A' — Epistemic stress-test** |
| SourceCredibility | Embedded | Prompt logic | ❌ |
| ConsensusChecker | Embedded | Prompt logic | ❌ |
| TemporalVerifier | Embedded | Prompt logic | ❌ |
| CrossReferencer | Planned | — | ❌ |

### WISDOM (The invisible wisdom engine)

| Neuron | Status | Location | Documented |
|--------|--------|----------|------------|
| **PhilosophicalRouter** | Embedded | `/api/interview.js:46-83` | ✅ |
| **WisdomSynthesizer** | Legacy | `/api/plain-truth.js` | ✅ |
| **ComedyEngine** | Embedded | `/api/interview.js:114-139` | ✅ |
| **EmpathyModulator** | Embedded | `/api/navigate.js:134-180` | ✅ (Session 6) |
| **VoiceSelector** | Embedded | `/api/interview.js:85-111` | ✅ (Session 7) |
| BridgeBuilder | Planned (VALOR) | — | ❌ |
| **HistoricalContextualizer** | Embedded | `/api/plain-truth.js:90-101` | ✅ (Session 6) |

### GUIDE (How users get helped)

| Neuron | Status | Location | Documented |
|--------|--------|----------|------------|
| **TrackRouter** | Legacy | `/api/assess.js:1204-1218` | ✅ |
| ComplexityRouter | Planned (Phase 2) | — | ❌ |
| **ConversationManager** | Legacy | `/api/interview.js:165-200, 244-339` | ✅ (Session 6) |
| **CrisisDetector** | Legacy | `/api/navigate.js:182-207` | ✅ |
| ActionRecommender | Planned (VALOR) | — | ❌ |
| ProgressTracker | Planned (VALOR) | — | ❌ |
| **ResourceLinker** | Legacy | `/api/navigate.js:22-131, 196-207` | ✅ (Session 7) |

### DISPLAY (How results get presented)

| Neuron | Status | Location | Documented |
|--------|--------|----------|------------|
| **StreamingRenderer** | Design Spec | `/neurons/display/StreamingRenderer.md` | ✅ (spec + Phase 1) |
| ProfileVisualizer | Legacy | Frontend HTML | ❌ |
| ConfidenceDisplay | Legacy | Frontend HTML | ❌ |
| SourceCitation | Embedded | Prompt logic | ❌ |
| ExportEngine | Planned | — | ❌ |
| DigestFormatter | Planned (VITAL) | — | ❌ |
| AlertRenderer | Planned (VENOM) | — | ❌ |
| **VINCULUMBridge** | **EXTRACTED** | `/modules/vinculum.js` | ✅ |

### FEATURES (Supporting content generators)

| Neuron | Status | Location | Documented |
|--------|--------|----------|------------|
| FactoidGenerator | Active | `/api/factoids-api.js` | ❌ **"Dinner party brilliance"** |
| MicrodiscoveryEngine | Active | `/api/microdiscovery-api.js` | ❌ **"Numbers with stories"** |

---

## Synapse Count

| Category | Documented | Total | Coverage |
|----------|------------|-------|----------|
| INGEST | 1 | 6 | 17% |
| ANALYZE | 3 | 7 | 43% |
| VERIFY | 1 | 8 | 13% |
| WISDOM | 6 | 7 | 86% |
| GUIDE | 4 | 7 | 57% |
| DISPLAY | 2 | 8 | 25% |
| FEATURES | 0 | 2 | 0% |
| **TOTAL** | **17** | **45** | **38%** |

---

## Complete API Inventory

**CRITICAL: This section ensures no scope shrinkage. All API files must be accounted for.**

### Core Assessment Pipeline (Primary Focus)

| File | Lines | Purpose | Neurons Documented |
|------|-------|---------|-------------------|
| `assess.js` | 1,332 | Track A — Initial assessment | UserQueryParser ✅, ClaimClassifier ✅, RealityProfiler ✅, IntegrityProfiler ✅, TrackRouter ✅ |
| `verify.js` | 668 | Track A' — Second Philosopher verification | AgenticLoop ✅ |
| `adjudicate.js` | 412 | Track A' — Third Philosopher arbitration | ❌ **Adjudicator neuron needed** |
| `amplify.js` | 193 | Track A' — Epistemic stress-testing | ❌ **Amplifier neuron needed** |
| `interview.js` | 341 | Track B — Belief exploration | PhilosophicalRouter ✅, ComedyEngine ✅, ConversationManager ✅ |
| `navigate.js` | 352 | Track C — Empathetic guidance | EmpathyModulator ✅, CrisisDetector ✅ |
| `plain-truth.js` | 203 | Plain Truth generation | WisdomSynthesizer ✅, HistoricalContextualizer ✅ |

### Supporting APIs (Features)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `factoids-api.js` | ~300 | Dynamic factoid generation — "dinner party brilliance" | ❌ Document as FactoidGenerator |
| `microdiscovery-api.js` | ~300 | Numbers with stories — educational content | ❌ Document as MicrodiscoveryEngine |
| `claude.js` | ~50 | API proxy wrapper | ⚪ Utility — no neuron needed |

### Streaming APIs (New in Velocity)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `assess-stream.js` | ~250 | SSE streaming for Track A | ✅ Created Session 6 |
| `interview-stream.js` | — | SSE streaming for Track B | 🎯 Phase 1 target |
| `navigate-stream.js` | — | SSE streaming for Track C | 🎯 Phase 1 target |
| `verify-stream.js` | — | SSE streaming for Track A' | 🎯 Phase 1 target |

### Track A' (Assess+Verify+Amplify) Full Pipeline

```
User Query
    │
    ▼
┌─────────────────┐
│    assess.js    │ ─── First Philosopher (Initial Assessment)
│   Track A       │     Reality Profile + Integrity Profile
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    verify.js    │ ─── Second Philosopher (Fresh Research)
│   Track A'      │     AgenticLoop with web search
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  adjudicate.js  │ ─── Third Philosopher (Arbitration)
│   Track A'      │     Weighs both, determines winner
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   amplify.js    │ ─── Epistemic Stress Test
│   Track A'      │     Challenges assumptions, finds blind spots
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ plain-truth.js  │ ─── Wisdom Synthesis
│   WISDOM        │     6,000 years meets this moment
└─────────────────┘
```

---

## Phase 1 Priority Neurons

| Priority | Neuron | Category | Status |
|----------|--------|----------|--------|
| 1 | UserQueryParser | INGEST | ✅ Documented |
| 2 | ClaimClassifier | ANALYZE | ✅ Documented |
| 3 | TrackRouter | GUIDE | ✅ Documented |
| 4 | VINCULUMBridge | DISPLAY | ✅ Documented |
| 5 | AgenticLoop | VERIFY | ✅ Documented |
| 6 | StreamingRenderer | DISPLAY | ✅ Design Spec + Phase 1 Started |
| 7 | CrisisDetector | GUIDE | ✅ Documented |
| 8 | RealityProfiler | ANALYZE | ✅ Documented |
| 9 | IntegrityProfiler | ANALYZE | ✅ Documented (Session 5) |
| 10 | PhilosophicalRouter | WISDOM | ✅ Documented (Session 5) |
| 11 | WisdomSynthesizer | WISDOM | ✅ Documented (Session 5) |
| 12 | ComedyEngine | WISDOM | ✅ Documented (Session 5) |
| 13 | EmpathyModulator | WISDOM | ✅ Documented (Session 6) |
| 14 | ConversationManager | GUIDE | ✅ Documented (Session 6) |
| 15 | HistoricalContextualizer | WISDOM | ✅ Documented (Session 6) |
| 16 | VoiceSelector | WISDOM | ✅ Documented (Session 7) |
| 17 | ResourceLinker | GUIDE | ✅ Documented (Session 7) |

---

## Shared Module Extraction Queue

| Module | Source Neurons | Target Location | Priority |
|--------|----------------|-----------------|----------|
| `vinculum.js` | VINCULUMBridge (5 files) | `/modules/vinculum.js` | ✅ **EXTRACTED** |
| `criteria.js` | ClaimClassifier | `/modules/criteria.js` | ✅ **EXTRACTED** |
| `streaming/` | StreamingRenderer | `/modules/streaming/` | ✅ **EXTRACTED (Session 6)** |
| `prompt-builders.js` | buildTrackAPrompt | `/modules/prompt-builders.js` | ✅ **EXTRACTED (Session 8)** |
| `velocity-stream-client.js` | StreamingRenderer (client) | `/modules/velocity-stream-client.js` | ✅ **EXTRACTED (Session 7)** |
| `assess-streaming-integration.js` | UI Integration | `/modules/assess-streaming-integration.js` | ✅ **CREATED (Session 8)** |
| `agentic-loop.js` | AgenticLoop | `/modules/agentic-loop.js` | MEDIUM - Pending |
| `url-fetcher.js` | UserQueryParser | `/modules/url-fetcher.js` | MEDIUM - Pending |
| `rate-limiter.js` | (duplicated in 2 files) | `/modules/rate-limiter.js` | LOW - Pending |

---

## Connection Types

- **→** Data flow (required)
- **⟶** Data flow (optional)
- **↔** Bidirectional communication
- **⤳** Event emission (async)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-17 | Initial connectome created | Claude |
| 2026-01-17 | Added UserQueryParser, ClaimClassifier neurons | Claude |
| 2026-01-17 | Added TrackRouter, VINCULUMBridge, AgenticLoop neurons | Claude |
| 2026-01-17 | Corrected neuron counts, added extraction queue | Claude |
| 2026-01-18 | **EXTRACTED: vinculum.js, criteria.js modules** | Claude |
| 2026-01-18 | Added CrisisDetector, RealityProfiler neurons | Claude |
| 2026-01-18 | Added StreamingRenderer design specification | Claude |
| 2026-01-18 | Updated to v0.3, 20% coverage (8/40 neurons) | Claude |
| 2026-01-18 | **Session 5: Added IntegrityProfiler, PhilosophicalRouter** | Claude |
| 2026-01-18 | **Session 5: Added WisdomSynthesizer, ComedyEngine** | Claude |
| 2026-01-18 | Updated to v0.4, 30% coverage (12/40 neurons) | Claude |
| 2026-01-18 | **Session 6: Added EmpathyModulator, ConversationManager, HistoricalContextualizer** | Claude |
| 2026-01-18 | **Session 6: EXTRACTED streaming module (EventEmitter, StreamParser)** | Claude |
| 2026-01-18 | **Session 6: Created assess-stream.js endpoint (Phase 1 SSE)** | Claude |
| 2026-01-18 | Updated to v0.5, 38% coverage (15/40 neurons) | Claude |
| 2026-01-18 | **Session 7: Added VoiceSelector [WISDOM], ResourceLinker [GUIDE]** | Claude |
| 2026-01-18 | **Session 7: Created velocity-stream-client.js (Phase 1 frontend SSE)** | Claude |
| 2026-01-18 | Updated to v0.6, 38% coverage (17/45 neurons) | Claude |
| 2026-01-19 | **Session 8: Created prompt-builders.js (shared prompt module)** | Claude |
| 2026-01-19 | **Session 8: Refactored assess-stream.js with full prompt support** | Claude |
| 2026-01-19 | **Session 8: Created assess-streaming-integration.js (UI integration)** | Claude |
| 2026-01-19 | **Session 8: Wired assess.html to streaming endpoint** | Claude |
| 2026-01-19 | Updated to v0.7 — Phase 1 Streaming Integration Complete | Claude |
