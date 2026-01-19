# CrisisDetector Neuron

**Category:** GUIDE  
**Status:** Active  
**Source:** `navigate.js:182-207`, `modules/vinculum.js`  
**Dependencies:** VINCULUM (language config, crisis resources)

---

## Purpose

Detects potential mental health crisis indicators in user messages and triggers appropriate safety responses with language-specific crisis resources. Implements VERITAS's commitment to user wellbeing while respecting cultural and linguistic contexts.

---

## Core Philosophy

> "Weave these resources naturally into your response with warmth — not as a disclaimer, but as genuine care."

Crisis detection operates invisibly until needed, then surfaces with compassion rather than clinical detachment. Resources are localized through VINCULUM, ensuring users receive help in their language and region.

---

## Implementation

### Detection Patterns

```javascript
const CRISIS_PATTERNS = [
    /\b(suicid|kill\s*(my)?self|end\s*(my|it\s*all)|want\s*to\s*die|don'?t\s*want\s*to\s*live)\b/i,
    /\b(self[\s-]?harm|cut(ting)?\s*(my)?self|hurt\s*(my)?self)\b/i,
    /\b(no\s*(point|reason|hope)|give\s*up|can'?t\s*(go\s*on|take\s*it|do\s*this))\b/i
];
```

### Detection Function

```javascript
function detectCrisis(text) {
    if (!text) return false;
    return CRISIS_PATTERNS.some(pattern => pattern.test(text));
}
```

### Usage in Navigate Handler

```javascript
// Check for crisis indicators in the latest user message
const latestUserMessage = messages.filter(m => m.role === 'user').pop();
const hasCrisisIndicators = latestUserMessage && detectCrisis(latestUserMessage.content);

// Also check original query (conversation starter)
const queryHasCrisis = originalQuery && detectCrisis(originalQuery);

// Add crisis alert with appropriate resources if detected
if (hasCrisisIndicators || queryHasCrisis) {
    systemPrompt += buildCrisisAddition(language || 'en');
}
```

---

## Crisis Addition Builder

```javascript
function buildCrisisAddition(language) {
    const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];
    
    return `

URGENT: The user's message contains potential crisis indicators. While responding 
with compassion, you MUST include these crisis resources and encourage professional 
support. Do not skip this even if you're unsure.

CRISIS RESOURCES FOR THIS USER:
${config.crisisResources}

Weave these resources naturally into your response with warmth — not as a disclaimer, 
but as genuine care.`;
}
```

---

## Language-Specific Resources

Crisis resources are defined in VINCULUM (`modules/vinculum.js`) for each supported language:

| Language | Key Resources |
|----------|---------------|
| English | 988 Lifeline, Crisis Text Line |
| Spanish | 1-888-628-9454, Teléfono de la Esperanza |
| French | SOS Amitié, 1-866-APPELLE (Québec) |
| German | Telefonseelsorge 0800 111 0 111 |
| Chinese | 北京心理危机中心, 台灣安心專線 1925 |
| Arabic | خط نجدة الطفل والأسرة (Egypt), Embrace (Lebanon) |
| Hebrew | ער"ן 1201, נט"ל |

All 14 supported languages have localized resources covering multiple regions where each language is spoken.

---

## Integration Points

| Component | Interaction |
|-----------|-------------|
| **navigate.js** | Primary consumer — checks messages before API call |
| **VINCULUM** | Provides crisis resources by language |
| **LANGUAGE_CONFIG** | Source of truth for regional resources |
| **SystemPrompt** | Crisis addition appended when triggered |

---

## Design Decisions

### Why Pattern-Based Detection?

Regex patterns provide:
- **Speed**: No API call needed for detection
- **Privacy**: Text stays local, not sent for analysis
- **Predictability**: Consistent trigger conditions
- **Auditability**: Clear what triggers responses

### Why Check Both Latest Message AND Original Query?

Users in crisis may:
- Open with distress, then shift topics
- Return to crisis themes after digression
- Express crisis indirectly in follow-ups

Checking both ensures sustained safety coverage throughout the conversation.

### Why "Weave Naturally"?

Clinical presentation of hotline numbers can feel:
- Dismissive ("here's a number, goodbye")
- Alarming (implying the situation is worse than felt)
- Impersonal (template response)

Weaving resources into warm, continued engagement maintains the human connection while ensuring help is available.

---

## Current Limitations

1. **False Positives**: May trigger on discussions *about* crisis topics (academic, journalistic)
2. **False Negatives**: Novel expressions of distress may not match patterns
3. **No Escalation Levels**: Binary detection (crisis/no-crisis) without severity gradation
4. **No Memory**: Each message evaluated independently; pattern across messages not tracked

---

## Future Enhancements (Roadmap)

1. **Contextual Refinement**: Distinguish discussing crisis from experiencing crisis
2. **Severity Tiers**: Immediate danger vs. general distress vs. past experience
3. **Session Awareness**: Track escalation/de-escalation across conversation
4. **Feedback Loop**: Learn from user responses to improve detection
5. **Multilingual Patterns**: Language-specific crisis expression patterns

---

## Module Location After Extraction

With VINCULUM extraction complete, CrisisDetector functionality is now available via:

```javascript
import { 
    detectCrisis, 
    buildCrisisAddition,
    getCrisisResources,
    CRISIS_PATTERNS 
} from '../modules/vinculum.js';
```

The navigate.js file can be refactored to import from the module rather than defining locally.

---

## Testing Considerations

| Test Case | Expected Behavior |
|-----------|-------------------|
| "I want to die" | detectCrisis returns `true` |
| "The character in my story wants to die" | detectCrisis returns `true` (false positive by design) |
| "I'm feeling hopeless" | detectCrisis returns `true` |
| "I'm disappointed" | detectCrisis returns `false` |
| Language = 'es' + crisis detected | Spanish resources included |
| Language = 'ar' + crisis detected | Arabic resources (RTL-aware) included |

---

*"When crisis resources are needed, use the ones appropriate for the user's language-speaking regions."*  
— VINCULUM Philosophy
