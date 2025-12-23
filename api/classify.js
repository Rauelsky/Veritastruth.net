// /api/classify.js
// VERITAS Classification Inquiry - Routes users to appropriate track

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLASSIFICATION_SYSTEM_PROMPT = `You are the VERITAS Classification Inquiry system. Your role is to understand what kind of question the user is really asking and route them to the appropriate track.

## ROUTING LOGIC

**Route to Track A (Evaluate & Assess) when:**
- User wants factual verification ("Is it true that...", "Fact-check this...", "Did X really...")
- Claim is primarily empirical/verifiable (statistics, historical events, scientific data)
- User explicitly asks for assessment, confidence score, or source verification

**Route to Track B Standard (Understand & Explore) when:**
- Question is normative ("Should we...", "Is it right to...", "Is it fair...")
- User wants to understand different perspectives
- Topic is genuinely contested with reasonable people on both sides
- User expresses personal uncertainty ("I believe X, but...", "I'm skeptical about...")
- User asks "Why do people believe..." or "Help me understand..."

**Route to Track B Armor when you detect weaponized communication patterns:**
- Contemptuous dismissal as primary framing ("Those idiots who...")
- Source dismissal without engagement ("MSM lies", "fake news", "deep state")
- Tribal loyalty signals used as arguments rather than evidence
- Reality distortion language ("everyone knows", "it's obvious", "wake up")
- Signs of stonewalling preparation (talking points over dialogue)

**Route to Track B Mirror when user is CORRECT but CONTEMPTUOUS:**
- User's factual position appears supportable by evidence
- BUT their framing drips with dismissiveness toward those who disagree
- Dismissive language: "willfully ignorant", "delusional", "crazy", "brainwashed"
- Othering: "these people", "them" as monolithic stupid group
- Rhetorical contempt: "How can anyone..." (not genuinely curious)
- Superiority markers: "basic science", "obvious facts", "anyone with half a brain"
- They're RIGHT but they're not REACHING anyone

## MIXED CLAIMS

If a claim has both empirical and normative components, identify both:
- "Climate change is real AND we should do nothing" → Separate the empirical (Track A) from the policy (Track B)
- Recommend starting with the component they seem most focused on

## INSUFFICIENT INFORMATION

If the input is too vague to classify:
- Return clarifying questions
- Don't force a classification

## OUTPUT FORMAT

Return ONLY valid JSON with this structure:
{
  "recommended_track": "A" | "B-standard" | "B-armor" | "B-mirror",
  "confidence": 0.0-1.0,
  "question_type": "factual" | "normative" | "contested" | "exploratory" | "mixed",
  "signals_detected": ["array of detected signals"],
  "clarifying_questions": ["optional questions if input is ambiguous"],
  "user_prompt": "Friendly message to show the user explaining the recommendation",
  "reasoning": "Internal explanation for this routing decision"
}

Be gentle in user_prompt — this is first contact. Don't accuse or label.`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, context = '' } = req.body;

  if (!input || input.trim().length === 0) {
    return res.status(400).json({ error: 'Input is required' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: CLASSIFICATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Classify this input and determine the appropriate VERITAS track:

INPUT: ${input}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

Respond with JSON only. No markdown formatting, no code blocks, just the JSON object.`
        }
      ]
    });

    // Parse Claude's response
    const responseText = message.content[0].text;
    
    // Clean up any potential markdown formatting
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    let classification;
    try {
      classification = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      return res.status(500).json({ 
        error: 'Failed to parse classification response',
        raw: responseText 
      });
    }

    return res.status(200).json(classification);

  } catch (error) {
    console.error('Classification error:', error);
    return res.status(500).json({ 
      error: 'Classification failed',
      message: error.message 
    });
  }
}
