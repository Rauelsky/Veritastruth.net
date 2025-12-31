/**
 * VERACITY v5.0 — EXPORT MODULE
 * ==============================
 * Module: export.js
 * Version: 1.1.0
 * Last Modified: 2025-12-30
 * 
 * PURPOSE:
 * Session state tracking and export functionality
 * 
 * DATA STRUCTURE (per architecture schema v1.5.0):
 * SessionState {
 *   id: string,                    // v1.1.0: Unique session identifier
 *   startTime: ISO timestamp,
 *   endTime: ISO timestamp | null, // v1.1.0: Session end time (null if active)
 *   queries: [{
 *     input: "User's question",
 *     timestamp: ISO timestamp,
 *     classification: ClassificationResult,
 *     userOverride: 'A'|'B'|'C'|null,  // v1.1.0: Track if user overrode classifier
 *     finalTrack: 'A'|'B'|'C',          // v1.1.0: Final track after any override
 *     factoidsViewed: ["factoid_id_1", "factoid_id_2"],
 *     sourcesReferenced: ["url_1", "url_2"]
 *   }],
 *   trackStats: {                  // v1.1.0: Aggregate statistics
 *     A: { count: 0, overrides: 0 },
 *     B: { count: 0, overrides: 0 },
 *     C: { count: 0, overrides: 0 }
 *   },
 *   metadata: {                    // v1.1.0: Session metadata
 *     userNotes: string | null
 *   },
 *   exportableItemCount: 0,        // Drives the EXPORT number display
 *   transcriptReady: false
 * }
 * 
 * DEPENDENCIES: classifier.js, factoids.js
 * DEPENDED ON BY: main.html
 * 
 * CHANGE IMPACT: MEDIUM — Session state tracking
 * 
 * CHANGELOG:
 * v1.1.0 (2025-12-30): Added session ID, endTime, userOverride/finalTrack,
 *                       trackStats, metadata.userNotes, getSessionStats(),
 *                       endSession(), logUserOverride(), setUserNotes()
 * v1.0.0 (2025-12-30): Initial implementation
 * 
 * ⚠️ IMMUTABLE until change protocol executed
 */

