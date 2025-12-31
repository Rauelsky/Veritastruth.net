/**
 * VERACITY v5.0 — ANIMATIONS MODULE
 * ==================================
 * Module: animations.js
 * Version: 1.0.0
 * Last Modified: 2025-12-30
 * 
 * PURPOSE:
 * 1. Visual feedback and processing state animations
 * 2. Track activation transitions with smooth glow effects
 * 3. Salience-based discipline button animations
 * 4. Loading states and progress indicators
 * 5. Micro-interaction polish (hover, click, focus states)
 * 
 * PHILOSOPHY:
 * "Visual feedback is a form of communication—it tells users the system
 * is listening, thinking, and responding. Every animation should serve
 * understanding, not just decoration."
 * 
 * DEPENDENCIES: None (pure CSS/JS animation layer)
 * DEPENDED ON BY: main.html
 * 
 * CHANGE IMPACT: MEDIUM — Visual layer only, no logic dependencies
 * 
 * EXPORTS:
 * - startProcessing(element, options) → ProcessingState
 * - stopProcessing(processingState)
 * - animateTrackActivation(track, options)
 * - animateSalienceUpdate(element, newLevel, oldLevel)
 * - pulseElement(element, options)
 * - createRipple(event, element)
 * - injectAnimationStyles() — Call once on init
 * 
 * ⚠️ IMMUTABLE until change protocol executed
 */

