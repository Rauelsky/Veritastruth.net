/**
 * StreamParser.js — Incremental Stream Parsing Module
 * ===================================================
 * 
 * Parses Claude's streaming output to extract meaningful events
 * before the full JSON response is complete.
 * 
 * Challenge: Claude outputs JSON, which isn't valid until complete.
 * Solution: Use markers and pattern matching for early extraction.
 */

class StreamParser {
    constructor(options = {}) {
        this.buffer = '';
        this.sections = {};
        this.scores = { reality: null, integrity: null };
        this.scoresSent = false;
        this.options = {
            // Section markers (if using custom output format)
            sectionStart: options.sectionStart || '▸▸▸',
            sectionEnd: options.sectionEnd || '◂◂◂',
            ...options
        };
    }

    /**
     * Process an incoming chunk and extract any complete events
     * @param {string} chunk - Raw text chunk from Claude stream
     * @returns {Array} Array of events to emit
     */
    process(chunk) {
        this.buffer += chunk;
        const events = [];

        // Try to extract scores (appear in JSON early)
        events.push(...this._extractScores());

        // Try to extract marked sections
        events.push(...this._extractMarkedSections());

        // Try to extract JSON sections if buffer looks like JSON
        events.push(...this._extractJSONSections());

        return events;
    }

    /**
     * Extract Reality/Integrity scores from buffer
     * @returns {Array} Score events
     */
    _extractScores() {
        const events = [];

        // Look for realityScore in JSON-like content
        if (!this.scores.reality) {
            const realityMatch = this.buffer.match(/"realityScore"\s*:\s*(-?\d+(?:\.\d+)?)/);
            if (realityMatch) {
                this.scores.reality = parseFloat(realityMatch[1]);
                events.push({
                    type: 'score',
                    realityScore: this.scores.reality,
                    provisional: true
                });
            }
        }

        // Look for integrityScore
        if (!this.scores.integrity) {
            const integrityMatch = this.buffer.match(/"integrityScore"\s*:\s*(-?\d+(?:\.\d+)?)/);
            if (integrityMatch) {
                this.scores.integrity = parseFloat(integrityMatch[1]);
                events.push({
                    type: 'score',
                    realityScore: this.scores.reality,
                    integrityScore: this.scores.integrity,
                    provisional: true
                });
            }
        }

        return events;
    }

    /**
     * Extract sections using marker format: ▸▸▸sectionName▸▸▸content◂◂◂sectionName◂◂◂
     * @returns {Array} Section events
     */
    _extractMarkedSections() {
        const events = [];
        const { sectionStart, sectionEnd } = this.options;
        
        // Regex for marked sections
        const pattern = new RegExp(
            `${this._escapeRegex(sectionStart)}(\\w+)${this._escapeRegex(sectionStart)}([\\s\\S]*?)${this._escapeRegex(sectionEnd)}\\1${this._escapeRegex(sectionEnd)}`,
            'g'
        );

        let match;
        while ((match = pattern.exec(this.buffer)) !== null) {
            const [full, name, content] = match;
            
            // Skip if we already have this section
            if (this.sections[name]) continue;
            
            this.sections[name] = content.trim();
            events.push({
                type: 'section',
                name,
                content: content.trim(),
                final: true
            });
            
            // Remove the matched section from buffer
            this.buffer = this.buffer.replace(full, '');
        }

        return events;
    }

    /**
     * Try to extract complete JSON sections from buffer
     * This is more speculative and may produce partial results
     * @returns {Array} Section events
     */
    _extractJSONSections() {
        const events = [];

        // Common section names in VERITAS assessments
        const sectionNames = [
            'underlyingReality',
            'underlyingTruth', 
            'centralClaims',
            'evidenceSummary',
            'truthDistortionPatterns',
            'confidenceStatement',
            'headline'
        ];

        for (const name of sectionNames) {
            if (this.sections[name]) continue;

            // Try to find complete string value
            const stringPattern = new RegExp(`"${name}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
            const stringMatch = this.buffer.match(stringPattern);
            
            if (stringMatch) {
                try {
                    // Parse the escaped string
                    const content = JSON.parse(`"${stringMatch[1]}"`);
                    this.sections[name] = content;
                    events.push({
                        type: 'section',
                        name,
                        content,
                        final: false // May be refined when full JSON parses
                    });
                } catch (e) {
                    // String not complete yet, skip
                }
            }

            // Try to find array value
            const arrayPattern = new RegExp(`"${name}"\\s*:\\s*\\[([^\\]]+)\\]`);
            const arrayMatch = this.buffer.match(arrayPattern);
            
            if (arrayMatch) {
                try {
                    const content = JSON.parse(`[${arrayMatch[1]}]`);
                    this.sections[name] = content;
                    events.push({
                        type: 'section',
                        name,
                        content,
                        final: false
                    });
                } catch (e) {
                    // Array not complete yet, skip
                }
            }
        }

        return events;
    }

    /**
     * Attempt to parse the full buffer as complete JSON
     * Call this when stream ends to get final parsed result
     * @returns {object|null} Parsed JSON or null if invalid
     */
    finalize() {
        // Clean up any markdown code blocks
        let cleaned = this.buffer
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse final buffer:', e.message);
            return null;
        }
    }

    /**
     * Get current buffer contents (for debugging)
     * @returns {string} Current buffer
     */
    getBuffer() {
        return this.buffer;
    }

    /**
     * Get all extracted sections so far
     * @returns {object} Sections map
     */
    getSections() {
        return { ...this.sections };
    }

    /**
     * Get current scores
     * @returns {object} Scores object
     */
    getScores() {
        return { ...this.scores };
    }

    /**
     * Reset parser state
     */
    reset() {
        this.buffer = '';
        this.sections = {};
        this.scores = { reality: null, integrity: null };
        this.scoresSent = false;
    }

    /**
     * Escape special regex characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

/**
 * TextAccumulator — simple text buffer for streaming
 * Use when you just want to accumulate and emit text chunks
 */
class TextAccumulator {
    constructor(options = {}) {
        this.buffer = '';
        this.emitThreshold = options.emitThreshold || 50; // Emit every N chars
        this.pendingEmit = '';
    }

    /**
     * Add text to buffer
     * @param {string} text - Text to add
     * @returns {string|null} Text to emit (if threshold reached) or null
     */
    add(text) {
        this.pendingEmit += text;
        
        if (this.pendingEmit.length >= this.emitThreshold) {
            const toEmit = this.pendingEmit;
            this.buffer += toEmit;
            this.pendingEmit = '';
            return toEmit;
        }
        
        return null;
    }

    /**
     * Flush remaining text
     * @returns {string} Remaining text
     */
    flush() {
        const remaining = this.pendingEmit;
        this.buffer += remaining;
        this.pendingEmit = '';
        return remaining;
    }

    /**
     * Get full accumulated text
     * @returns {string} All text
     */
    getAll() {
        return this.buffer + this.pendingEmit;
    }
}

module.exports = {
    StreamParser,
    TextAccumulator
};
