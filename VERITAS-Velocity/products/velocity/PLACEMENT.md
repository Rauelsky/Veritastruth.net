# PLACEMENT.md — Session 8 Files

**Date:** 2026-01-19  
**Session:** 8 — Streaming Integration Complete

---

## New Files Created This Session

### 1. `/modules/prompt-builders.js`
**Purpose:** Shared prompt builder module — ensures assess.js and assess-stream.js use identical prompts  
**Size:** 35,007 bytes  
**Place in:** `/velocity/modules/prompt-builders.js`

**Contents:**
- `buildTrackAPrompt(question, articleText, language)` — Full 600+ line Track A prompt
- `LANGUAGE_NAMES` — 14-language support
- `CRITERIA_SETS` — Assessment criteria definitions
- `buildLanguageInstruction(language)` — VINCULUM Universal Translator block
- `getDateInfo()` — Current date helper

**Dependencies:** None (standalone module)

---

### 2. `/modules/assess-streaming-integration.js`
**Purpose:** Drop-in UI integration that adds Velocity Mode toggle to assess.html  
**Size:** 21,934 bytes  
**Place in:** `/velocity/modules/assess-streaming-integration.js`

**Features:**
- ⚡ Velocity Mode toggle (user can enable/disable streaming)
- Intercepts existing `runAssessment()` function
- Progressive score display during streaming
- Live text preview with blinking cursor
- Full compatibility with existing `displayResults()`

**Dependencies:** 
- Requires `velocity-stream-client.js` loaded first
- Requires existing assess.html functions (`updateScoreDisplay`, `renderAssessmentContent`, etc.)

---

### 3. `/api/assess-stream.js` (REPLACED)
**Purpose:** Streaming endpoint for Track A assessments  
**Size:** 14,449 bytes  
**Place in:** `/velocity/api/assess-stream.js`

**Changes from previous version:**
- Now imports and uses `buildTrackAPrompt` from `prompt-builders.js`
- Full response parsing with `parseTrackAResponse()`
- Emits structured data in `complete` event for frontend compatibility

**Dependencies:**
- `../modules/streaming` (EventEmitter, StreamParser, etc.)
- `../modules/prompt-builders` (buildTrackAPrompt)

---

## Modified Files This Session

### 4. `/assess.html`
**Change:** Added script references at end of file (before `</body>`)  
**Location:** Line ~5407

**Added lines:**
```html
<!-- VERITAS Velocity — Streaming Support (Phase 1) -->
<script src="/modules/velocity-stream-client.js"></script>
<script src="/modules/assess-streaming-integration.js"></script>
```

---

### 5. `/CONNECTOME.md`
**Changes:**
- Version: 0.6 → 0.7
- Status: "38% Coverage" → "70% Complete — Streaming Integrated"
- Added new modules to extraction queue
- Added Session 8 change log entries

---

### 6. `/BRIDGE.html`
**Changes:**
- HELM: Session 8 → Session 9 objectives
- Phase 1 progress: 60% → 70%
- Sessions: 7 → 8
- Last Audit: S6 → S8
- Added Session 8 Captain's Log entry

---

## File Dependencies (Load Order)

For assess.html, scripts must load in this order:

```
1. [existing scripts...]
2. /modules/veritas-translations.js  (existing)
3. /modules/velocity-stream-client.js  (Session 7)
4. /modules/assess-streaming-integration.js  (Session 8) ← NEW
```

For assess-stream.js API endpoint:

```
1. ../modules/streaming/index.js
   ├── EventEmitter.js
   └── StreamParser.js
2. ../modules/prompt-builders.js  ← NEW
```

---

## Deployment Checklist

1. **Copy new files:**
   - [ ] `/modules/prompt-builders.js`
   - [ ] `/modules/assess-streaming-integration.js`

2. **Replace updated files:**
   - [ ] `/api/assess-stream.js`
   - [ ] `/assess.html`
   - [ ] `/CONNECTOME.md`
   - [ ] `/BRIDGE.html`

3. **Verify dependencies exist:**
   - [ ] `/modules/streaming/index.js`
   - [ ] `/modules/streaming/EventEmitter.js`
   - [ ] `/modules/streaming/StreamParser.js`
   - [ ] `/modules/velocity-stream-client.js`

4. **Test after deployment:**
   - [ ] Load assess.html — verify ⚡ Velocity Mode toggle appears
   - [ ] Run assessment with Velocity Mode OFF — should work normally
   - [ ] Run assessment with Velocity Mode ON — should stream progressively
   - [ ] Verify scores display correctly in both modes

---

## Environment Variables Required

For `/api/assess-stream.js`:
```
ANTHROPIC_API_KEY=sk-ant-...
# OR
VERITAS_DEV=sk-ant-...
# OR  
VERITAS_PROD=sk-ant-...
```

---

## Rollback Instructions

If streaming causes issues:

1. **Quick disable:** Users can toggle off "⚡ Velocity Mode" in the UI
2. **Full rollback:** Remove these lines from assess.html:
   ```html
   <script src="/modules/velocity-stream-client.js"></script>
   <script src="/modules/assess-streaming-integration.js"></script>
   ```

The integration is non-destructive — original `runAssessment()` is preserved and called when streaming is disabled.

---

## Session 9 Preparation

Files that will need creation/modification next session:

1. **Create:** `/api/interview-stream.js` (Track B streaming)
2. **Create:** `/api/navigate-stream.js` (Track C streaming)
3. **Create:** `/neurons/verify/Adjudicator.md` (documentation)
4. **Create:** `/neurons/verify/Amplifier.md` (documentation)
5. **Modify:** `prompt-builders.js` — add `buildTrackBPrompt()`, `buildTrackCPrompt()`

---

*"Make it so."* — Captain Jean-Luc Picard 🖖
