# VERITAS VELOCITY - CONNECTOME

> The complete map of all neurons and their synaptic connections

**Last Updated:** 2026.01.17  
**Total Neurons:** 0 documented / 42 planned  
**Synapse Integrity:** All connections healthy

---

## Overview

This document maps every neuron (component) in the VERITAS architecture and its connections to other neurons. Before modifying ANY neuron, consult this map to understand what you might break.

---

## Neural Categories

```
                    VERITAS NEURAL ARCHITECTURE
    
    [INGEST] --> [ANALYZE] --> [VERIFY]
                    |             |
                    v             v
               [WISDOM]       [GUIDE]
                    |             |
                    +------+------+
                           |
                           v
                      [DISPLAY]
                           |
                           v
                        [USER]
```

---

## INGEST Neurons (Green)

How information enters the system

| Neuron | Status | Upstream | Downstream | Card |
|--------|--------|----------|------------|------|
| ClaimExtractor | Planned | User Input | ClaimClassifier | - |
| UserQueryParser | Planned | User Input | ClaimClassifier, WebSearcher | - |
| SourceScraper | Planned | URL Input | RealityProfiler | - |
| FeedMonitor | Planned | RSS/Social | PatternMatcher | - |
| DocumentProcessor | Planned | File Upload | ClaimExtractor | - |
| TemporalDetector | Planned | Any Text | TemporalVerifier | - |

---

## ANALYZE Neurons (Blue)

How information gets evaluated

| Neuron | Status | Upstream | Downstream | Card |
|--------|--------|----------|------------|------|
| ClaimClassifier | Planned | UserQueryParser | TrackRouter, ComplexityRouter | - |
| RealityProfiler | Planned | WebSearcher, SourceScraper | IntegrityProfiler, StreamingRenderer | - |
| IntegrityProfiler | Planned | RealityProfiler | StreamingRenderer | - |
| BiasDetector | Planned | Any Text | RealityProfiler | - |
| FrameworkAnalyzer | Planned | ClaimClassifier | WisdomSynthesizer | - |
| PatternMatcher | Planned | FeedMonitor | AlertRenderer | - |
| TrendAnalyzer | Planned | FeedMonitor | DigestFormatter | - |
| ArgumentMapper | Planned | UserQueryParser | BridgeBuilder | - |

---

## VERIFY Neurons (Purple)

How claims get checked against reality

| Neuron | Status | Upstream | Downstream | Card |
|--------|--------|----------|------------|------|
| WebSearcher | Planned | UserQueryParser | RealityProfiler, SourceCredibility | - |
| SourceCredibility | Planned | WebSearcher | RealityProfiler | - |
| ConsensusChecker | Planned | Multiple Sources | RealityProfiler | - |
| TemporalVerifier | Planned | TemporalDetector | RealityProfiler | - |
| CrossReferencer | Planned | Multiple Sources | RealityProfiler | - |
| FactDatabase | Planned | Verified Facts | All Verify Neurons | - |

---

## WISDOM Neurons (Amber)

The invisible wisdom engine - 6,000 years of human insight

| Neuron | Status | Upstream | Downstream | Card |
|--------|--------|----------|------------|------|
| PhilosophicalRouter | Planned | TrackRouter | WisdomSynthesizer | - |
| HistoricalContextualizer | Planned | ClaimClassifier | WisdomSynthesizer | - |
| ComedyEngine | Planned | WisdomSynthesizer | StreamingRenderer | - |
| EmpathyModulator | Planned | CrisisDetector | ConversationManager | - |
| WisdomSynthesizer | Planned | PhilosophicalRouter, HistoricalContextualizer | StreamingRenderer | - |
| BridgeBuilder | Planned | ArgumentMapper | ConversationManager | - |

---

## GUIDE Neurons (Pink)

How users get helped

| Neuron | Status | Upstream | Downstream | Card |
|--------|--------|----------|------------|------|
| TrackRouter | Planned | ClaimClassifier | RealityProfiler, ConversationManager | - |
| ComplexityRouter | Planned | ClaimClassifier | Haiku/Sonnet Path | - |
| ConversationManager | Planned | TrackRouter | StreamingRenderer | - |
| ActionRecommender | Planned | Assessment Complete | StreamingRenderer | - |
| CrisisDetector | Planned | UserQueryParser | EmpathyModulator, ResourceLinker | - |
| ProgressTracker | Planned | ConversationManager | StreamingRenderer | - |
| ResourceLinker | Planned | CrisisDetector | StreamingRenderer | - |

---

## DISPLAY Neurons (Cyan)

How results get presented

| Neuron | Status | Upstream | Downstream | Card |
|--------|--------|----------|------------|------|
| StreamingRenderer | Planned | All Assessment Outputs | VINCULUMBridge, User | - |
| ProfileVisualizer | Planned | RealityProfiler, IntegrityProfiler | StreamingRenderer | - |
| ConfidenceDisplay | Planned | RealityProfiler | StreamingRenderer | - |
| SourceCitation | Planned | WebSearcher | StreamingRenderer | - |
| ExportEngine | Planned | Complete Assessment | PDF/JSON/Markdown | - |
| DigestFormatter | Planned | TrendAnalyzer | Email/Notification | - |
| AlertRenderer | Planned | PatternMatcher | User Notification | - |
| VINCULUMBridge | Planned | StreamingRenderer | User (translated) | - |

---

## Signal Flow: Track A (Assess + Amplify + Verify)

```
User Query
    |
    v
UserQueryParser
    |
    v
ClaimClassifier --> ComplexityRouter
                         |
         +---------------+---------------+
         |                               |
         v                               v
    [Simple]                        [Complex]
         |                               |
         v                               v
      Haiku                           Sonnet
         |                               |
         +---------------+---------------+
                         |
                         v
                  RealityProfiler <-- WebSearcher
                         |
                         v
                  IntegrityProfiler
                         |
                         v
                  WisdomSynthesizer
                         |
                         v
                  StreamingRenderer
                         |
                         v
                   VINCULUMBridge
                         |
                         v
                      [USER]
```

---

## Synapse Health Log

| Date | Synapse | Status | Issue | Resolution |
|------|---------|--------|-------|------------|
| - | - | - | No issues recorded | - |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| Planned | Not yet started |
| Documented | Neuron Card exists |
| Built | Code implemented |
| Tested | Verified working |
| Degraded | Working but issues |
| Broken | Needs repair |

---

*"The whole is greater than the sum of its parts." - Aristotle*
