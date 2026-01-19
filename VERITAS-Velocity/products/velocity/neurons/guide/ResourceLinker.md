# NEURON: ResourceLinker

**Version:** 0.1  
**Created:** 2026-01-18  
**Last Modified:** 2026-01-18  
**Status:** Active  
**Category:** GUIDE  
**Primary File:** `/api/navigate.js:22-131, 196-207`

---

## SOMA (Core Function)

Delivers culturally-appropriate crisis resources and support referrals when triggered by CrisisDetector, ensuring users in distress receive localized help in their mother tongue.

---

## DENDRITES (Inputs)

| Receives | From Neuron | Data Shape | Required? |
|----------|-------------|------------|-----------|
| crisisDetected | CrisisDetector | boolean | Yes |
| language | VINCULUMBridge | ISO 639-1 code | Yes |
| crisisType | CrisisDetector | string (self-harm/hopelessness/etc.) | No |
| userMessage | ConversationManager | string | No |

---

## AXON TERMINALS (Outputs)

| Sends | To Neuron(s) | Data Shape | Trigger |
|-------|--------------|------------|---------|
| crisisResources | StreamingRenderer | string (formatted resources) | When crisis detected |
| resourceInjection | (system prompt) | string | When crisis detected |
| referralGuidance | EmpathyModulator | object | When professional help needed |

---

## SYNAPTIC CONNECTIONS

- **Upstream:** CrisisDetector (triggers resource delivery), VINCULUMBridge (provides language)
- **Downstream:** StreamingRenderer (displays resources), EmpathyModulator (coordinates tone)
- **Lateral:** ConversationManager (ensures resources are woven naturally into response)

---

## FUNCTIONAL SPECIFICATION

### Resource Database Structure

ResourceLinker maintains localized crisis resources for all VINCULUM-supported languages:

```javascript
LANGUAGE_CONFIG = {
    en: { 
        name: 'English', 
        crisisResources: `
- 988 Suicide & Crisis Lifeline (call or text 988)
- Crisis Text Line (text HOME to 741741)
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/`
    },
    es: { 
        name: 'Spanish', 
        crisisResources: `
- Línea Nacional de Prevención del Suicidio: 1-888-628-9454 (en español)
- En España: Teléfono de la Esperanza 717 003 717
- En México: SAPTEL 55 5259-8121
- En Argentina: Centro de Asistencia al Suicida (135)`
    },
    // ... 14 languages total
}
```

### Complete Language Coverage

| Language | Region(s) Covered | Primary Hotline |
|----------|------------------|-----------------|
| English | US, UK, International | 988 (US), Samaritans (UK) |
| Spanish | Spain, Mexico, Argentina, US Hispanic | Country-specific |
| French | France, Québec, Belgium, Switzerland | SOS Amitié, Tel-Aide |
| German | Germany, Austria, Switzerland | Telefonseelsorge |
| Italian | Italy | Telefono Amico |
| Portuguese | Brazil, Portugal | CVV (188) |
| Russian | Russia | 8-800-2000-122 |
| Ukrainian | Ukraine | Лайфлайн 7333 |
| Greek | Greece | 10306 |
| Chinese | Mainland, Taiwan, Hong Kong | Region-specific |
| Japanese | Japan | いのちの電話 |
| Korean | South Korea | 1393 |
| Arabic | Egypt, Lebanon, Saudi Arabia | Country-specific |
| Hebrew | Israel | ער"ן 1201 |

### Resource Delivery Function

```javascript
function buildCrisisAddition(language) {
    const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];
    
    return `

URGENT: The user's message contains potential crisis indicators. 
While responding with compassion, you MUST include these crisis resources 
and encourage professional support. Do not skip this even if you're unsure.

CRISIS RESOURCES FOR THIS USER:
${config.crisisResources}

Weave these resources naturally into your response with warmth — 
not as a disclaimer, but as genuine care.`;
}
```

### Delivery Philosophy

**Critical principle:** Resources must feel like *care*, not *liability protection*.

**Wrong approach:**
> "If you're having thoughts of self-harm, please call 988."

**Right approach (woven naturally):**
> "What you're carrying sounds heavy. Really heavy. You don't have to carry it alone — there are people who do this every day, who get it, who want to help. If you want to talk to someone right now, you can call or text 988. They're good at this."

### Integration with System Prompt

When CrisisDetector returns `true`, ResourceLinker injects guidance into the system prompt:

```javascript
// In navigate.js handler
if (hasCrisisIndicators || queryHasCrisis) {
    systemPrompt += buildCrisisAddition(language || 'en');
}
```

This ensures Claude:
1. Knows crisis was detected
2. Has localized resources ready
3. Understands the delivery mandate (warmth, not disclaimer)

---

## CULTURAL ADAPTATION

### Regional Sensitivity

Different cultures frame crisis support differently:

| Region | Cultural Frame | Delivery Adjustment |
|--------|---------------|---------------------|
| US | Direct, resource-oriented | "Here's how to get help" |
| Japan | Indirect, shame-aware | "There are people who understand" |
| Arab world | Family/community emphasis | "You're not alone in this" |
| Latin America | Warmth-first | Extended validation before resources |

ResourceLinker provides the *resources*; EmpathyModulator adjusts the *framing*.

### RTL Language Support

For Arabic and Hebrew:
- Resources formatted for right-to-left display
- Phone numbers remain LTR for readability
- URLs remain in English (technical identifiers)

---

## SAFETY ARCHITECTURE

### Fail-Safe Behavior

```
IF language_not_recognized:
    RETURN english_resources  // Better than nothing
    
IF crisisResources_undefined:
    RETURN english_resources  // Fallback

IF delivery_fails:
    LOG_error
    CONTINUE_conversation  // Don't break the connection
```

### Never Block the Conversation

Even if resource delivery fails, the conversation continues. A human in crisis must never hit a "system error" wall.

---

## DAMAGE REPORT (What Breaks If This Dies)

- **Track C crisis response** loses localized resources — users see English-only or nothing
- **CrisisDetector** fires but nothing happens — detection without response
- **Cultural safety** fails — resources may be irrelevant (US hotline to Japanese user)
- **VINCULUM integration** incomplete — language detection works but doesn't help
- **Liability exposure** increases — system detected crisis but didn't provide help

---

## TESTING SCENARIOS

### Scenario 1: English user, crisis detected
**Input:** "I just can't do this anymore"  
**Language:** en  
**Expected:** 988 Lifeline + Crisis Text Line included in response

### Scenario 2: Spanish user, crisis detected  
**Input:** "Ya no quiero seguir viviendo"  
**Language:** es  
**Expected:** Region-appropriate Spanish resources (multiple countries)

### Scenario 3: Japanese user, crisis detected
**Input:** "もう生きていたくない"  
**Language:** ja  
**Expected:** Japanese hotlines (いのちの電話, etc.)

### Scenario 4: Unknown language, crisis detected
**Input:** Crisis message in unsupported language  
**Language:** xx  
**Expected:** Falls back to English resources

---

## ETHICAL FRAMEWORK

### The ResourceLinker Mandate

1. **Always respond** — Crisis detection must trigger resource delivery
2. **Localize first** — Mother tongue resources have higher uptake
3. **Warmth over compliance** — Care, not disclaimer
4. **Multiple options** — Different people reach for different help
5. **Never judge** — Resources without moral commentary

### What We Don't Do

- Diagnose conditions
- Assess lethality
- Replace professional help
- Promise confidentiality we can't guarantee
- Lecture about life choices

---

## EXTENSION POINTS

### Phase 5 (VALOR) Integration

VALOR (Advocacy Coaching) will extend ResourceLinker for:
- Conflict mediation resources
- Community support connections
- Professional mediation referrals
- Support group directories

### Future Enhancements

- **Geolocation awareness** — Detect region within language (Brazil vs Portugal)
- **Time-aware resources** — 24/7 vs business-hours services
- **Severity calibration** — Different resources for different crisis levels
- **Follow-up prompts** — "Were you able to connect?" in next turn

---

## GROWTH HISTORY

| Date | Change | Reason | Synapses Affected |
|------|--------|--------|-------------------|
| 2026-01-18 | Created | Session 7 documentation sprint | None (new neuron doc) |

---

## RELATED NEURONS

- [CrisisDetector](./CrisisDetector.md) — Triggers ResourceLinker when crisis patterns detected
- [VINCULUMBridge](../display/VINCULUMBridge.md) — Provides language context for localization
- [EmpathyModulator](../wisdom/EmpathyModulator.md) — Coordinates tone for resource delivery
- [ConversationManager](./ConversationManager.md) — Ensures resources woven naturally

---

*"Help in your mother tongue, when you need it most."*
