/**
 * EventEmitter.js — SSE Event Formatting Module
 * =============================================
 * 
 * Standardized Server-Sent Events formatting for VERITAS streaming.
 * Handles all event types: status, chunk, section, score, error, complete.
 * 
 * Usage:
 *   const emitter = new EventEmitter(res);
 *   emitter.status('searching', 'Searching for evidence...', 0.2);
 *   emitter.chunk('reality', 'Based on the evidence...', false);
 *   emitter.complete({ totalTokens: 2847, duration: 12.4 });
 */

class EventEmitter {
    constructor(response) {
        this.res = response;
        this.eventId = 0;
    }

    /**
     * Send a raw SSE event
     * @param {string} event - Event type
     * @param {object} data - Event data
     */
    _emit(event, data) {
        this.eventId++;
        const lines = [
            `id: ${this.eventId}`,
            `event: ${event}`,
            `data: ${JSON.stringify(data)}`,
            '',
            ''
        ].join('\n');
        
        this.res.write(lines);
    }

    /**
     * Status event — progress updates
     * @param {string} phase - Current phase (connecting, searching, analyzing, etc.)
     * @param {string} message - Human-readable status message
     * @param {number} progress - Progress 0-1
     */
    status(phase, message, progress = 0) {
        this._emit('status', { phase, message, progress });
    }

    /**
     * Chunk event — incremental content
     * @param {string} type - Content type (reality, integrity, evidence, etc.)
     * @param {string} partial - Partial content
     * @param {boolean} complete - Whether this chunk completes the section
     */
    chunk(type, partial, complete = false) {
        this._emit('chunk', { type, partial, complete });
    }

    /**
     * Section event — complete section delivered
     * @param {string} name - Section name
     * @param {*} content - Section content (string or object)
     * @param {boolean} final - Whether this is the final version
     */
    section(name, content, final = true) {
        this._emit('section', { name, content, final });
    }

    /**
     * Score event — Reality/Integrity scores
     * @param {number} realityScore - Reality score (-10 to +10)
     * @param {number} integrityScore - Integrity score (-1 to +1)
     * @param {boolean} provisional - Whether scores may change
     */
    score(realityScore, integrityScore = null, provisional = false) {
        const data = { realityScore, provisional };
        if (integrityScore !== null) {
            data.integrityScore = integrityScore;
        }
        this._emit('score', data);
    }

    /**
     * Error event — something went wrong
     * @param {string} code - Error code
     * @param {string} message - Human-readable error message
     * @param {number} retryAfter - Seconds to wait before retry (optional)
     */
    error(code, message, retryAfter = null) {
        const data = { code, message };
        if (retryAfter !== null) {
            data.retryAfter = retryAfter;
        }
        this._emit('error', data);
    }

    /**
     * Complete event — stream finished
     * @param {object} options - Completion data
     * @param {boolean} options.success - Whether stream completed successfully
     * @param {number} options.totalTokens - Total tokens used
     * @param {number} options.duration - Duration in seconds
     */
    complete({ success = true, totalTokens = null, duration = null } = {}) {
        const data = { success };
        if (totalTokens !== null) data.totalTokens = totalTokens;
        if (duration !== null) data.duration = duration;
        this._emit('complete', data);
    }

    /**
     * Keepalive — prevent connection timeout
     */
    keepalive() {
        this.res.write(': keepalive\n\n');
    }
}

/**
 * Set up response headers for SSE
 * @param {Response} res - Express/Vercel response object
 */
function setupSSEHeaders(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Localized status messages for VINCULUM integration
 */
const STATUS_MESSAGES = {
    en: {
        connecting: 'Connecting...',
        searching: 'Searching for evidence...',
        analyzing: 'Analyzing claim...',
        evaluating: 'Evaluating integrity...',
        synthesizing: 'Synthesizing findings...',
        complete: 'Analysis complete'
    },
    es: {
        connecting: 'Conectando...',
        searching: 'Buscando evidencia...',
        analyzing: 'Analizando la afirmación...',
        evaluating: 'Evaluando integridad...',
        synthesizing: 'Sintetizando hallazgos...',
        complete: 'Análisis completo'
    },
    fr: {
        connecting: 'Connexion...',
        searching: 'Recherche de preuves...',
        analyzing: 'Analyse de l\'affirmation...',
        evaluating: 'Évaluation de l\'intégrité...',
        synthesizing: 'Synthèse des résultats...',
        complete: 'Analyse terminée'
    },
    de: {
        connecting: 'Verbindung wird hergestellt...',
        searching: 'Suche nach Beweisen...',
        analyzing: 'Analyse der Behauptung...',
        evaluating: 'Bewertung der Integrität...',
        synthesizing: 'Synthese der Ergebnisse...',
        complete: 'Analyse abgeschlossen'
    },
    zh: {
        connecting: '连接中...',
        searching: '搜索证据...',
        analyzing: '分析声明...',
        evaluating: '评估完整性...',
        synthesizing: '综合结果...',
        complete: '分析完成'
    },
    ja: {
        connecting: '接続中...',
        searching: '証拠を検索中...',
        analyzing: '主張を分析中...',
        evaluating: '整合性を評価中...',
        synthesizing: '結果を統合中...',
        complete: '分析完了'
    },
    ar: {
        connecting: '...جارٍ الاتصال',
        searching: '...جارٍ البحث عن الأدلة',
        analyzing: '...جارٍ تحليل الادعاء',
        evaluating: '...جارٍ تقييم النزاهة',
        synthesizing: '...جارٍ تجميع النتائج',
        complete: 'اكتمل التحليل'
    },
    he: {
        connecting: '...מתחבר',
        searching: '...מחפש ראיות',
        analyzing: '...מנתח את הטענה',
        evaluating: '...מעריך יושרה',
        synthesizing: '...מסנתז ממצאים',
        complete: 'הניתוח הושלם'
    },
    // Add more languages as needed
};

/**
 * Get localized status message
 * @param {string} phase - Status phase
 * @param {string} language - Language code
 * @returns {string} Localized message
 */
function getStatusMessage(phase, language = 'en') {
    const messages = STATUS_MESSAGES[language] || STATUS_MESSAGES.en;
    return messages[phase] || messages.en[phase] || phase;
}

module.exports = {
    EventEmitter,
    setupSSEHeaders,
    getStatusMessage,
    STATUS_MESSAGES
};
