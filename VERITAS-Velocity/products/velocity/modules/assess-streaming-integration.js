/**
 * VERITAS Velocity — Streaming Integration for assess.html
 * ========================================================
 * 
 * Drop-in module to enable streaming assessments in the existing UI.
 * Load this AFTER the existing assess.html scripts.
 * 
 * Usage:
 *   <script src="/modules/velocity-stream-client.js"></script>
 *   <script src="/modules/assess-streaming-integration.js"></script>
 * 
 * This module:
 *   1. Adds a streaming toggle to the UI
 *   2. Intercepts runAssessment() when streaming is enabled
 *   3. Uses VelocityStream for SSE communication
 *   4. Progressively updates the UI as data arrives
 * 
 * @version 1.0
 * @phase Phase 1 - Foundation
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const STREAMING_ENDPOINT = './api/assess-stream';
    const ENABLE_BY_DEFAULT = true; // Set to true once tested
    
    // ============================================
    // STATE
    // ============================================
    let streamingEnabled = ENABLE_BY_DEFAULT;
    let activeStream = null;
    let streamingData = {
        fullText: '',
        scores: { reality: null, integrity: null },
        sections: {}
    };

    // ============================================
    // UI INJECTION
    // ============================================
    function injectStreamingToggle() {
        const buttonRow = document.querySelector('.button-row');
        if (!buttonRow) {
            console.warn('[Streaming] Button row not found, retrying...');
            setTimeout(injectStreamingToggle, 500);
            return;
        }

        // Check if already injected
        if (document.getElementById('streamingToggle')) return;

        // Create toggle container
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'streaming-toggle-container';
        toggleContainer.innerHTML = `
            <label class="streaming-toggle" title="Enable progressive streaming for faster visual feedback">
                <input type="checkbox" id="streamingToggle" ${streamingEnabled ? 'checked' : ''}>
                <span class="streaming-toggle-slider"></span>
                <span class="streaming-toggle-label">⚡ Velocity Mode</span>
            </label>
        `;

        // Insert before the button row
        buttonRow.parentNode.insertBefore(toggleContainer, buttonRow);

        // Add event listener
        document.getElementById('streamingToggle').addEventListener('change', function(e) {
            streamingEnabled = e.target.checked;
            console.log('[Streaming] Mode:', streamingEnabled ? 'ENABLED' : 'DISABLED');
            
            // Save preference
            localStorage.setItem('veritasStreamingEnabled', streamingEnabled);
        });

        // Load saved preference
        const saved = localStorage.getItem('veritasStreamingEnabled');
        if (saved !== null) {
            streamingEnabled = saved === 'true';
            document.getElementById('streamingToggle').checked = streamingEnabled;
        }

        // Inject styles
        injectStreamingStyles();
        
        console.log('[Streaming] Toggle injected, streaming:', streamingEnabled ? 'ENABLED' : 'DISABLED');
    }

    function injectStreamingStyles() {
        if (document.getElementById('streaming-integration-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'streaming-integration-styles';
        styles.textContent = `
            .streaming-toggle-container {
                display: flex;
                justify-content: center;
                margin-bottom: 12px;
            }

            .streaming-toggle {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                user-select: none;
                padding: 8px 16px;
                background: var(--bg-tertiary, #1e293b);
                border: 1px solid var(--border-medium, #334155);
                border-radius: 20px;
                transition: all 0.2s ease;
            }

            .streaming-toggle:hover {
                border-color: var(--accent-teal, #0d9488);
            }

            .streaming-toggle input {
                display: none;
            }

            .streaming-toggle-slider {
                width: 36px;
                height: 20px;
                background: var(--bg-input, #0d1117);
                border-radius: 10px;
                position: relative;
                transition: background 0.2s ease;
            }

            .streaming-toggle-slider::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                background: var(--text-muted, #64748b);
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: all 0.2s ease;
            }

            .streaming-toggle input:checked + .streaming-toggle-slider {
                background: var(--accent-teal, #0d9488);
            }

            .streaming-toggle input:checked + .streaming-toggle-slider::after {
                transform: translateX(16px);
                background: white;
            }

            .streaming-toggle-label {
                font-size: 0.85rem;
                color: var(--text-secondary, #94a3b8);
                font-weight: 500;
            }

            .streaming-toggle input:checked ~ .streaming-toggle-label {
                color: var(--accent-teal, #0d9488);
            }

            /* Streaming progress indicator */
            .streaming-progress {
                margin-top: 12px;
                padding: 12px 16px;
                background: var(--bg-tertiary, #1e293b);
                border: 1px solid var(--accent-teal, #0d9488);
                border-radius: 8px;
                display: none;
            }

            .streaming-progress.active {
                display: block;
            }

            .streaming-progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .streaming-progress-phase {
                font-size: 0.85rem;
                color: var(--accent-teal, #0d9488);
                font-weight: 500;
            }

            .streaming-progress-time {
                font-size: 0.8rem;
                color: var(--text-muted, #64748b);
                font-family: 'IBM Plex Mono', monospace;
            }

            .streaming-progress-bar {
                height: 4px;
                background: var(--bg-input, #0d1117);
                border-radius: 2px;
                overflow: hidden;
            }

            .streaming-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent-teal, #0d9488), var(--accent-cyan, #22d3ee));
                border-radius: 2px;
                transition: width 0.3s ease;
            }

            .streaming-preview {
                margin-top: 12px;
                padding: 12px;
                background: var(--bg-input, #0d1117);
                border-radius: 6px;
                max-height: 150px;
                overflow-y: auto;
                font-size: 0.85rem;
                color: var(--text-secondary, #94a3b8);
                font-family: 'IBM Plex Mono', monospace;
                white-space: pre-wrap;
                word-break: break-word;
            }

            .streaming-preview .cursor {
                display: inline-block;
                width: 8px;
                height: 1em;
                background: var(--accent-teal, #0d9488);
                animation: blink 1s step-end infinite;
                vertical-align: text-bottom;
            }

            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }

            /* Score preview during streaming */
            .streaming-scores {
                display: flex;
                gap: 16px;
                margin-top: 12px;
            }

            .streaming-score {
                flex: 1;
                padding: 10px;
                background: var(--bg-input, #0d1117);
                border-radius: 6px;
                text-align: center;
            }

            .streaming-score-label {
                font-size: 0.75rem;
                color: var(--text-muted, #64748b);
                text-transform: uppercase;
                margin-bottom: 4px;
            }

            .streaming-score-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--text-primary, #e2e8f0);
            }

            .streaming-score-value.provisional {
                opacity: 0.6;
            }

            .streaming-score-value.reality-positive { color: var(--score-positive, #10b981); }
            .streaming-score-value.reality-negative { color: var(--score-negative, #f87171); }
            .streaming-score-value.reality-neutral { color: var(--score-neutral, #fbbf24); }
        `;
        document.head.appendChild(styles);
    }

    // ============================================
    // STREAMING PROGRESS UI
    // ============================================
    function createStreamingProgressUI() {
        const processingIndicator = document.getElementById('processingIndicator');
        if (!processingIndicator) return null;

        // Check if already exists
        let progressUI = document.getElementById('streamingProgress');
        if (progressUI) return progressUI;

        progressUI = document.createElement('div');
        progressUI.id = 'streamingProgress';
        progressUI.className = 'streaming-progress';
        progressUI.innerHTML = `
            <div class="streaming-progress-header">
                <span class="streaming-progress-phase" id="streamingPhase">Connecting...</span>
                <span class="streaming-progress-time" id="streamingTime">0.0s</span>
            </div>
            <div class="streaming-progress-bar">
                <div class="streaming-progress-fill" id="streamingFill" style="width: 0%"></div>
            </div>
            <div class="streaming-scores" id="streamingScores" style="display: none;">
                <div class="streaming-score">
                    <div class="streaming-score-label">Reality</div>
                    <div class="streaming-score-value" id="streamingRealityScore">—</div>
                </div>
                <div class="streaming-score">
                    <div class="streaming-score-label">Integrity</div>
                    <div class="streaming-score-value" id="streamingIntegrityScore">—</div>
                </div>
            </div>
            <div class="streaming-preview" id="streamingPreview" style="display: none;">
                <span id="streamingText"></span><span class="cursor"></span>
            </div>
        `;

        processingIndicator.appendChild(progressUI);
        return progressUI;
    }

    // ============================================
    // STREAMING ASSESSMENT
    // ============================================
    function runStreamingAssessment() {
        const question = document.getElementById('question').value.trim();
        const articleText = document.getElementById('articleText').value.trim();
        const articleUrl = document.getElementById('articleUrl').value.trim();
        const userApiKey = document.getElementById('apiKey')?.value?.trim() || '';
        const errorBox = document.getElementById('errorBox');
        const btn = document.getElementById('assessBtn');

        if (!question && !articleText && !articleUrl) {
            errorBox.textContent = 'Please enter a claim, URL, or article text to assess.';
            errorBox.classList.add('visible');
            return;
        }

        errorBox.classList.remove('visible');
        btn.disabled = true;
        btn.innerHTML = '<span>⚡</span> <span>Streaming...</span>';

        // Show processing UI
        showProcessing();
        
        // Create and show streaming progress
        const progressUI = createStreamingProgressUI();
        if (progressUI) {
            progressUI.classList.add('active');
        }

        // Reset streaming data
        streamingData = {
            fullText: '',
            scores: { reality: null, integrity: null },
            sections: {}
        };

        // Get current language
        const currentLanguage = localStorage.getItem('veritasLanguage') || 'en';

        // Timer
        const startTime = Date.now();
        const timerInterval = setInterval(() => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const timeEl = document.getElementById('streamingTime');
            if (timeEl) timeEl.textContent = elapsed + 's';
        }, 100);

        // Create stream
        activeStream = new VelocityStream(STREAMING_ENDPOINT, {
            onStatus: (phase, message, progress) => {
                const phaseEl = document.getElementById('streamingPhase');
                const fillEl = document.getElementById('streamingFill');
                if (phaseEl) phaseEl.textContent = message;
                if (fillEl) fillEl.style.width = (progress * 100) + '%';
            },

            onChunk: (type, content, final) => {
                if (type === 'text' && content) {
                    streamingData.fullText += content;
                    
                    // Update preview (last 500 chars)
                    const previewEl = document.getElementById('streamingPreview');
                    const textEl = document.getElementById('streamingText');
                    if (previewEl && textEl) {
                        previewEl.style.display = 'block';
                        const preview = streamingData.fullText.slice(-500);
                        textEl.textContent = preview;
                        previewEl.scrollTop = previewEl.scrollHeight;
                    }
                }
            },

            onScore: (realityScore, integrityScore, provisional) => {
                streamingData.scores.reality = realityScore;
                streamingData.scores.integrity = integrityScore;

                const scoresEl = document.getElementById('streamingScores');
                const realityEl = document.getElementById('streamingRealityScore');
                const integrityEl = document.getElementById('streamingIntegrityScore');

                if (scoresEl) scoresEl.style.display = 'flex';
                
                if (realityEl && realityScore !== null) {
                    realityEl.textContent = realityScore > 0 ? '+' + realityScore : realityScore;
                    realityEl.className = 'streaming-score-value' + 
                        (provisional ? ' provisional' : '') +
                        (realityScore > 2 ? ' reality-positive' : 
                         realityScore < -2 ? ' reality-negative' : ' reality-neutral');
                }

                if (integrityEl && integrityScore !== null) {
                    integrityEl.textContent = integrityScore.toFixed(2);
                    integrityEl.className = 'streaming-score-value' + (provisional ? ' provisional' : '');
                }
            },

            onSection: (name, content, final) => {
                streamingData.sections[name] = content;
            },

            onComplete: (metadata) => {
                clearInterval(timerInterval);
                
                if (metadata.success && metadata.parsed) {
                    // Build response object compatible with existing displayResults
                    const data = {
                        success: true,
                        assessment: streamingData.fullText,
                        realityScore: metadata.parsed.realityScore,
                        integrityScore: metadata.parsed.integrityScore,
                        exactClaimBeingScored: metadata.parsed.exactClaimBeingScored,
                        questionType: metadata.parsed.questionType,
                        structured: metadata.parsed.structured,
                        question: question,
                        track: 'a',
                        assessmentDate: new Date().toISOString()
                    };

                    // Use existing display logic
                    finishStreamingAssessment(data, question);
                } else {
                    // Error case
                    hideProcessing();
                    if (progressUI) progressUI.classList.remove('active');
                    errorBox.textContent = 'Assessment failed. Please try again.';
                    errorBox.classList.add('visible');
                }

                btn.disabled = false;
                btn.innerHTML = '<span>⚡</span> <span data-i18n="runAssessment">Run Assessment</span>';
                activeStream = null;
            },

            onError: (code, message) => {
                console.error('[Streaming] Error:', code, message);
                clearInterval(timerInterval);
                
                hideProcessing();
                if (progressUI) progressUI.classList.remove('active');
                
                errorBox.textContent = 'Error: ' + message;
                errorBox.classList.add('visible');
                
                btn.disabled = false;
                btn.innerHTML = '<span>⚡</span> <span data-i18n="runAssessment">Run Assessment</span>';
                activeStream = null;
            }
        });

        // Start the stream
        activeStream.start({
            query: question,
            articleText: articleText,
            language: currentLanguage
        });
    }

    function finishStreamingAssessment(data, question) {
        console.log('[Streaming] Assessment complete:', data);

        // Hide streaming progress
        const progressUI = document.getElementById('streamingProgress');
        if (progressUI) progressUI.classList.remove('active');

        // Update claim display
        document.getElementById('claimText').textContent = '"' + question + '"';

        // Use existing score display function
        if (typeof updateScoreDisplay === 'function') {
            updateScoreDisplay(data.realityScore, data.integrityScore);
        }

        // Render assessment content using existing function
        if (typeof renderAssessmentContent === 'function') {
            renderAssessmentContent(data);
        }

        // Render Plain Truth using existing function
        if (typeof renderPlainTruth === 'function') {
            renderPlainTruth(data);
        }

        // Store for Amplify/Verify (use existing global)
        if (typeof lastAssessment !== 'undefined') {
            window.lastAssessment = {
                question: question,
                articleText: document.getElementById('articleText').value.trim(),
                articleUrl: document.getElementById('articleUrl').value.trim(),
                assessment: data.assessment,
                realityScore: data.realityScore,
                integrityScore: data.integrityScore,
                structured: data.structured
            };
        }

        // Hide processing, hide input, show results
        hideProcessing();
        document.getElementById('inputCard').style.display = 'none';
        document.getElementById('resultsSection').classList.add('visible');

        // Start cooldown if exists
        if (typeof startCooldown === 'function') {
            startCooldown();
        }

        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    }

    // ============================================
    // INTERCEPT ORIGINAL runAssessment
    // ============================================
    function interceptAssessment() {
        // Store original function
        const originalRunAssessment = window.runAssessment;

        // Replace with interceptor
        window.runAssessment = function() {
            if (streamingEnabled && typeof VelocityStream !== 'undefined') {
                console.log('[Streaming] Intercepting assessment, using streaming mode');
                runStreamingAssessment();
            } else {
                console.log('[Streaming] Using original assessment mode');
                originalRunAssessment.apply(this, arguments);
            }
        };

        console.log('[Streaming] Assessment interceptor installed');
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Wait for DOM and dependencies
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Check for VelocityStream
        if (typeof VelocityStream === 'undefined') {
            console.warn('[Streaming] VelocityStream not loaded, retrying...');
            setTimeout(init, 500);
            return;
        }

        // Check for existing runAssessment
        if (typeof window.runAssessment !== 'function') {
            console.warn('[Streaming] runAssessment not found, retrying...');
            setTimeout(init, 500);
            return;
        }

        // Inject UI
        injectStreamingToggle();

        // Intercept assessment
        interceptAssessment();

        console.log('[Streaming] Integration initialized');
    }

    // Start initialization
    init();

})();
