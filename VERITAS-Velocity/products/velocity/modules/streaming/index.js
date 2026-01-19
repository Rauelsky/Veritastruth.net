/**
 * VERITAS Velocity — Streaming Module
 * ====================================
 * 
 * Server-Sent Events streaming infrastructure for real-time assessments.
 * 
 * Usage:
 *   const { EventEmitter, setupSSEHeaders, StreamParser } = require('./modules/streaming');
 * 
 * Components:
 *   - EventEmitter: SSE event formatting and emission
 *   - StreamParser: Incremental parsing of Claude's output
 *   - TrackAdapters: Track-specific streaming configurations (Phase 3)
 */

const { EventEmitter, setupSSEHeaders, getStatusMessage, STATUS_MESSAGES } = require('./EventEmitter');
const { StreamParser, TextAccumulator } = require('./StreamParser');

module.exports = {
    // Event emission
    EventEmitter,
    setupSSEHeaders,
    getStatusMessage,
    STATUS_MESSAGES,
    
    // Stream parsing
    StreamParser,
    TextAccumulator
};
