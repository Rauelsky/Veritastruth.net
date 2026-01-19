/**
 * VERACITY v5.2 — TRACK A STREAMING: ASSESS-STREAM API
 * =====================================================
 * Vercel Serverless Function
 * 
 * Endpoint: /api/assess-stream
 * Method: POST
 * 
 * Streaming version of the assess endpoint using Server-Sent Events.
 * Provides progressive updates as Claude generates the assessment.
 * 
 * Events emitted:
 *   - status: Progress updates (connecting, analyzing, searching, evaluating, synthesizing, complete)
 *   - chunk: Incremental text content
 *   - section: Complete section data (when extracted)
 *   - score: Reality/Integrity scores (provisional then final)
 *   - error: Error notifications
 *   - complete: Stream finished with metadata
 * 
 * @version 1.0
 * @phase Phase 1 - Foundation
 */

const { EventEmitter, setupSSEHeaders, getStatusMessage, StreamParser } = require('../modules/streaming');
const { buildTrackAPrompt } = require('../modules/prompt-builders');

// Vercel config
export const config = {
    api: {
        bodyParser: true
    },
    maxDuration: 120 // Extended for complex assessments
};

// ============================================
// RESPONSE PARSER (extracted from assess.js)
// ============================================
function parseTrackAResponse(assessment) {
    const result = {
        realityScore: 0,
        integrityScore: 0,
        exactClaimBeingScored: '',
        questionType: '',
        questionTypeRationale: '',
        selectedFactors: [],
        scoreCalculation: '',
        realityFactors: {},
        integrity: {},
        underlyingReality: {},
        centralClaims: {},
        frameworkAnalysis: {},
        truthDistortionPatterns: [],
        evidenceAnalysis: {},
        whatWeCanBeConfidentAbout: [],
        whatRemainsUncertain: [],
        lessonsForAssessment: [],
        methodologyNotes: {},
        sources: [],
        plainTruth: {}
    };

    // Extract JSON block
    const jsonMatch = assessment.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            
            result.exactClaimBeingScored = parsed.exactClaimBeingScored || '';
            result.questionType = parsed.questionType || '';
            result.questionTypeRationale = parsed.questionTypeRationale || '';
            result.selectedFactors = parsed.selectedFactors || [];
            result.scoreCalculation = parsed.scoreCalculation || '';
            result.realityScore = parseInt(parsed.realityScore) || 0;
            result.integrityScore = parseFloat(parsed.integrityScore) || 0;
            result.underlyingReality = parsed.underlyingReality || {};
            result.centralClaims = parsed.centralClaims || {};
            result.frameworkAnalysis = parsed.frameworkAnalysis || {};
            result.truthDistortionPatterns = parsed.truthDistortionPatterns || [];
            result.integrity = parsed.integrity || {};
            result.evidenceAnalysis = parsed.evidenceAnalysis || {};
            result.whatWeCanBeConfidentAbout = parsed.whatWeCanBeConfidentAbout || [];
            result.whatRemainsUncertain = parsed.whatRemainsUncertain || [];
            result.lessonsForAssessment = parsed.lessonsForAssessment || [];
            result.methodologyNotes = parsed.methodologyNotes || {};
            result.sources = parsed.sources || [];
            result.plainTruth = parsed.plainTruth || {};

            // Build realityFactors from selectedFactors for frontend compatibility
            if (result.selectedFactors && result.selectedFactors.length > 0) {
                result.realityFactors = {};
                result.selectedFactors.forEach(factor => {
                    const key = factor.factor.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    result.realityFactors[key] = {
                        label: factor.factor,
                        score: factor.score,
                        weight: factor.weight,
                        explanation: factor.explanation,
                        whySelected: factor.whySelected
                    };
                });
            }
        } catch (e) {
            console.error('Failed to parse JSON from assessment:', e.message);
        }
    }

    return result;
}