const VeracityExport = (function() {
    'use strict';

    // ==================== SESSION STATE ====================
    // Structure EXACTLY as specified in architecture schema v1.5.0
    
    /**
     * Generates a unique session ID
     * Format: VERACITY-YYYYMMDD-HHMMSS-XXXX (random suffix)
     * @returns {string}
     */
    function generateSessionId() {
        const now = new Date();
        const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '');
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `VERACITY-${datePart}-${timePart}-${randomPart}`;
    }
    
    /**
     * Creates a new SessionState object
     * @returns {Object} SessionState per architecture specification v1.5.0
     */
    function createSessionState() {
        return {
            id: generateSessionId(),
            startTime: new Date().toISOString(),
            endTime: null,
            queries: [],
            trackStats: {
                A: { count: 0, overrides: 0 },
                B: { count: 0, overrides: 0 },
                C: { count: 0, overrides: 0 }
            },
            metadata: {
                userNotes: null
            },
            exportableItemCount: 0,
            transcriptReady: false
        };
    }

    // ==================== QUERY LOGGING ====================
    
    /**
     * Logs a query to the session
     * @param {Object} sessionState - Current session state
     * @param {Object} queryData - Query data to log
     * @param {string} queryData.input - User's question
     * @param {Object} queryData.classification - ClassificationResult from classifier.js
     * @returns {Object} Updated sessionState
     */
    function logQuery(sessionState, queryData) {
        const track = queryData.classification.track;
        const query = {
            input: queryData.input,
            timestamp: new Date().toISOString(),
            classification: queryData.classification,
            userOverride: null,
            finalTrack: track !== 'AMBIGUOUS' ? track : null,
            factoidsViewed: [],
            sourcesReferenced: []
        };
        
        sessionState.queries.push(query);
        sessionState.exportableItemCount = sessionState.queries.length;
        
        // Update track stats if not ambiguous
        if (track && track !== 'AMBIGUOUS' && sessionState.trackStats[track]) {
            sessionState.trackStats[track].count++;
        }
        
        // Mark transcript as ready once we have at least one query
        if (sessionState.queries.length > 0) {
            sessionState.transcriptReady = true;
        }
        
        return sessionState;
    }
    
    /**
     * Logs a user override of the classifier's track selection
     * @param {Object} sessionState - Current session state
     * @param {string} newTrack - Track selected by user ('A', 'B', or 'C')
     * @returns {Object} Updated sessionState
     */
    function logUserOverride(sessionState, newTrack) {
        if (sessionState.queries.length > 0) {
            const currentQuery = sessionState.queries[sessionState.queries.length - 1];
            const originalTrack = currentQuery.classification.track;
            
            // Only count as override if different from original classification
            if (originalTrack !== newTrack && originalTrack !== 'AMBIGUOUS') {
                currentQuery.userOverride = newTrack;
                
                // Decrement original track count, increment override count
                if (sessionState.trackStats[originalTrack]) {
                    sessionState.trackStats[originalTrack].count = 
                        Math.max(0, sessionState.trackStats[originalTrack].count - 1);
                }
                if (sessionState.trackStats[newTrack]) {
                    sessionState.trackStats[newTrack].overrides++;
                }
            }
            
            // Always update finalTrack
            currentQuery.finalTrack = newTrack;
            
            // Update track count for new track
            if (sessionState.trackStats[newTrack]) {
                sessionState.trackStats[newTrack].count++;
            }
        }
        return sessionState;
    }

    /**
     * Logs a factoid view to the current query
     * @param {Object} sessionState - Current session state
     * @param {string} factoidId - ID of the factoid viewed
     * @returns {Object} Updated sessionState
     */
    function logFactoidViewed(sessionState, factoidId) {
        if (sessionState.queries.length > 0) {
            const currentQuery = sessionState.queries[sessionState.queries.length - 1];
            if (!currentQuery.factoidsViewed.includes(factoidId)) {
                currentQuery.factoidsViewed.push(factoidId);
            }
        }
        return sessionState;
    }

    /**
     * Logs a source reference to the current query
     * @param {Object} sessionState - Current session state
     * @param {string} sourceUrl - URL or reference of the source
     * @returns {Object} Updated sessionState
     */
    function logSourceReferenced(sessionState, sourceUrl) {
        if (sessionState.queries.length > 0) {
            const currentQuery = sessionState.queries[sessionState.queries.length - 1];
            if (!currentQuery.sourcesReferenced.includes(sourceUrl)) {
                currentQuery.sourcesReferenced.push(sourceUrl);
            }
        }
        return sessionState;
    }

    // ==================== EXPORT FUNCTIONS ====================
    
    /**
     * Gets the exportable item count (drives numExport display)
     * @param {Object} sessionState
     * @returns {number}
     */
    function getExportableItemCount(sessionState) {
        return sessionState.exportableItemCount;
    }

    /**
     * Checks if transcript is ready for export
     * @param {Object} sessionState
     * @returns {boolean}
     */
    function isTranscriptReady(sessionState) {
        return sessionState.transcriptReady;
    }
    
    /**
     * Ends the session and sets endTime
     * @param {Object} sessionState
     * @returns {Object} Updated sessionState
     */
    function endSession(sessionState) {
        sessionState.endTime = new Date().toISOString();
        return sessionState;
    }
    
    /**
     * Sets user notes for the session
     * @param {Object} sessionState
     * @param {string} notes - User's notes about the session
     * @returns {Object} Updated sessionState
     */
    function setUserNotes(sessionState, notes) {
        sessionState.metadata.userNotes = notes;
        return sessionState;
    }
    
    /**
     * Gets session statistics summary
     * @param {Object} sessionState
     * @returns {Object} Statistics object
     */
    function getSessionStats(sessionState) {
        const duration = getSessionDuration(sessionState);
        const totalQueries = sessionState.queries.length;
        const totalOverrides = Object.values(sessionState.trackStats)
            .reduce((sum, track) => sum + track.overrides, 0);
        
        return {
            sessionId: sessionState.id,
            duration: duration,
            durationFormatted: formatDuration(duration),
            totalQueries: totalQueries,
            trackStats: sessionState.trackStats,
            totalOverrides: totalOverrides,
            overrideRate: totalQueries > 0 
                ? Math.round((totalOverrides / totalQueries) * 100) 
                : 0,
            hasUserNotes: !!sessionState.metadata.userNotes
        };
    }
    
    /**
     * Gets session duration in milliseconds
     * @param {Object} sessionState
     * @returns {number} Duration in ms (or time since start if session active)
     */
    function getSessionDuration(sessionState) {
        const start = new Date(sessionState.startTime);
        const end = sessionState.endTime 
            ? new Date(sessionState.endTime) 
            : new Date();
        return end - start;
    }
    
    /**
     * Formats duration in human-readable format
     * @param {number} ms - Duration in milliseconds
     * @returns {string}
     */
    function formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Generates transcript from session state
     * @param {Object} sessionState
     * @param {string} format - 'markdown' | 'text' | 'json'
     * @returns {string} Formatted transcript
     */
    function generateTranscript(sessionState, format = 'markdown') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(sessionState, null, 2);
            case 'text':
                return generateTextTranscript(sessionState);
            case 'markdown':
            case 'md':
            default:
                return generateMarkdownTranscript(sessionState);
        }
    }

    /**
     * Generates Markdown transcript
     * @param {Object} sessionState
     * @returns {string}
     */
    function generateMarkdownTranscript(sessionState) {
        const lines = [];
        const stats = getSessionStats(sessionState);
        
        lines.push('# VERACITY Session Transcript');
        lines.push('');
        lines.push(`**Session ID:** \`${sessionState.id}\``);
        lines.push(`**Session Started:** ${formatDateTime(sessionState.startTime)}`);
        if (sessionState.endTime) {
            lines.push(`**Session Ended:** ${formatDateTime(sessionState.endTime)}`);
            lines.push(`**Duration:** ${stats.durationFormatted}`);
        }
        lines.push(`**Total Queries:** ${sessionState.queries.length}`);
        lines.push('');
        
        // Track statistics
        lines.push('### Track Summary');
        lines.push(`- Track A (Assess): ${stats.trackStats.A.count} queries, ${stats.trackStats.A.overrides} overrides`);
        lines.push(`- Track B (Interview): ${stats.trackStats.B.count} queries, ${stats.trackStats.B.overrides} overrides`);
        lines.push(`- Track C (Navigate): ${stats.trackStats.C.count} queries, ${stats.trackStats.C.overrides} overrides`);
        if (stats.totalOverrides > 0) {
            lines.push(`- **Override Rate:** ${stats.overrideRate}%`);
        }
        lines.push('');
        
        // User notes if present
        if (sessionState.metadata.userNotes) {
            lines.push('### Session Notes');
            lines.push(sessionState.metadata.userNotes);
            lines.push('');
        }
        
        lines.push('---');
        lines.push('');

        for (let i = 0; i < sessionState.queries.length; i++) {
            const query = sessionState.queries[i];
            const trackName = getTrackName(query.finalTrack || query.classification.track);
            
            lines.push(`## Query ${i + 1}`);
            lines.push(`*${formatDateTime(query.timestamp)}*`);
            lines.push('');
            lines.push(`**Input:** "${query.input}"`);
            lines.push('');
            lines.push(`**Classification:**`);
            lines.push(`- Track: ${query.classification.track} (${getTrackName(query.classification.track)})`);
            lines.push(`- Confidence: ${query.classification.confidence}%`);
            lines.push(`- Reasoning: ${query.classification.reasoning}`);
            
            // Show override if present
            if (query.userOverride) {
                lines.push('');
                lines.push(`**User Override:** Changed to Track ${query.userOverride} (${getTrackName(query.userOverride)})`);
            }
            
            if (query.factoidsViewed.length > 0) {
                lines.push('');
                lines.push(`**Factoids Viewed:** ${query.factoidsViewed.join(', ')}`);
            }
            
            if (query.sourcesReferenced.length > 0) {
                lines.push('');
                lines.push(`**Sources Referenced:** ${query.sourcesReferenced.join(', ')}`);
            }
            
            lines.push('');
            lines.push('---');
            lines.push('');
        }

        lines.push('');
        lines.push('*Generated by VERACITY™ v5.0*');
        lines.push('');
        lines.push('**VERITAS LLC** — Prairie du Sac, Wisconsin');
        lines.push('');
        lines.push('🖖 SEEK · QUESTION · UNDERSTAND');

        return lines.join('\n');
    }

    /**
     * Generates plain text transcript
     * @param {Object} sessionState
     * @returns {string}
     */
    function generateTextTranscript(sessionState) {
        const lines = [];
        const divider = '═'.repeat(50);
        const stats = getSessionStats(sessionState);
        
        lines.push(divider);
        lines.push('VERACITY SESSION TRANSCRIPT');
        lines.push(divider);
        lines.push('');
        lines.push(`Session ID: ${sessionState.id}`);
        lines.push(`Session Started: ${formatDateTime(sessionState.startTime)}`);
        if (sessionState.endTime) {
            lines.push(`Session Ended: ${formatDateTime(sessionState.endTime)}`);
            lines.push(`Duration: ${stats.durationFormatted}`);
        }
        lines.push(`Total Queries: ${sessionState.queries.length}`);
        lines.push('');
        lines.push('TRACK SUMMARY:');
        lines.push(`  Track A (Assess): ${stats.trackStats.A.count} queries, ${stats.trackStats.A.overrides} overrides`);
        lines.push(`  Track B (Interview): ${stats.trackStats.B.count} queries, ${stats.trackStats.B.overrides} overrides`);
        lines.push(`  Track C (Navigate): ${stats.trackStats.C.count} queries, ${stats.trackStats.C.overrides} overrides`);
        if (stats.totalOverrides > 0) {
            lines.push(`  Override Rate: ${stats.overrideRate}%`);
        }
        lines.push('');
        
        if (sessionState.metadata.userNotes) {
            lines.push('SESSION NOTES:');
            lines.push(sessionState.metadata.userNotes);
            lines.push('');
        }

        for (let i = 0; i < sessionState.queries.length; i++) {
            const query = sessionState.queries[i];
            const trackName = getTrackName(query.finalTrack || query.classification.track);
            
            lines.push(`[Query ${i + 1}] ${formatDateTime(query.timestamp)}`);
            lines.push(`INPUT: "${query.input}"`);
            lines.push(`TRACK: ${query.classification.track} (${getTrackName(query.classification.track)})`);
            lines.push(`CONFIDENCE: ${query.classification.confidence}%`);
            lines.push(`REASONING: ${query.classification.reasoning}`);
            
            if (query.userOverride) {
                lines.push(`USER OVERRIDE: Changed to Track ${query.userOverride}`);
            }
            
            if (query.factoidsViewed.length > 0) {
                lines.push(`FACTOIDS: ${query.factoidsViewed.join(', ')}`);
            }
            
            if (query.sourcesReferenced.length > 0) {
                lines.push(`SOURCES: ${query.sourcesReferenced.join(', ')}`);
            }
            
            lines.push('');
        }

        lines.push(divider);
        lines.push('VERITAS LLC — Prairie du Sac, Wisconsin');
        lines.push('SEEK · QUESTION · UNDERSTAND');
        lines.push(divider);

        return lines.join('\n');
    }

    /**
     * Exports session to file download
     * @param {Object} sessionState
     * @param {string} format - 'markdown' | 'text' | 'json'
     * @param {string} filename - Optional filename
     */
    function exportSession(sessionState, format = 'markdown', filename = null) {
        let content, mimeType, extension;
        
        switch (format.toLowerCase()) {
            case 'json':
                content = generateTranscript(sessionState, 'json');
                mimeType = 'application/json';
                extension = 'json';
                break;
            case 'text':
            case 'txt':
                content = generateTranscript(sessionState, 'text');
                mimeType = 'text/plain';
                extension = 'txt';
                break;
            case 'markdown':
            case 'md':
            default:
                content = generateTranscript(sessionState, 'markdown');
                mimeType = 'text/markdown';
                extension = 'md';
                break;
        }

        const defaultFilename = `VERACITY_Session_${formatDateForFilename(new Date())}.${extension}`;
        const finalFilename = filename || defaultFilename;

        // Create download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { filename: finalFilename, size: content.length };
    }

    /**
     * Resets session state
     * @param {Object} sessionState
     * @returns {Object} Fresh session state
     */
    function resetSessionState(sessionState) {
        return createSessionState();
    }

    // ==================== HELPER FUNCTIONS ====================
    
    function getTrackName(track) {
        const names = {
            'A': 'ASSESS',
            'B': 'INTERVIEW', 
            'C': 'NAVIGATE',
            'AMBIGUOUS': 'CLARIFY'
        };
        return names[track] || track;
    }

    function formatDateTime(isoString) {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    function formatDateForFilename(date) {
        return date.toISOString().slice(0, 10).replace(/-/g, '');
    }

    // ==================== PUBLIC API ====================
    
    return {
        // Session state management
        createSessionState,
        resetSessionState,
        endSession,
        
        // Logging
        logQuery,
        logUserOverride,
        logFactoidViewed,
        logSourceReferenced,
        setUserNotes,
        
        // Export state
        getExportableItemCount,
        isTranscriptReady,
        getSessionStats,
        getSessionDuration,
        
        // Transcript generation
        generateTranscript,
        exportSession,
        
        // Utilities
        getTrackName,
        formatDateTime,
        formatDuration
    };

})();

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeracityExport;
}