const VeracityAnimations = (function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    
    const config = {
        // Timing (ms)
        processingPulseSpeed: 600,
        trackTransitionDuration: 400,
        salienceTransitionDuration: 300,
        rippleDuration: 500,
        
        // Colors (matching CSS variables)
        colors: {
            trackA: { primary: '#c89146', glow: 'rgba(200, 145, 70, 0.6)' },
            trackB: { primary: '#735fa5', glow: 'rgba(115, 95, 165, 0.6)' },
            trackC: { primary: '#4b91a5', glow: 'rgba(75, 145, 165, 0.6)' },
            working: { primary: '#148c73', glow: 'rgba(20, 140, 115, 0.6)' },
            default: { primary: '#94a3b8', glow: 'rgba(148, 163, 184, 0.4)' }
        },
        
        // Easing functions
        easing: {
            smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            snap: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }
    };

    // ==================== PROCESSING STATE ANIMATIONS ====================
    
    /**
     * Starts a processing animation on an element
     * Creates the "breathing" glow effect during analysis
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     * @returns {Object} ProcessingState - Handle to stop the animation
     */
    function startProcessing(element, options = {}) {
        const {
            color = config.colors.working.glow,
            intensity = 1,
            pulseSpeed = config.processingPulseSpeed
        } = options;

        // Store original state
        const originalState = {
            boxShadow: element.style.boxShadow,
            filter: element.style.filter,
            transition: element.style.transition
        };

        // Add processing class
        element.classList.add('veracity-processing');
        
        // Create custom animation
        const animationName = `veracity-pulse-${Date.now()}`;
        const keyframes = `
            @keyframes ${animationName} {
                0%, 100% { 
                    box-shadow: 0 0 ${8 * intensity}px ${color}, inset 0 0 ${4 * intensity}px ${color};
                    filter: brightness(1);
                }
                50% { 
                    box-shadow: 0 0 ${20 * intensity}px ${color}, inset 0 0 ${10 * intensity}px ${color};
                    filter: brightness(1.15);
                }
            }
        `;
        
        // Inject keyframes
        const styleEl = document.createElement('style');
        styleEl.textContent = keyframes;
        document.head.appendChild(styleEl);
        
        // Apply animation
        element.style.animation = `${animationName} ${pulseSpeed}ms ${config.easing.smooth} infinite`;

        return {
            element,
            originalState,
            styleEl,
            animationName,
            stop: function() {
                stopProcessing(this);
            }
        };
    }

    /**
     * Stops a processing animation
     * @param {Object} processingState - State object from startProcessing
     */
    function stopProcessing(processingState) {
        if (!processingState) return;
        
        const { element, originalState, styleEl } = processingState;
        
        // Remove processing class
        element.classList.remove('veracity-processing');
        
        // Restore original state with smooth transition
        element.style.transition = `all ${config.trackTransitionDuration}ms ${config.easing.smooth}`;
        element.style.animation = '';
        element.style.boxShadow = originalState.boxShadow;
        element.style.filter = originalState.filter;
        
        // Clean up injected styles after transition
        setTimeout(() => {
            if (styleEl && styleEl.parentNode) {
                styleEl.parentNode.removeChild(styleEl);
            }
            element.style.transition = originalState.transition;
        }, config.trackTransitionDuration);
    }

    // ==================== TRACK ACTIVATION ANIMATIONS ====================
    
    /**
     * Animates track button activation with glow and scale effects
     * @param {string} track - Track identifier ('A', 'B', 'C', 'WORKING')
     * @param {Object} options - Animation options
     */
    function animateTrackActivation(track, options = {}) {
        const {
            duration = config.trackTransitionDuration,
            targetElement = null
        } = options;

        // Find track button if not provided
        const element = targetElement || document.querySelector(`.track-btn.track-${track.toLowerCase()}`);
        if (!element) return;

        const colorSet = config.colors[`track${track}`] || config.colors.working;
        
        // Create activation burst effect
        const burst = document.createElement('div');
        burst.className = 'veracity-track-burst';
        burst.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            transform: translate(-50%, -50%) scale(0);
            background: radial-gradient(circle, ${colorSet.glow} 0%, transparent 70%);
            border-radius: inherit;
            pointer-events: none;
            z-index: -1;
        `;
        
        // Ensure element can contain absolute children
        const originalPosition = element.style.position;
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(burst);
        
        // Animate burst
        requestAnimationFrame(() => {
            burst.style.transition = `transform ${duration}ms ${config.easing.smooth}, opacity ${duration}ms ${config.easing.smooth}`;
            burst.style.transform = 'translate(-50%, -50%) scale(1.5)';
            burst.style.opacity = '0';
        });
        
        // Clean up
        setTimeout(() => {
            if (burst.parentNode) {
                burst.parentNode.removeChild(burst);
            }
            element.style.position = originalPosition;
        }, duration);
    }

    /**
     * Animates smooth transition between tracks
     * @param {string} fromTrack - Previous track
     * @param {string} toTrack - New track
     * @param {Object} options - Animation options
     */
    function animateTrackTransition(fromTrack, toTrack, options = {}) {
        const { duration = config.trackTransitionDuration } = options;
        
        // Deactivate old track with fade
        if (fromTrack) {
            const oldElement = document.querySelector(`.track-btn.track-${fromTrack.toLowerCase()}`);
            if (oldElement) {
                oldElement.style.transition = `all ${duration}ms ${config.easing.smooth}`;
                oldElement.classList.remove('active');
            }
        }
        
        // Activate new track with burst
        if (toTrack && toTrack !== 'AMBIGUOUS') {
            const newElement = document.querySelector(`.track-btn.track-${toTrack.toLowerCase()}`);
            if (newElement) {
                // Slight delay for sequential effect
                setTimeout(() => {
                    newElement.style.transition = `all ${duration}ms ${config.easing.smooth}`;
                    newElement.classList.add('active');
                    animateTrackActivation(toTrack, { targetElement: newElement, duration });
                }, duration * 0.3);
            }
        }
    }

    // ==================== SALIENCE ANIMATIONS ====================
    
    /**
     * Animates salience level changes on discipline buttons
     * @param {HTMLElement} element - Discipline button element
     * @param {string} newLevel - New salience level ('high', 'medium', 'low', 'none')
     * @param {string} oldLevel - Previous salience level
     */
    function animateSalienceUpdate(element, newLevel, oldLevel = 'none') {
        if (!element || newLevel === oldLevel) return;
        
        const duration = config.salienceTransitionDuration;
        
        // Set up transition
        element.style.transition = `all ${duration}ms ${config.easing.smooth}`;
        
        // Remove old class, add new
        element.classList.remove(`salience-${oldLevel}`);
        element.classList.add(`salience-${newLevel}`);
        
        // Add subtle scale pulse for level increase
        if (getSalienceValue(newLevel) > getSalienceValue(oldLevel)) {
            element.style.transform = 'scale(1.05)';
            setTimeout(() => {
                element.style.transform = '';
            }, duration * 0.5);
        }
    }

    /**
     * Batch update salience animations for all discipline buttons
     * @param {Object} salienceScores - Object with discipline: score pairs
     * @param {Object} previousScores - Previous scores for comparison
     */
    function animateAllSalienceUpdates(salienceScores, previousScores = {}) {
        const disciplineMap = {
            'history': '.sidebar-label.history',
            'sciences': '.sidebar-label.science',
            'philosophy': '.sidebar-label.philosophy',
            'logic': '.sidebar-label.logic',
            'rhetoric': '.sidebar-label.rhetoric',
            'media': '.sidebar-label.media',
            'psychology': '.sidebar-label.psychology',
            'statistics': '.sidebar-label.statistics',
            'sources': '.sidebar-label.sources'
        };

        // Stagger animations for visual effect
        let delay = 0;
        const staggerInterval = 50;

        for (const [discipline, selector] of Object.entries(disciplineMap)) {
            const element = document.querySelector(selector);
            if (!element) continue;

            const score = salienceScores[discipline] || 0;
            const oldScore = previousScores[discipline] || 0;
            const newLevel = getSalienceLevel(score);
            const oldLevel = getSalienceLevel(oldScore);

            setTimeout(() => {
                animateSalienceUpdate(element, newLevel, oldLevel);
            }, delay);

            delay += staggerInterval;
        }
    }

    // Helper: Convert score to level
    function getSalienceLevel(score) {
        if (score >= 0.7) return 'high';
        if (score >= 0.4) return 'medium';
        if (score >= 0.2) return 'low';
        return 'none';
    }

    // Helper: Convert level to numeric value for comparison
    function getSalienceValue(level) {
        const values = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3 };
        return values[level] || 0;
    }

    // ==================== MICRO-INTERACTIONS ====================
    
    /**
     * Creates a pulse effect on an element
     * @param {HTMLElement} element - Element to pulse
     * @param {Object} options - Pulse options
     */
    function pulseElement(element, options = {}) {
        const {
            color = 'rgba(200, 145, 70, 0.4)',
            duration = 400,
            scale = 1.02
        } = options;

        const original = {
            transform: element.style.transform,
            boxShadow: element.style.boxShadow
        };

        element.style.transition = `all ${duration / 2}ms ${config.easing.smooth}`;
        element.style.transform = `scale(${scale})`;
        element.style.boxShadow = `0 0 15px ${color}`;

        setTimeout(() => {
            element.style.transform = original.transform || '';
            element.style.boxShadow = original.boxShadow || '';
            
            setTimeout(() => {
                element.style.transition = '';
            }, duration / 2);
        }, duration / 2);
    }

    /**
     * Creates a ripple effect on click
     * @param {Event} event - Click event
     * @param {HTMLElement} element - Element to ripple
     */
    function createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.className = 'veracity-ripple';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            pointer-events: none;
            animation: veracity-ripple-expand ${config.rippleDuration}ms ${config.easing.smooth} forwards;
        `;

        // Ensure parent has relative positioning
        const originalPosition = element.style.position;
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        element.style.overflow = 'hidden';

        element.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
            element.style.position = originalPosition;
        }, config.rippleDuration);
    }

    // ==================== LOADING STATES ====================
    
    /**
     * Shows a loading skeleton in an element
     * @param {HTMLElement} element - Container element
     * @param {Object} options - Loading options
     * @returns {Function} cleanup - Function to remove loading state
     */
    function showLoadingSkeleton(element, options = {}) {
        const { lines = 3, animated = true } = options;
        
        const originalContent = element.innerHTML;
        element.classList.add('veracity-loading');
        
        let skeletonHtml = '';
        for (let i = 0; i < lines; i++) {
            const width = 60 + Math.random() * 35; // 60-95% width
            skeletonHtml += `
                <div class="veracity-skeleton-line" style="width: ${width}%; ${animated ? 'animation: veracity-skeleton-shimmer 1.5s infinite;' : ''}"></div>
            `;
        }
        
        element.innerHTML = `<div class="veracity-skeleton">${skeletonHtml}</div>`;
        
        return function cleanup() {
            element.classList.remove('veracity-loading');
            element.innerHTML = originalContent;
        };
    }

    // ==================== STYLE INJECTION ====================
    
    /**
     * Injects required CSS for animations
     * Call once on page load
     */
    function injectAnimationStyles() {
        // Check if already injected
        if (document.getElementById('veracity-animation-styles')) return;

        const styles = `
            /* Processing pulse */
            .veracity-processing {
                position: relative;
            }

            /* Ripple animation */
            @keyframes veracity-ripple-expand {
                from {
                    transform: scale(0);
                    opacity: 1;
                }
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }

            /* Skeleton loading */
            .veracity-skeleton {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 4px 0;
            }

            .veracity-skeleton-line {
                height: 12px;
                background: linear-gradient(90deg, 
                    var(--bg-tertiary, #1e293b) 0%, 
                    var(--bg-secondary, #111827) 50%, 
                    var(--bg-tertiary, #1e293b) 100%
                );
                background-size: 200% 100%;
                border-radius: 4px;
            }

            @keyframes veracity-skeleton-shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            /* Track burst */
            .veracity-track-burst {
                opacity: 0.8;
            }

            /* Enhanced salience transitions */
            .sidebar-label {
                transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                            filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                            transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Smooth track button transitions */
            .track-btn {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Focus states for accessibility */
            .track-btn:focus-visible,
            .sidebar-label:focus-visible,
            .submit-btn:focus-visible,
            .clarify-btn:focus-visible {
                outline: 2px solid var(--accent-teal, #0d9488);
                outline-offset: 2px;
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .veracity-processing,
                .sidebar-label,
                .track-btn,
                .veracity-skeleton-line {
                    animation: none !important;
                    transition: none !important;
                }
            }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = 'veracity-animation-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    // ==================== INITIALIZATION ====================
    
    /**
     * Initializes animation system
     * Sets up event listeners for micro-interactions
     */
    function init() {
        injectAnimationStyles();
        
        // Add ripple effects to interactive elements
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.track-btn, .submit-btn, .action-btn');
            if (target) {
                createRipple(e, target);
            }
        });
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ==================== PUBLIC API ====================
    
    return {
        // Processing states
        startProcessing,
        stopProcessing,
        
        // Track animations
        animateTrackActivation,
        animateTrackTransition,
        
        // Salience animations
        animateSalienceUpdate,
        animateAllSalienceUpdates,
        getSalienceLevel,
        
        // Micro-interactions
        pulseElement,
        createRipple,
        
        // Loading states
        showLoadingSkeleton,
        
        // Setup
        injectAnimationStyles,
        init,
        
        // Config (for customization)
        config
    };

})();

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeracityAnimations;
}
