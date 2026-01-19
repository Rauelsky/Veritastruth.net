/**
 * VERITAS Velocity — StreamingRenderer Client
 * ============================================
 * 
 * Client-side Server-Sent Events handler for progressive assessment display.
 * Phase 1: Basic SSE connection, event parsing, progressive rendering.
 * 
 * Usage:
 *   const stream = new VelocityStream('/api/assess-stream', {
 *       onStatus: (phase, message, progress) => updateProgressBar(progress),
 *       onChunk: (type, content) => appendToDisplay(content),
 *       onScore: (reality, integrity, provisional) => updateScores(reality, integrity),
 *       onSection: (name, content, final) => renderSection(name, content),
 *       onComplete: (metadata) => finishAssessment(metadata),
 *       onError: (code, message) => showError(message)
 *   });
 *   
 *   stream.start({ query: "Is the moon landing real?", language: "en" });
 * 
 * @version 0.1
 * @category DISPLAY
 * @phase Phase 1 - Foundation
 */

class VelocityStream {
    constructor(endpoint, callbacks = {}) {
        this.endpoint = endpoint;
        this.callbacks = {
            onStatus: callbacks.onStatus || (() => {}),
            onChunk: callbacks.onChunk || (() => {}),
            onScore: callbacks.onScore || (() => {}),
            onSection: callbacks.onSection || (() => {}),
            onComplete: callbacks.onComplete || (() => {}),
            onError: callbacks.onError || (() => {})
        };
        
        this.eventSource = null;
        this.abortController = null;
        this.isActive = false;
        this.startTime = null;
        this.accumulatedText = '';
        this.sections = {};
        this.scores = { reality: null, integrity: null };
    }
    
    /**
     * Start streaming assessment
     * @param {Object} params - Assessment parameters
     * @param {string} params.query - The claim/question to assess
     * @param {string} [params.language='en'] - VINCULUM language code
     * @param {string} [params.assessmentType='full'] - Assessment type
     */
    async start(params) {
        if (this.isActive) {
            console.warn('VelocityStream: Stream already active');
            return;
        }
        
        this.isActive = true;
        this.startTime = Date.now();
        this.accumulatedText = '';
        this.sections = {};
        this.scores = { reality: null, integrity: null };
        
        // Create abort controller for cancellation
        this.abortController = new AbortController();
        
        try {
            // Make POST request to initiate stream
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    query: params.query,
                    language: params.language || 'en',
                    assessmentType: params.assessmentType || 'full'
                }),
                signal: this.abortController.signal
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Process the stream
            await this._processStream(response.body);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('VelocityStream: Aborted by user');
            } else {
                console.error('VelocityStream error:', error);
                this.callbacks.onError('STREAM_ERROR', error.message);
            }
        } finally {
            this.isActive = false;
        }
    }
    
    /**
     * Stop the current stream
     */
    stop() {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.isActive = false;
    }
    
    /**
     * Process the SSE stream from the server
     * @private
     */
    async _processStream(body) {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                // Process any remaining buffer
                if (buffer.trim()) {
                    this._processSSEBuffer(buffer);
                }
                break;
            }
            
            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE events (separated by double newlines)
            const events = buffer.split('\n\n');
            buffer = events.pop() || ''; // Keep incomplete event in buffer
            
            for (const eventText of events) {
                if (eventText.trim()) {
                    this._processSSEEvent(eventText);
                }
            }
        }
    }
    
    /**
     * Process remaining buffer at stream end
     * @private
     */
    _processSSEBuffer(buffer) {
        const lines = buffer.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                this._parseEventData(line.slice(6));
            }
        }
    }
    
    /**
     * Process a single SSE event
     * @private
     */
    _processSSEEvent(eventText) {
        const lines = eventText.split('\n');
        let eventType = 'message';
        let data = '';
        
        for (const line of lines) {
            if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
                data = line.slice(6);
            }
        }
        
        if (data) {
            this._handleEvent(eventType, data);
        }
    }
    
    /**
     * Handle a parsed event
     * @private
     */
    _handleEvent(eventType, data) {
        try {
            const parsed = JSON.parse(data);
            
            switch (eventType) {
                case 'status':
                    this.callbacks.onStatus(
                        parsed.phase,
                        parsed.message,
                        parsed.progress
                    );
                    break;
                    
                case 'chunk':
                    this.accumulatedText += parsed.content || '';
                    this.callbacks.onChunk(
                        parsed.type || 'text',
                        parsed.content,
                        parsed.final
                    );
                    break;
                    
                case 'section':
                    this.sections[parsed.name] = parsed.content;
                    this.callbacks.onSection(
                        parsed.name,
                        parsed.content,
                        parsed.final
                    );
                    break;
                    
                case 'score':
                    this.scores.reality = parsed.realityScore;
                    this.scores.integrity = parsed.integrityScore;
                    this.callbacks.onScore(
                        parsed.realityScore,
                        parsed.integrityScore,
                        parsed.provisional
                    );
                    break;
                    
                case 'error':
                    this.callbacks.onError(
                        parsed.code,
                        parsed.message
                    );
                    break;
                    
                case 'complete':
                    const duration = (Date.now() - this.startTime) / 1000;
                    this.callbacks.onComplete({
                        success: parsed.success,
                        duration: duration,
                        totalTokens: parsed.totalTokens,
                        sections: this.sections,
                        scores: this.scores,
                        rawText: this.accumulatedText
                    });
                    break;
                    
                default:
                    console.log('VelocityStream: Unknown event type:', eventType);
            }
            
        } catch (parseError) {
            console.error('VelocityStream: Parse error:', parseError, 'Data:', data);
        }
    }
    
    /**
     * Get current stream state
     */
    getState() {
        return {
            isActive: this.isActive,
            elapsed: this.startTime ? (Date.now() - this.startTime) / 1000 : 0,
            textLength: this.accumulatedText.length,
            sections: Object.keys(this.sections),
            scores: this.scores
        };
    }
}

