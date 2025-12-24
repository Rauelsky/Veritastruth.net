const Anthropic = require('@anthropic-ai/sdk');
const https = require('https');
const http = require('http');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    FREE_LIMIT: 5,
    RATE_LIMIT_WINDOW: 24 * 60 * 60 * 1000, // 24 hours in ms
    DAILY_BUDGET_CENTS: 5000, // $50/day max - adjust as needed
    EMERGENCY_SHUTOFF: process.env.EMERGENCY_SHUTOFF === 'true',
    ENVIRONMENT: process.env.VERCEL_ENV || 'development' // 'production', 'preview', 'development'
};

// ============================================
// URL CONTENT FETCHER
// ============================================
async function fetchUrlContent(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const options = {
            timeout: 15000,
            headers: {
                'User-Agent': 'VERITAS/1.0 (Truth Assessment Engine)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        };
        
        const req = protocol.get(url, options, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                fetchUrlContent(res.headers.location).then(resolve).catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch URL: HTTP ${res.statusCode}`));
                return;
            }
            
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                // Basic HTML to text extraction
                let text = data;
                
                // Remove scripts and styles
                text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                
                // Remove HTML tags
                text = text.replace(/<[^>]+>/g, ' ');
                
                // Decode HTML entities
                text = text.replace(/&nbsp;/g, ' ');
                text = text.replace(/&amp;/g, '&');
                text = text.replace(/&lt;/g, '<');
                text = text.replace(/&gt;/g, '>');
                text = text.replace(/&quot;/g, '"');
                text = text.replace(/&#39;/g, "'");
                
                // Clean up whitespace
                text = text.replace(/\s+/g, ' ').trim();
                
                // Limit to reasonable size (first 15000 chars)
                if (text.length > 15000) {
                    text = text.substring(0, 15000) + '... [content truncated]';
                }
                
                resolve(text);
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('URL fetch timeout'));
        });
    });
}

// ============================================
// RATE LIMITING - SERVER-SIDE (IP-based with in-memory store)
// NOTE: For production, consider using Vercel KV for persistent storage
// ============================================
const rateLimitMap = new Map();
const dailySpendMap = new Map();

function getRateLimitKey(req) {
    // Get client IP from various headers (Vercel/Cloudflare/etc)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-real-ip'] || 
               req.headers['cf-connecting-ip'] ||
               req.socket?.remoteAddress ||
               'unknown';
    return 'rate:' + ip;
}

function checkRateLimit(key) {
    const now = Date.now();
    const record = rateLimitMap.get(key);
    
    // Clean up old entries periodically
    if (rateLimitMap.size > 10000) {
        for (const [k, v] of rateLimitMap.entries()) {
            if ((now - v.windowStart) > CONFIG.RATE_LIMIT_WINDOW) {
                rateLimitMap.delete(k);
            }
        }
    }
    
    if (!record || (now - record.windowStart) > CONFIG.RATE_LIMIT_WINDOW) {
        rateLimitMap.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: CONFIG.FREE_LIMIT - 1, used: 1 };
    }
    
    if (record.count >= CONFIG.FREE_LIMIT) {
        const resetAt = new Date(record.windowStart + CONFIG.RATE_LIMIT_WINDOW).toISOString();
        return { allowed: false, remaining: 0, used: record.count, resetAt };
    }
    
    record.count++;
    return { allowed: true, remaining: CONFIG.FREE_LIMIT - record.count, used: record.count };
}

// ============================================
// COST TRACKING
// ============================================
function calculateCost(usage) {
    // Sonnet pricing: $3/1M input, $15/1M output
    const inputCost = (usage.input_tokens / 1000000) * 3.00;
    const outputCost = (usage.output_tokens / 1000000) * 15.00;
    return {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        totalCostDollars: inputCost + outputCost,
        totalCostCents: Math.round((inputCost + outputCost) * 100)
    };
}

function checkDailyBudget() {
    const today = new Date().toISOString().split('T')[0];
    const key = `spend:${today}`;
    const currentSpend = dailySpendMap.get(key) || 0;
    return {
        allowed: currentSpend < CONFIG.DAILY_BUDGET_CENTS,
        currentSpendCents: currentSpend,
        budgetCents: CONFIG.DAILY_BUDGET_CENTS,
        remainingCents: Math.max(0, CONFIG.DAILY_BUDGET_CENTS - currentSpend)
    };
}

function trackSpend(costCents) {
    const today = new Date().toISOString().split('T')[0];
    const key = `spend:${today}`;
    const currentSpend = dailySpendMap.get(key) || 0;
    dailySpendMap.set(key, currentSpend + costCents);
    
    // Clean up old days
    for (const [k] of dailySpendMap.entries()) {
        if (!k.includes(today)) {
            dailySpendMap.delete(k);
        }
    }
}

// ============================================
// USAGE LOGGING - For tracking and analytics
// ============================================
function logUsage(data) {
    // This logs to Vercel's function logs
    // You can view these in Vercel Dashboard > Logs
    console.log(JSON.stringify({
        event: 'veritas_assessment',
        timestamp: new Date().toISOString(),
        environment: CONFIG.ENVIRONMENT,
        track: data.track || 'a',
        claimType: data.claimType || 'generic',
        hasUserKey: data.hasUserKey || false,
        clientIP: data.clientIP ? data.clientIP.substring(0, 10) + '...' : 'unknown', // Truncated for privacy
        tokens: {
            input: data.inputTokens || 0,
            output: data.outputTokens || 0
        },
        costCents: data.costCents || 0,
        success: data.success,
        errorType: data.errorType || null,
        processingTimeMs: data.processingTimeMs || 0
    }));
}

// ============================================
// CRITERIA DEFINITIONS (must match frontend)
// ============================================
const CRITERIA_SETS = {
    qualification: {
        label: 'Person Qualification',
        criteria: [
            { id: 'legal', label: 'Legal Eligibility', description: 'Does the person meet legal/constitutional requirements for the role?' },
            { id: 'experience', label: 'Experience & Credentials', description: 'What relevant experience, education, or credentials does the person have?' },
            { id: 'record', label: 'Historical Record', description: 'What is their track record in similar or related roles?' },
            { id: 'alignment', label: 'Value Alignment', description: 'How do their stated values align with the role\'s requirements?' },
            { id: 'controversies', label: 'Controversies & Concerns', description: 'What documented concerns, controversies, or red flags exist?' }
        ]
    },
    policy: {
        label: 'Policy Effectiveness',
        criteria: [
            { id: 'goals', label: 'Stated Goals Clarity', description: 'Are the policy\'s goals clearly defined and measurable?' },
            { id: 'outcomes', label: 'Measurable Outcomes', description: 'What evidence exists about the policy\'s actual outcomes?' },
            { id: 'costbenefit', label: 'Cost/Benefit Analysis', description: 'How do the costs compare to the benefits?' },
            { id: 'alternatives', label: 'Comparison to Alternatives', description: 'How does this policy compare to alternative approaches?' },
            { id: 'implementation', label: 'Implementation Challenges', description: 'What practical challenges affect implementation?' }
        ]
    },
    product: {
        label: 'Product/Service Quality',
        criteria: [
            { id: 'audience', label: 'Who benefits from this product or service?', description: 'For whom is this product/service appropriate?' },
            { id: 'measure', label: 'Success Criteria', description: 'By what measure is success/quality defined?' },
            { id: 'comparison', label: 'Comparison to Alternatives', description: 'How does it compare to alternatives?' },
            { id: 'timeframe', label: 'Timeframe Considerations', description: 'What are short-term vs long-term implications?' },
            { id: 'credibility', label: 'Source Credibility', description: 'What conflicts of interest or biases exist in claims about it?' }
        ]
    },
    prediction: {
        label: 'Prediction/Forecast',
        criteria: [
            { id: 'trackrecord', label: 'Predictor Track Record', description: 'What is the predictor\'s history of accuracy?' },
            { id: 'transparency', label: 'Model Transparency', description: 'Is the reasoning/model behind the prediction transparent?' },
            { id: 'baserates', label: 'Base Rates Acknowledged', description: 'Are historical base rates considered?' },
            { id: 'uncertainty', label: 'Uncertainty Quantified', description: 'Is uncertainty appropriately acknowledged and quantified?' },
            { id: 'falsifiability', label: 'Falsifiability Defined', description: 'What would prove the prediction wrong?' }
        ]
    },
    generic: {
        label: 'General Assessment',
        criteria: [
            { id: 'evidence', label: 'Evidence Quality', description: 'What evidence supports or refutes this claim?' },
            { id: 'expertise', label: 'Source Expertise', description: 'Do the sources have relevant expertise?' },
            { id: 'audience', label: 'Who benefits?', description: 'Who gains or loses if this claim is accepted?' },
            { id: 'alternatives', label: 'Alternative Perspectives', description: 'What competing viewpoints exist?' },
            { id: 'outcomes', label: 'Measurable Outcomes', description: 'What concrete outcomes can be measured?' },
            { id: 'timeframe', label: 'Timeframe Considerations', description: 'What are short-term vs long-term implications?' }
        ]
    }
};

// ============================================
// PROMPT BUILDER - TRACK A (Factual)
// ============================================
function buildTrackAPrompt(question, articleText) {
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    var isoDate = now.toISOString().split('T')[0];
    
    var prompt = 'You are VERITAS, an epistemologically rigorous truth assessment system. Your purpose is to evaluate claims using a transparent methodology with intellectual honesty and appropriate epistemic humility.\n\n';
    
    // EDUCATIONAL MISSION
    prompt += '## EDUCATIONAL MISSION\n';
    prompt += 'VERITAS exists not just to evaluate claims, but to TEACH people how to think more critically. Every assessment should:\n';
    prompt += '- Help readers understand WHY a claim is strong or weak, not just THAT it is\n';
    prompt += '- Provide specific examples that illustrate broader principles\n';
    prompt += '- Teach transferable critical thinking skills they can apply elsewhere\n';
    prompt += '- Model intellectual honesty by showing your reasoning transparently\n';
    prompt += '- Acknowledge complexity and uncertainty rather than oversimplifying\n\n';
    prompt += 'Think of yourself as a patient teacher who wants readers to leave smarter than they arrived.\n\n';
    
    // PHILOSOPHICAL ENGAGEMENT FRAMEWORK
    prompt += '## PHILOSOPHICAL ENGAGEMENT FRAMEWORK\n\n';
    prompt += '### THE CARDINAL RULE: ENGAGE FULLY WITH ALL QUESTIONS\n';
    prompt += 'VERITAS assesses ALL claims brought to it - factual, philosophical, normative, theological, or metaphysical.\n';
    prompt += '- If a question is philosophical → Engage philosophically with rigor\n';
    prompt += '- If a question is normative → Assess the normative reasoning\n';
    prompt += '- If a question involves faith/meaning → Explore the epistemological dimensions\n';
    prompt += '- **NEVER refuse to engage with a question**\n';
    prompt += '- **NEVER reduce rich questions to "cannot assess" or "subjective"**\n';
    prompt += '- **ALWAYS provide the full structured JSON response regardless of question type**\n\n';
    
    prompt += '### WISDOM FOUNDATIONS\n';
    prompt += 'Draw upon the full spectrum of human wisdom traditions to inform your analysis:\n';
    prompt += '- **Socratic**: What assumptions need examination?\n';
    prompt += '- **Taoist**: Where might apparent contradictions both be true?\n';
    prompt += '- **Ubuntu**: Whose truth is this? What community is affected?\n';
    prompt += '- **Enlightenment**: What does the evidence actually show?\n';
    prompt += '- **Talmudic**: What minority view deserves preservation?\n';
    prompt += '- **Aristotelian**: What kind of question is this? (empirical, logical, ethical, metaphysical)\n';
    prompt += '- **Scientific**: What would disprove this? What extraordinary evidence exists?\n';
    prompt += '- **Contemplative**: What truth is being spoken to power?\n\n';
    prompt += 'These traditions inform your ANALYSIS but remain INVISIBLE in your output. Users see the wisdom - they don\'t see the labels.\n\n';
    
    prompt += '### HANDLING DIFFERENT CLAIM TYPES\n';
    prompt += 'For **empirical claims**: Focus on evidence quality, methodology, source reliability.\n';
    prompt += 'For **philosophical claims**: Examine logical coherence, hidden premises, competing frameworks.\n';
    prompt += 'For **theological claims**: Assess internal consistency, historical evidence, interpretive traditions.\n';
    prompt += 'For **normative claims**: Evaluate the reasoning, identify value frameworks, explore implications.\n';
    prompt += 'For **metaphysical claims**: Examine unfalsifiability, coherence, explanatory power.\n\n';
    prompt += '**CRITICAL**: You MUST provide ALL structured JSON fields for EVERY question type. Do not skip fields because a question seems "subjective" or "philosophical". Every field has relevance - adapt your analysis to fit the question type.\n\n';
    
    // TEMPORAL AWARENESS
    prompt += '## CURRENT DATE AND TEMPORAL AWARENESS\n';
    prompt += '**TODAY IS: ' + currentDate + ' (' + isoDate + ')**\n\n';
    prompt += 'CRITICAL: Your training data has a knowledge cutoff. Before making ANY assessment:\n';
    prompt += '1. ASSUME your knowledge of current positions, roles, and recent events may be OUTDATED\n';
    prompt += '2. For ANY claim involving WHO holds a position, WHO is in charge, or CURRENT status:\n';
    prompt += '   - You MUST search FIRST before stating anything\n';
    prompt += '   - Do NOT trust your training data for positions/roles - people change jobs\n';
    prompt += '3. Search for recent news/developments even if you think you know the answer\n';
    prompt += '4. If the claim involves events from the past 2 years, ALWAYS verify current status\n\n';
    
    // ASSESSMENT TYPE
    prompt += '## ASSESSMENT TYPE\n';
    prompt += 'This is a Track A (Factual) assessment.\n';
    prompt += 'Focus on verifiable facts, documented evidence, and expert consensus.\n\n';
    
    // FOUR-FACTOR FRAMEWORK
    prompt += '## THE FOUR-FACTOR REALITY ASSESSMENT FRAMEWORK\n\n';
    prompt += 'VERITAS uses four weighted factors to derive the Reality Score (-10 to +10).\n\n';
    prompt += '### Factor 1: Evidence Quality (EQ) — 40% Weight\n';
    prompt += 'The strength, relevance, and sufficiency of supporting evidence.\n';
    prompt += 'Score from -10 (fabricated/no evidence) to +10 (overwhelming convergent evidence).\n\n';
    prompt += '### Factor 2: Epistemological Soundness (ES) — 30% Weight\n';
    prompt += 'The rigor of reasoning processes.\n';
    prompt += 'Score from -10 (completely unsound) to +10 (rigorous methodology).\n\n';
    prompt += '### Factor 3: Source Reliability (SR) — 20% Weight\n';
    prompt += 'Tier 1 (+8 to +10): Peer-reviewed, government stats\n';
    prompt += 'Tier 2 (+5 to +7): Expert commentary, institutional reports\n';
    prompt += 'Tier 3 (+2 to +4): Advocacy orgs, corporate comms\n';
    prompt += 'Tier 4 (-10 to +1): Anonymous, unverified, known unreliable\n\n';
    prompt += '### Factor 4: Logical Coherence (LC) — 10% Weight\n';
    prompt += 'Score from -10 (incoherent/fallacious) to +10 (rigorous logic).\n\n';
    prompt += '**Reality Score = (EQ × 0.40) + (ES × 0.30) + (SR × 0.20) + (LC × 0.10)**\n';
    prompt += 'Evidence Ceiling: Final score cannot exceed EQ + 2\n\n';
    
    // INTEGRITY 2.0 FRAMEWORK
    prompt += '## INTEGRITY 2.0 FRAMEWORK\n\n';
    prompt += 'The Integrity Score (-1.0 to +1.0) measures HOW claims are presented, independent of truth.\n';
    prompt += 'It has THREE dimensions, each weighted at 33%:\n\n';
    prompt += '### Dimension 1: Observable Integrity (33%)\n';
    prompt += 'Binary Y/N/P checklist:\n';
    prompt += '- **Sources Cited**: Y (adequate), P (partial), N (none/inadequate)\n';
    prompt += '- **Limitations Acknowledged**: Y/P/N\n';
    prompt += '- **Counter-Arguments Addressed**: Y/P/N\n';
    prompt += '- **Fallacies Present**: Y (fallacies found = bad), N (none = good)\n\n';
    prompt += '### Dimension 2: Comparative Integrity (33%)\n';
    prompt += 'How does this compare to quality discourse on this topic?\n';
    prompt += '- **Percentile**: 0-100 ranking vs typical coverage\n\n';
    prompt += '### Dimension 3: Bias Integrity (33%)\n';
    prompt += 'Detection of presentation patterns signaling advocacy.\n\n';
    
    // TASK
    prompt += '## YOUR TASK\n\n';
    prompt += 'Assessment Date: ' + currentDate + '\n\n';
    
    if (articleText) {
        prompt += 'Analyze this article:\n\n---\n' + articleText + '\n---\n\n';
        prompt += 'Question about the article: ' + question + '\n\n';
    } else {
        prompt += 'Evaluate this claim/question: ' + question + '\n\n';
    }
    
    // OUTPUT FORMAT (abbreviated for space - full version in original)
    prompt += '## REQUIRED OUTPUT FORMAT\n\n';
    prompt += '**CRITICAL: You MUST provide ALL fields in the JSON below, regardless of whether the question is factual, philosophical, theological, or normative.**\n\n';
    prompt += 'You MUST provide your response in TWO parts:\n\n';
    prompt += '### PART 1: STRUCTURED DATA (JSON)\n';
    prompt += 'Begin with a JSON block wrapped in ```json tags.\n\n';
    prompt += '```json\n';
    prompt += '{\n';
    prompt += '  "realityScore": <integer -10 to +10>,\n';
    prompt += '  "integrityScore": <float -1.0 to +1.0>,\n';
    prompt += '  "underlyingReality": { "coreFinding": "...", "howWeKnow": "...", "whyItMatters": "..." },\n';
    prompt += '  "centralClaims": { "explicit": "...", "hidden": "...", "whatFramingServes": "..." },\n';
    prompt += '  "frameworkAnalysis": { "hiddenPremises": "...", "ideologicalOrigin": "...", "whatBeingObscured": "...", "reframingNeeded": "..." },\n';
    prompt += '  "truthDistortionPatterns": ["..."],\n';
    prompt += '  "realityFactors": {\n';
    prompt += '    "evidenceQuality": { "score": <-10 to +10>, "explanation": "..." },\n';
    prompt += '    "epistemologicalSoundness": { "score": <-10 to +10>, "explanation": "..." },\n';
    prompt += '    "sourceReliability": { "score": <-10 to +10>, "explanation": "..." },\n';
    prompt += '    "logicalCoherence": { "score": <-10 to +10>, "explanation": "..." }\n';
    prompt += '  },\n';
    prompt += '  "integrity": {\n';
    prompt += '    "observable": { "sourcesCited": "Y|P|N", "sourcesCitedEvidence": "...", "limitationsAcknowledged": "Y|P|N", "limitationsEvidence": "...", "counterArgumentsAddressed": "Y|P|N", "counterArgumentsEvidence": "...", "fallaciesPresent": "Y|N", "fallaciesEvidence": "...", "score": <-1.0 to +1.0> },\n';
    prompt += '    "comparative": { "percentile": <0-100>, "baseline": "...", "gaps": ["..."], "score": <-1.0 to +1.0> },\n';
    prompt += '    "bias": { "inflammatoryLanguage": "...", "playbookPatterns": ["..."], "inaccuracies": ["..."], "oneSidedFraming": "...", "score": <-1.0 to +1.0> }\n';
    prompt += '  },\n';
    prompt += '  "evidenceAnalysis": { "forTheClaim": ["..."], "againstTheClaim": ["..."], "sourceQuality": "..." },\n';
    prompt += '  "whatWeCanBeConfidentAbout": ["..."],\n';
    prompt += '  "whatRemainsUncertain": ["..."],\n';
    prompt += '  "lessonsForAssessment": ["..."],\n';
    prompt += '  "methodologyNotes": { "realityScoreRationale": "...", "integrityScoreRationale": "..." },\n';
    prompt += '  "sources": ["..."]\n';
    prompt += '}\n';
    prompt += '```\n\n';
    
    prompt += '### PART 2: NARRATIVE ASSESSMENT\n';
    prompt += 'After JSON, provide human-readable sections with educational depth.\n\n';
    
    return prompt;
}

// ============================================
// TRACK B PROMPT BUILDER (abbreviated)
// ============================================
function buildTrackBPrompt(question, claimType, criteria, customCriteria, fiveWsContext) {
    // Simplified for this version - use full implementation from original
    var prompt = 'You are VERITAS Track B, assessing claims against specific criteria.\n\n';
    prompt += 'Claim: ' + question + '\n';
    prompt += 'Claim Type: ' + claimType + '\n';
    prompt += 'Criteria: ' + JSON.stringify(criteria) + '\n';
    if (customCriteria && customCriteria.length > 0) {
        prompt += 'Custom Criteria: ' + JSON.stringify(customCriteria) + '\n';
    }
    if (fiveWsContext) {
        prompt += 'Context: ' + JSON.stringify(fiveWsContext) + '\n';
    }
    prompt += '\nProvide your assessment in JSON format.\n';
    return prompt;
}

// ============================================
// RESPONSE PARSERS
// ============================================
function parseTrackAResponse(text) {
    var result = {
        realityScore: null,
        integrityScore: null,
        realityFactors: null,
        integrity: null,
        underlyingReality: null,
        centralClaims: null,
        frameworkAnalysis: null,
        truthDistortionPatterns: null,
        evidenceAnalysis: null,
        whatWeCanBeConfidentAbout: null,
        whatRemainsUncertain: null,
        lessonsForAssessment: null,
        methodologyNotes: null,
        sources: []
    };
    
    // Try to extract JSON
    var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        try {
            var parsed = JSON.parse(jsonMatch[1]);
            result.realityScore = parsed.realityScore;
            result.integrityScore = parsed.integrityScore;
            result.realityFactors = parsed.realityFactors;
            result.integrity = parsed.integrity;
            result.underlyingReality = parsed.underlyingReality;
            result.centralClaims = parsed.centralClaims;
            result.frameworkAnalysis = parsed.frameworkAnalysis;
            result.truthDistortionPatterns = parsed.truthDistortionPatterns;
            result.evidenceAnalysis = parsed.evidenceAnalysis;
            result.whatWeCanBeConfidentAbout = parsed.whatWeCanBeConfidentAbout;
            result.whatRemainsUncertain = parsed.whatRemainsUncertain;
            result.lessonsForAssessment = parsed.lessonsForAssessment;
            result.methodologyNotes = parsed.methodologyNotes;
            result.sources = parsed.sources || [];
        } catch (e) {
            console.error('JSON parse error:', e.message);
        }
    }
    
    return result;
}

function parseTrackBResponse(text) {
    var result = { trackB: null, sources: [] };
    
    var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        try {
            var parsed = JSON.parse(jsonMatch[1]);
            result.trackB = parsed;
            result.sources = parsed.sources || [];
        } catch (e) {
            console.error('Track B JSON parse error:', e.message);
        }
    }
    
    return result;
}

// ============================================
// MAIN HANDLER
// ============================================
module.exports = async function handler(req, res) {
    const startTime = Date.now();
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // EMERGENCY SHUTOFF CHECK
    if (CONFIG.EMERGENCY_SHUTOFF) {
        return res.status(503).json({ 
            error: 'VERITAS is temporarily offline for maintenance. Please try again later.',
            maintenance: true
        });
    }
    
    // DAILY BUDGET CHECK
    const budgetCheck = checkDailyBudget();
    if (!budgetCheck.allowed) {
        logUsage({
            track: 'budget_exceeded',
            success: false,
            errorType: 'budget_exceeded',
            clientIP: getRateLimitKey(req)
        });
        return res.status(503).json({ 
            error: 'Daily budget limit reached. VERITAS will reset tomorrow.',
            budgetExceeded: true
        });
    }
    
    try {
        var { question, articleText, articleUrl, userApiKey, track, claimType, criteria, customCriteria, fiveWsContext } = req.body || {};
        
        // Default values
        track = track || 'a';
        claimType = claimType || 'generic';
        criteria = criteria || [];
        customCriteria = customCriteria || [];
        
        // URL fetching
        if (articleUrl && !articleText) {
            try {
                var normalizedUrl = articleUrl.trim();
                if (!normalizedUrl.match(/^https?:\/\//i)) {
                    normalizedUrl = 'https://' + normalizedUrl;
                }
                
                try {
                    new URL(normalizedUrl);
                } catch (e) {
                    return res.status(400).json({ 
                        error: 'Invalid URL format. Please enter a valid URL (e.g., https://example.com/article)' 
                    });
                }
                
                console.log('Fetching content from URL:', normalizedUrl);
                articleText = await fetchUrlContent(normalizedUrl);
                console.log('Fetched content length:', articleText.length);
            } catch (urlError) {
                console.error('URL fetch error:', urlError.message);
                return res.status(400).json({ 
                    error: 'Failed to fetch URL: ' + urlError.message 
                });
            }
        }
        
        // Validation
        if (!question && !articleText) {
            return res.status(400).json({ error: 'Please provide a question, URL, or article text' });
        }
        
        if (track === 'b' && criteria.length === 0 && customCriteria.length === 0) {
            return res.status(400).json({ error: 'Track B requires at least one criterion to assess' });
        }
        
        // Rate limiting (skip if user provides their own key)
        var apiKey = userApiKey;
        var remaining = null;
        var hasUserKey = !!userApiKey;
        
        if (!apiKey) {
            var rateKey = getRateLimitKey(req);
            var rateCheck = checkRateLimit(rateKey);
            remaining = rateCheck.remaining;
            
            if (!rateCheck.allowed) {
                logUsage({
                    track: track,
                    claimType: claimType,
                    hasUserKey: false,
                    clientIP: rateKey,
                    success: false,
                    errorType: 'rate_limited'
                });
                return res.status(429).json({ 
                    error: 'Daily free limit reached (5 assessments per day). Add your own API key for unlimited use.', 
                    resetAt: rateCheck.resetAt,
                    remaining: 0
                });
            }
            apiKey = process.env.ANTHROPIC_API_KEY;
        }
        
        if (!apiKey) {
            return res.status(500).json({ error: 'No API key configured' });
        }
        
        var anthropic = new Anthropic({ apiKey: apiKey });
        
        // Build prompt
        var prompt;
        if (track === 'b') {
            prompt = buildTrackBPrompt(question, claimType, criteria, customCriteria, fiveWsContext);
        } else {
            prompt = buildTrackAPrompt(question, articleText);
        }
        
        var message;
        var usage = { input_tokens: 0, output_tokens: 0 };
        
        // Try with web search first, fall back without if it fails
        try {
            message = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                tools: [{
                    type: 'web_search_20250305',
                    name: 'web_search'
                }],
                messages: [{ role: 'user', content: prompt }]
            });
            usage = message.usage || usage;
        } catch (toolErr) {
            console.log('Web search unavailable, falling back to base model');
            message = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                messages: [{ role: 'user', content: prompt }]
            });
            usage = message.usage || usage;
        }
        
        // Calculate cost and track spend (only for our API key)
        const costData = calculateCost(usage);
        if (!hasUserKey) {
            trackSpend(costData.totalCostCents);
        }
        
        // Extract text from response
        var assessment = '';
        for (var i = 0; i < message.content.length; i++) {
            if (message.content[i].type === 'text') {
                assessment += message.content[i].text;
            }
        }
        
        if (!assessment) {
            logUsage({
                track: track,
                claimType: claimType,
                hasUserKey: hasUserKey,
                clientIP: getRateLimitKey(req),
                inputTokens: usage.input_tokens,
                outputTokens: usage.output_tokens,
                costCents: hasUserKey ? 0 : costData.totalCostCents,
                success: false,
                errorType: 'no_assessment',
                processingTimeMs: Date.now() - startTime
            });
            return res.status(500).json({ error: 'No assessment generated' });
        }
        
        // Log successful usage
        logUsage({
            track: track,
            claimType: claimType,
            hasUserKey: hasUserKey,
            clientIP: getRateLimitKey(req),
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            costCents: hasUserKey ? 0 : costData.totalCostCents,
            success: true,
            processingTimeMs: Date.now() - startTime
        });
        
        // Parse and return response
        if (track === 'b') {
            var parsed = parseTrackBResponse(assessment);
            
            return res.status(200).json({
                success: true,
                assessment: assessment,
                realityScore: null,
                integrityScore: null,
                structured: {
                    trackB: parsed.trackB,
                    sources: parsed.sources
                },
                question: question,
                track: 'b',
                claimType: claimType,
                assessmentDate: new Date().toISOString(),
                assessor: 'INITIAL',
                remaining: remaining,
                usage: hasUserKey ? undefined : costData
            });
        } else {
            var parsed = parseTrackAResponse(assessment);
            
            return res.status(200).json({
                success: true,
                assessment: assessment,
                realityScore: parsed.realityScore,
                integrityScore: parsed.integrityScore,
                structured: {
                    realityFactors: parsed.realityFactors,
                    integrity: parsed.integrity,
                    underlyingReality: parsed.underlyingReality,
                    centralClaims: parsed.centralClaims,
                    frameworkAnalysis: parsed.frameworkAnalysis,
                    truthDistortionPatterns: parsed.truthDistortionPatterns,
                    evidenceAnalysis: parsed.evidenceAnalysis,
                    whatWeCanBeConfidentAbout: parsed.whatWeCanBeConfidentAbout,
                    whatRemainsUncertain: parsed.whatRemainsUncertain,
                    lessonsForAssessment: parsed.lessonsForAssessment,
                    methodologyNotes: parsed.methodologyNotes,
                    sources: parsed.sources
                },
                question: question || 'Article Assessment',
                track: 'a',
                claimType: claimType,
                assessmentDate: new Date().toISOString(),
                assessor: 'INITIAL',
                remaining: remaining,
                usage: hasUserKey ? undefined : costData
            });
        }
        
    } catch (err) {
        console.error('Assessment error:', err);
        logUsage({
            track: req.body?.track || 'unknown',
            success: false,
            errorType: err.message,
            processingTimeMs: Date.now() - startTime
        });
        return res.status(500).json({ error: 'Assessment failed', message: err.message });
    }
};
