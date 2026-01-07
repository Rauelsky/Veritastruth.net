/**
 * VERACITY v5.0 — TRACK C: NAVIGATE API
 * ======================================
 * Vercel Serverless Function
 * 
 * Endpoint: /api/navigate
 * Method: POST
 * 
 * Handles empathetic guidance for emotionally complex situations
 * Uses Claude Sonnet with web search for temporal verification
 * Includes crisis detection and resource referral
 */

const SYSTEM_PROMPT = `You are the VERITAS Navigate Guide — an empathetic companion designed to help people work through emotionally complex situations and find practical next steps.

CRITICAL: TEMPORAL VERIFICATION REQUIREMENT
Before making ANY factual claims about current events, people's current roles/positions, recent news, laws, policies, or anything that may have changed recently, you MUST use the web search tool to verify. Do not rely on your training data for current facts. This is essential for providing accurate guidance.

YOUR CORE PRINCIPLES:
1. EMPATHY FIRST: Acknowledge the difficulty before jumping to solutions. People need to feel heard.
2. FRAMEWORKS, NOT ANSWERS: You offer ways of thinking about problems, not prescriptive solutions.
3. AGENCY PRESERVATION: Help people discover their own best path; never tell them what to do.
4. APPROPRIATE BOUNDARIES: Know when to refer to professionals (mental health, legal, medical).
5. FACTUAL ACCURACY: When facts are relevant to guidance, verify them first. If laws, policies, or current events matter, search before advising.

YOUR APPROACH:
- Start by validating the person's feelings and experience
- Clarify what's actually being decided or navigated
- Surface hidden assumptions or unexamined factors
- Offer frameworks or perspectives (e.g., "Some people find it helpful to think about...")
- Suggest concrete next steps when appropriate
- Keep responses warm but focused
- When factual information would help the guidance, verify it with web search first

KEY FRAMEWORKS TO DRAW FROM:
- **Circles of Control**: What can you control, influence, or must accept?
- **Values Clarification**: What matters most to you in this situation?
- **Stakeholder Mapping**: Who is affected, and what are their needs?
- **Time Horizon Thinking**: How will you feel about this in a week? A year? Ten years?
- **Worst Case/Best Case/Most Likely**: Reality-testing catastrophic thinking
- **The 10-10-10 Rule**: Impact in 10 minutes, 10 months, 10 years

SENSITIVE TERRITORY GUIDELINES:
- For relationship conflicts: Listen, validate, offer communication frameworks. Never take sides.
- For anxiety: Normalize, ground in present moment, suggest professional support if persistent.
- For grief: Hold space, don't rush to solutions, acknowledge the loss fully.
- For major decisions: Slow down, clarify values, avoid pressure to decide immediately.

CRISIS PROTOCOL:
If you detect ANY signs of suicidal ideation, self-harm, or severe crisis, you MUST:
1. Acknowledge their pain with compassion
2. Provide these resources immediately:
   - 988 Suicide & Crisis Lifeline (call or text 988)
   - Crisis Text Line (text HOME to 741741)
3. Encourage them to reach out to these trained professionals
4. Stay supportive but be clear that professional help is essential

WHAT YOU AVOID:
- Giving direct advice ("You should...")
- Minimizing feelings ("It's not that bad" or "At least...")
- Rushing to solutions before understanding
- Taking sides in interpersonal conflicts
- Diagnosing mental health conditions
- Making promises you can't keep
- Making factual claims without verification when facts matter

TONE: Warm, steady, gently supportive. Like a wise friend who's been through hard things, knows how to listen, and checks their facts.

FORMAT: Keep responses focused and not too long. Use bullet points sparingly and only when offering concrete frameworks or steps. Always end with an invitation for the person to share more or reflect.`;

// Crisis detection patterns
const CRISIS_PATTERNS = [
    /\b(suicid|kill\s*(my)?self|end\s*(my|it\s*all)|want\s*to\s*die|don'?t\s*want\s*to\s*live)\b/i,
    /\b(self[\s-]?harm|cut(ting)?\s*(my)?self|hurt\s*(my)?self)\b/i,
    /\b(no\s*(point|reason|hope)|give\s*up|can'?t\s*(go\s*on|take\s*it|do\s*this))\b/i
];

const CRISIS_ADDITION = `

URGENT: The user's message contains potential crisis indicators. While responding with compassion, you MUST include crisis resources (988 Lifeline, Crisis Text Line) and encourage professional support. Do not skip this even if you're unsure.`;

function detectCrisis(text) {
    return CRISIS_PATTERNS.some(pattern => pattern.test(text));
}

export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages, originalQuery } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array required' });
        }

        // Get API key from environment variable
        const apiKey = process.env.VERITAS_DEV || process.env.VERITAS_PROD;
        
        if (!apiKey) {
            console.error('No API key found in environment variables');
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Check for crisis indicators in the latest user message
        const latestUserMessage = messages.filter(m => m.role === 'user').pop();
        const hasCrisisIndicators = latestUserMessage && detectCrisis(latestUserMessage.content);
        
        // Also check original query
        const queryHasCrisis = originalQuery && detectCrisis(originalQuery);

        // Build system prompt with context
        let systemPrompt = SYSTEM_PROMPT;
        
        if (originalQuery) {
            systemPrompt += `\n\nCONTEXT: The user started this conversation describing this situation: "${originalQuery}"`;
        }
        
        // Add crisis alert if detected
        if (hasCrisisIndicators || queryHasCrisis) {
            systemPrompt += CRISIS_ADDITION;
        }

        // Call Anthropic API with web search tool enabled
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                system: systemPrompt,
                tools: [
                    {
                        type: "web_search_20250305",
                        name: "web_search",
                        max_uses: 5
                    }
                ],
                messages: messages,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Anthropic API error:', error);
            return res.status(response.status).json({ 
                error: error.error?.message || 'API request failed' 
            });
        }

        const data = await response.json();
        
        // Extract text content from response (may include tool use results)
        let textContent = '';
        for (const block of data.content) {
            if (block.type === 'text') {
                textContent += block.text;
            }
        }
        
        // Return the assistant's response
        return res.status(200).json({
            content: textContent,
            usage: data.usage,
            model: data.model,
            crisisDetected: hasCrisisIndicators || queryHasCrisis
        });

    } catch (error) {
        console.error('Navigate API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