/**
 * ProgressiveRenderer - UI helper for progressive display
 * Handles the visual updates as content streams in
 */
class ProgressiveRenderer {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        this.options = {
            showCursor: options.showCursor !== false,
            cursorChar: options.cursorChar || '▌',
            animateProgress: options.animateProgress !== false,
            progressBar: options.progressBar || null,
            statusElement: options.statusElement || null,
            ...options
        };
        
        this.cursorElement = null;
        this.textBuffer = '';
    }
    
    /**
     * Initialize the renderer
     */
    init() {
        if (this.container) {
            this.container.innerHTML = '';
            if (this.options.showCursor) {
                this.cursorElement = document.createElement('span');
                this.cursorElement.className = 'velocity-cursor';
                this.cursorElement.textContent = this.options.cursorChar;
                this.container.appendChild(this.cursorElement);
            }
        }
        this.textBuffer = '';
    }
    
    /**
     * Append text chunk
     */
    appendText(text) {
        this.textBuffer += text;
        
        if (this.container && this.cursorElement) {
            // Insert text before cursor
            const textNode = document.createTextNode(text);
            this.container.insertBefore(textNode, this.cursorElement);
        } else if (this.container) {
            this.container.textContent += text;
        }
    }
    
    /**
     * Update progress
     */
    setProgress(progress, message) {
        if (this.options.progressBar) {
            const bar = typeof this.options.progressBar === 'string'
                ? document.getElementById(this.options.progressBar)
                : this.options.progressBar;
            if (bar) {
                bar.style.width = `${progress * 100}%`;
            }
        }
        
        if (this.options.statusElement && message) {
            const status = typeof this.options.statusElement === 'string'
                ? document.getElementById(this.options.statusElement)
                : this.options.statusElement;
            if (status) {
                status.textContent = message;
            }
        }
    }
    
    /**
     * Remove cursor (call on complete)
     */
    finalize() {
        if (this.cursorElement) {
            this.cursorElement.remove();
            this.cursorElement = null;
        }
    }
    
    /**
     * Get accumulated text
     */
    getText() {
        return this.textBuffer;
    }
}

