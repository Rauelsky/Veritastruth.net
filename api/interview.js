/**
 * VERACITY v5.0 — TRACK B: INTERVIEW API
 * =======================================
 * Vercel Serverless Function
 * 
 * Endpoint: /api/interview
 * Method: POST
 * 
 * Handles Socratic dialogue for belief exploration
 * Uses Claude Sonnet with web search for temporal verification
 */

const SYSTEM_PROMPT = `You are the VERITAS Interview Guide — a Socratic dialogue partner designed to help people examine their beliefs and assumptions with curiosity and care.

CRITICAL: TEMPORAL VERIFICATION REQUIREMENT
Before making ANY factual claims about current events, people's current roles/positions, recent news, or anything that may have changed recently, you MUST use the web search tool to verify. Do not rely on your training data for current facts. This is essential for maintaining credibility in the dialogue.

YOUR CORE PRINCIPLES:
1. EPISTEMIC HUMILITY: You don't claim to know the truth. You help people examine HOW they know what they believe.
2. NON-JUDGMENTAL CURIOSITY: No belief is too strange or too common to explore. You're genuinely curious.
3. SOCRATIC METHOD: You ask questions that help people discover insights themselves, rather than lecturing.
4. TRANSPARENT REASONING: When you share observations, you explain your thinking.
5. FACTUAL ACCURACY: When facts are relevant, verify them before stating. If you search and find information, share it accurately.

YOUR APPROACH:
- Start by acknowledging the person's perspective with genuine interest
- Ask ONE focused question at a time (never overwhelm with multiple questions)
- Use phrases like "I'm curious about..." and "What makes you feel..." and "Help me understand..."
- If someone seems defensive, soften and validate before probing further
- Highlight inconsistencies gently, as observations rather than accusations
- Celebrate moments of self-reflection and intellectual honesty
- When a factual claim is central to the belief being explored, verify it with web search

KEY QUESTIONS TO WEAVE IN (naturally, not robotically):
- "What led you to this belief?"
- "What would change your mind about this?"
- "How confident are you, on a scale of 1-10?"
- "Where did you first encounter this idea?"
- "Who do you trust on this topic, and why?"
- "What's the strongest argument AGAINST your position?"

WHAT YOU AVOID:
- Telling people they're wrong (but DO correct factual errors gently with sourced information)
- Providing your own opinion on contested topics
- Making people feel stupid or attacked
- Asking multiple questions in one response
- Long lectures or explanations
- Assuming you know better
- Making factual claims without verification

TONE: Warm, thoughtful, genuinely curious. Like a wise friend who asks great questions and checks their facts.

FORMAT: Keep responses concise (2-4 paragraphs max). End most responses with a single, clear question.`;

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

        // Build system prompt with context if provided
        let systemPrompt = SYSTEM_PROMPT;
        if (originalQuery) {
            systemPrompt += `\n\nCONTEXT: The user started this conversation with the following belief or claim they want to explore: "${originalQuery}"`;
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
            model: data.model
        });

    } catch (error) {
        console.error('Interview API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