// ============================================
// MAIN HANDLER
// ============================================
export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Set up SSE headers
    setupSSEHeaders(res);

    // Create event emitter and parser
    const emitter = new EventEmitter(res);
    const parser = new StreamParser();
    const startTime = Date.now();

    try {
        const { 
            query,
            question, // Accept both 'query' and 'question' for compatibility
            articleText = '',
            assessmentType = 'full',
            language = 'en'
        } = req.body;

        // Support both query and question parameters
        const inputQuery = query || question;

        if (!inputQuery && !articleText) {
            emitter.error('MISSING_QUERY', 'Query or article text is required');
            emitter.complete({ success: false });
            return res.end();
        }

        // Get API key
        const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VERITAS_DEV || process.env.VERITAS_PROD;
        if (!apiKey) {
            emitter.error('CONFIG_ERROR', 'API key not configured');
            emitter.complete({ success: false });
            return res.end();
        }

        // Emit initial status
        emitter.status('connecting', getStatusMessage('connecting', language), 0.05);

        // Build the full system prompt using shared builder
        const systemPrompt = buildTrackAPrompt(inputQuery, articleText, language);
        console.log(`[assess-stream] Prompt built, length: ${systemPrompt.length}`);

        // Start streaming request to Claude
        emitter.status('analyzing', getStatusMessage('analyzing', language), 0.1);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                stream: true,
                messages: [{ role: 'user', content: systemPrompt }],
                tools: [
                    {
                        type: 'web_search_20250305',
                        name: 'web_search',
                        max_uses: 10
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'API request failed';
            try {
                const error = JSON.parse(errorText);
                errorMessage = error.error?.message || errorMessage;
            } catch (e) {
                errorMessage = errorText.substring(0, 200);
            }
            emitter.error('API_ERROR', errorMessage);
            emitter.complete({ success: false });
            return res.end();
        }

        // Process the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let totalTokens = 0;
        let searchCount = 0;
        let fullText = '';

        emitter.status('searching', getStatusMessage('searching', language), 0.2);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            
            // Parse SSE events from Claude's stream
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const event = JSON.parse(data);
                    
                    switch (event.type) {
                        case 'message_start':
                            // Message started
                            break;
                            
                        case 'content_block_start':
                            if (event.content_block?.type === 'tool_use') {
                                searchCount++;
                                emitter.status(
                                    'searching', 
                                    `${getStatusMessage('searching', language)} (${searchCount})`,
                                    Math.min(0.2 + (searchCount * 0.05), 0.5)
                                );
                            }
                            break;
                            
                        case 'content_block_delta':
                            if (event.delta?.type === 'text_delta') {
                                const text = event.delta.text;
                                fullText += text;
                                
                                // Feed to parser for score extraction
                                const events = parser.process(text);
                                
                                // Emit any extracted events
                                for (const evt of events) {
                                    if (evt.type === 'score') {
                                        emitter.score(
                                            evt.realityScore, 
                                            evt.integrityScore, 
                                            evt.provisional
                                        );
                                        emitter.status(
                                            'evaluating',
                                            getStatusMessage('evaluating', language),
                                            0.6
                                        );
                                    } else if (evt.type === 'section') {
                                        emitter.section(evt.name, evt.content, evt.final);
                                    }
                                }
                                
                                // Emit raw chunk for progressive display
                                emitter.chunk('text', text, false);
                            }
                            break;
                            
                        case 'message_delta':
                            if (event.usage) {
                                totalTokens = (event.usage.input_tokens || 0) + 
                                             (event.usage.output_tokens || 0);
                            }
                            break;
                            
                        case 'message_stop':
                            // Message complete
                            break;
                    }
                } catch (parseError) {
                    // Skip malformed events
                    console.error('[assess-stream] Parse error:', parseError.message);
                }
            }
        }

        // Parse the complete response
        emitter.status('synthesizing', getStatusMessage('synthesizing', language), 0.9);
        
        const parsed = parseTrackAResponse(fullText);
        
        // Emit final scores (non-provisional)
        emitter.score(parsed.realityScore, parsed.integrityScore, false);
        
        // Emit structured sections
        if (parsed.underlyingReality) {
            emitter.section('underlyingReality', parsed.underlyingReality, true);
        }
        if (parsed.centralClaims) {
            emitter.section('centralClaims', parsed.centralClaims, true);
        }
        if (parsed.evidenceAnalysis) {
            emitter.section('evidenceAnalysis', parsed.evidenceAnalysis, true);
        }
        if (parsed.plainTruth) {
            emitter.section('plainTruth', parsed.plainTruth, true);
        }

        // Calculate duration and complete
        const duration = (Date.now() - startTime) / 1000;
        
        emitter.status('complete', getStatusMessage('complete', language), 1.0);
        emitter.complete({
            success: true,
            totalTokens,
            duration,
            searchCount,
            // Include full parsed data for frontend
            parsed: {
                realityScore: parsed.realityScore,
                integrityScore: parsed.integrityScore,
                exactClaimBeingScored: parsed.exactClaimBeingScored,
                questionType: parsed.questionType,
                structured: {
                    selectedFactors: parsed.selectedFactors,
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
                    sources: parsed.sources,
                    plainTruth: parsed.plainTruth
                }
            }
        });

    } catch (error) {
        console.error('[assess-stream] Error:', error);
        emitter.error('INTERNAL_ERROR', error.message || 'Internal server error');
        emitter.complete({ success: false });
    }

    res.end();
}