/**
 * StatusMessages - Localized status messages
 * Mirrors server-side STATUS_MESSAGES from EventEmitter.js
 */
const StatusMessages = {
    en: {
        connecting: 'Connecting to VERITAS...',
        analyzing: 'Analyzing claim...',
        searching: 'Searching for evidence...',
        evaluating: 'Evaluating findings...',
        synthesizing: 'Synthesizing assessment...',
        complete: 'Assessment complete'
    },
    es: {
        connecting: 'Conectando con VERITAS...',
        analyzing: 'Analizando afirmación...',
        searching: 'Buscando evidencia...',
        evaluating: 'Evaluando hallazgos...',
        synthesizing: 'Sintetizando evaluación...',
        complete: 'Evaluación completa'
    },
    fr: {
        connecting: 'Connexion à VERITAS...',
        analyzing: 'Analyse de l\'affirmation...',
        searching: 'Recherche de preuves...',
        evaluating: 'Évaluation des résultats...',
        synthesizing: 'Synthèse de l\'évaluation...',
        complete: 'Évaluation terminée'
    },
    de: {
        connecting: 'Verbindung zu VERITAS...',
        analyzing: 'Analysiere Behauptung...',
        searching: 'Suche nach Beweisen...',
        evaluating: 'Bewerte Ergebnisse...',
        synthesizing: 'Synthesiere Bewertung...',
        complete: 'Bewertung abgeschlossen'
    },
    zh: {
        connecting: '正在连接 VERITAS...',
        analyzing: '正在分析声明...',
        searching: '正在搜索证据...',
        evaluating: '正在评估结果...',
        synthesizing: '正在综合评估...',
        complete: '评估完成'
    },
    ja: {
        connecting: 'VERITASに接続中...',
        analyzing: '主張を分析中...',
        searching: '証拠を検索中...',
        evaluating: '結果を評価中...',
        synthesizing: '評価を統合中...',
        complete: '評価完了'
    },
    ar: {
        connecting: 'جارٍ الاتصال بـ VERITAS...',
        analyzing: 'جارٍ تحليل الادعاء...',
        searching: 'جارٍ البحث عن الأدلة...',
        evaluating: 'جارٍ تقييم النتائج...',
        synthesizing: 'جارٍ تجميع التقييم...',
        complete: 'اكتمل التقييم'
    },
    he: {
        connecting: 'מתחבר ל-VERITAS...',
        analyzing: 'מנתח את הטענה...',
        searching: 'מחפש ראיות...',
        evaluating: 'מעריך ממצאים...',
        synthesizing: 'מסנתז הערכה...',
        complete: 'ההערכה הושלמה'
    }
};

/**
 * Get status message for language
 */
function getStatusMessage(phase, language = 'en') {
    const messages = StatusMessages[language] || StatusMessages.en;
    return messages[phase] || messages.analyzing;
}

// CSS for the streaming cursor
const velocityStreamStyles = `
.velocity-cursor {
    display: inline-block;
    animation: velocity-blink 1s step-end infinite;
    color: var(--accent-teal, #0d9488);
    font-weight: bold;
}

@keyframes velocity-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

.velocity-progress-bar {
    height: 4px;
    background: var(--bg-tertiary, #1e293b);
    border-radius: 2px;
    overflow: hidden;
}

.velocity-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-teal, #0d9488), var(--accent-cyan, #22d3ee));
    transition: width 0.3s ease;
}

.velocity-status {
    font-size: 0.85rem;
    color: var(--text-secondary, #94a3b8);
    margin-top: 8px;
}
`;

// Inject styles if not present
if (typeof document !== 'undefined') {
    const styleId = 'velocity-stream-styles';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = velocityStreamStyles;
        document.head.appendChild(styleEl);
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VelocityStream, ProgressiveRenderer, StatusMessages, getStatusMessage };
} else if (typeof window !== 'undefined') {
    window.VelocityStream = VelocityStream;
    window.ProgressiveRenderer = ProgressiveRenderer;
    window.StatusMessages = StatusMessages;
    window.getStatusMessage = getStatusMessage;
}
