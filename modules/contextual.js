/**
 * VERACITY v5.2 — CONTEXTUAL MODULE
 * ===================================
 * Module: contextual.js
 * Version: 1.1.0
 * Last Modified: 2026-01-11
 * 
 * PURPOSE:
 * 1. Compound question decomposition and clarification flow
 * 2. Two-state discipline button behavior (idle vs. active)
 * 3. Contextual information display based on query content
 * 
 * VINCULUM INTEGRATION:
 * getDisciplineContext() is now async and supports multilingual output.
 * When a non-English language is selected, explanations and suggestions
 * are translated via VINCULUM. Use sync.getDisciplineContext() for
 * synchronous English-only access when needed.
 * 
 * PHILOSOPHY:
 * "Not telling people what to think, but giving them frameworks to think with."
 * When a question contains multiple claims, help users see the layers
 * and choose which to explore first.
 * 
 * DEPENDENCIES: classifier.js (salience scores), vinculum.js (optional)
 * DEPENDED ON BY: main.html
 * 
 * CHANGE IMPACT: MEDIUM — Requires salience data from classifier
 * 
 * EXPORTS:
 * - decomposeCompoundQuestion(input, classificationResult) → DecompositionResult
 * - generateClarificationPrompt(decomposition) → ClarificationPrompt
 * - getDisciplineContext(discipline, query, salience) → Promise<ContextualInfo>
 * - sync.getDisciplineContext(discipline, query, salience) → ContextualInfo (English)
 * - getButtonState(hasInput, salience) → 'idle' | 'active'
 * 
 * VERITAS LLC — Prairie du Sac, Wisconsin
 * 🖖 Infinite Diversity in Infinite Combinations
 */

const VeracityContextual = (function() {
    'use strict';

    // ==================== COMPOUND QUESTION DECOMPOSITION ====================
    
    /**
     * Decomposition patterns - identify specific claim types within compound questions
     * Each pattern extracts a particular kind of embedded claim
     */
    const claimPatterns = {
        // Attribution claims: "X said/claimed/tweeted Y"
        attribution: {
            pattern: /(.+?)\s+(said|claimed|stated|tweeted|posted|announced|argued|believes)\s+(?:that\s+)?(.+)/i,
            extract: (match) => ({
                type: 'attribution',
                subject: match[1].trim(),
                verb: match[2],
                content: match[3].trim(),
                question: `Did ${match[1].trim()} actually ${match[2]} this?`,
                track: 'A',
                trackReason: 'Attribution claims are factually verifiable'
            })
        },
        
        // Causation claims: "X caused/killed/led to Y"
        causation: {
            pattern: /(.+?)\s+(caused|killed|led to|resulted in|created|triggered|produced)\s+(.+)/i,
            extract: (match) => ({
                type: 'causation',
                cause: match[1].trim(),
                verb: match[2],
                effect: match[3].trim(),
                question: `Did ${match[1].trim()} actually ${match[2]} ${match[3].trim()}?`,
                track: 'A',
                trackReason: 'Causation requires evidence evaluation'
            })
        },
        
        // Presupposition claims: "Why did X" (presupposes X happened)
        presupposition: {
            pattern: /^why\s+did\s+(.+?)(\?|$)/i,
            extract: (match) => ({
                type: 'presupposition',
                presupposedEvent: match[1].trim(),
                question: `Did "${match[1].trim()}" actually happen?`,
                track: 'A',
                trackReason: 'Must verify the event before exploring reasons'
            })
        },
        
        // Loaded questions: "When did X stop doing Y"
        loaded: {
            pattern: /when\s+did\s+(.+?)\s+stop\s+(.+?)(\?|$)/i,
            extract: (match) => ({
                type: 'loaded',
                subject: match[1].trim(),
                action: match[2].trim(),
                question: `Was ${match[1].trim()} ever ${match[2].trim()} in the first place?`,
                track: 'A',
                trackReason: 'Loaded questions contain hidden assumptions'
            })
        },
        
        // Death + causation: "Did X kill Y" or "X's death was caused by"
        deathCausation: {
            pattern: /(.+?)\s*(death|murder|killing|died|killed|murdered).+?(caused|because|due to|by)\s+(.+)/i,
            extract: (match) => ({
                type: 'death_causation',
                victim: match[1].trim(),
                event: match[2],
                causationWord: match[3],
                allegedCause: match[4].trim(),
                questions: [
                    { q: `Did ${match[1].trim()} actually die/get killed?`, track: 'A' },
                    { q: `Was "${match[4].trim()}" the actual cause?`, track: 'A' }
                ],
                track: 'A',
                trackReason: 'Death events and causation are factually verifiable'
            })
        },
        
        // Multiple questions (contains multiple ?)
        multipleQuestions: {
            pattern: /\?.*\?/,
            extract: (input) => {
                const questions = input.split(/\?/).filter(q => q.trim().length > 0);
                return {
                    type: 'multiple_questions',
                    questions: questions.map((q, i) => ({
                        text: q.trim() + '?',
                        index: i + 1
                    })),
                    track: 'AMBIGUOUS',
                    trackReason: 'Multiple distinct questions need individual attention'
                };
            }
        },
        
        // Compound "and" claims
        andCompound: {
            pattern: /(.+?)\s+and\s+(that\s+)?(.+?)(\?|$)/i,
            extract: (match) => ({
                type: 'and_compound',
                claim1: match[1].trim(),
                claim2: match[3].trim(),
                questions: [
                    { q: match[1].trim() + '?', index: 1 },
                    { q: match[3].trim() + '?', index: 2 }
                ],
                track: 'AMBIGUOUS',
                trackReason: 'Connected claims may need different approaches'
            })
        }
    };

    /**
     * Decomposes a compound question into its constituent claims
     * @param {string} input - Original user input
     * @param {Object} classificationResult - Result from classifier.js
     * @returns {DecompositionResult}
     */
    function decomposeCompoundQuestion(input, classificationResult) {
        if (!classificationResult.isCompound) {
            return {
                isCompound: false,
                originalInput: input,
                claims: [],
                needsClarification: false
            };
        }

        const claims = [];
        const text = input.trim();
        
        // Try each pattern to extract claims
        for (const [patternName, patternDef] of Object.entries(claimPatterns)) {
            const match = text.match(patternDef.pattern);
            if (match) {
                const extracted = patternDef.extract(match);
                claims.push({
                    ...extracted,
                    patternMatched: patternName,
                    originalText: text
                });
            }
        }

        // If no specific patterns matched but classifier flagged as compound,
        // provide generic decomposition guidance
        if (claims.length === 0 && classificationResult.isCompound) {
            claims.push({
                type: 'generic_compound',
                question: 'This question contains multiple layers. What aspect would you like to explore?',
                track: 'AMBIGUOUS',
                trackReason: classificationResult.reasoning,
                originalText: text
            });
        }

        // Determine suggested exploration order
        const explorationOrder = suggestExplorationOrder(claims);

        return {
            isCompound: true,
            originalInput: input,
            claims: claims,
            needsClarification: true,
            explorationOrder: explorationOrder,
            reasoning: classificationResult.reasoning
        };
    }

    /**
     * Suggests an order for exploring decomposed claims
     * Generally: verify facts first, then causation, then interpretation
     * @param {Array} claims - Array of extracted claims
     * @returns {Array} - Ordered array of claim indices
     */
    function suggestExplorationOrder(claims) {
        const order = [];
        
        // Priority 1: Presuppositions and loaded questions (must verify base claim first)
        claims.forEach((claim, i) => {
            if (claim.type === 'presupposition' || claim.type === 'loaded') {
                order.push({ index: i, priority: 1, reason: 'Verify the underlying assumption first' });
            }
        });
        
        // Priority 2: Attribution claims (did X actually say this?)
        claims.forEach((claim, i) => {
            if (claim.type === 'attribution' && !order.find(o => o.index === i)) {
                order.push({ index: i, priority: 2, reason: 'Verify the source before evaluating the claim' });
            }
        });
        
        // Priority 3: Factual/event claims
        claims.forEach((claim, i) => {
            if ((claim.type === 'death_causation' || claim.type === 'causation') && !order.find(o => o.index === i)) {
                order.push({ index: i, priority: 3, reason: 'Verify events before analyzing causes' });
            }
        });
        
        // Priority 4: Everything else
        claims.forEach((claim, i) => {
            if (!order.find(o => o.index === i)) {
                order.push({ index: i, priority: 4, reason: 'Additional claim to explore' });
            }
        });
        
        return order.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Generates a user-facing clarification prompt from decomposition
     * @param {DecompositionResult} decomposition
     * @returns {ClarificationPrompt}
     */
    function generateClarificationPrompt(decomposition) {
        if (!decomposition.needsClarification) {
            return null;
        }

        const options = [];
        
        decomposition.claims.forEach((claim, index) => {
            if (claim.type === 'multiple_questions' && claim.questions) {
                // Handle multiple distinct questions
                claim.questions.forEach((q, qIndex) => {
                    options.push({
                        id: `claim_${index}_q${qIndex}`,
                        label: q.text,
                        track: 'A', // Default to ASSESS for individual questions
                        description: 'Address this question separately'
                    });
                });
            } else if (claim.type === 'death_causation' && claim.questions) {
                // Handle death + causation (multiple sub-questions)
                claim.questions.forEach((q, qIndex) => {
                    options.push({
                        id: `claim_${index}_q${qIndex}`,
                        label: q.q,
                        track: q.track,
                        description: qIndex === 0 ? 'Verify the event first' : 'Then examine causation'
                    });
                });
            } else if (claim.question) {
                options.push({
                    id: `claim_${index}`,
                    label: claim.question,
                    track: claim.track,
                    description: claim.trackReason
                });
            }
        });

        // Add option to explore the emotional/guidance aspect if present
        if (decomposition.originalInput.match(/my\s+(dad|mom|father|mother|spouse|friend|daughter|son)/i)) {
            options.push({
                id: 'navigate_emotional',
                label: 'I need help processing this situation',
                track: 'C',
                description: 'Get guidance on navigating this personally'
            });
        }

        // Add option to explore as a belief if strong conviction detected
        if (decomposition.originalInput.match(/believe|convinced|obvious|clearly|everyone knows/i)) {
            options.push({
                id: 'interview_belief',
                label: 'I want to explore why I/others believe this',
                track: 'B',
                description: 'Examine the belief through Socratic dialogue'
            });
        }

        return {
            headline: 'This question has multiple layers',
            subhead: 'Which aspect would you like to explore first?',
            options: options,
            note: 'You can explore other aspects afterward.',
            originalInput: decomposition.originalInput
        };
    }

    // ==================== TWO-STATE BUTTON BEHAVIOR ====================
    
    /**
     * Determines the state of a discipline button
     * @param {boolean} hasInput - Whether user has entered input
     * @param {Object} salience - Salience scores from classifier
     * @param {string} discipline - The discipline name
     * @returns {Object} - { state: 'idle'|'active', glowLevel: 0-1, contextAvailable: boolean }
     */
    function getButtonState(hasInput, salience, discipline) {
        if (!hasInput) {
            return {
                state: 'idle',
                glowLevel: 0,
                contextAvailable: false,
                behavior: 'Show random factoid on click'
            };
        }

        const score = salience[discipline] || 0;
        
        return {
            state: 'active',
            glowLevel: score,
            contextAvailable: score > 0.3,
            behavior: score > 0.3 
                ? 'Show contextual relevance information' 
                : 'Show factoid (low relevance to current query)'
        };
    }

    /**
     * Gets salience level category for CSS class assignment
     * @param {number} score - Salience score 0-1
     * @returns {string} - 'high' | 'medium' | 'low' | 'none'
     */
    function getSalienceClass(score) {
        if (score >= 0.7) return 'high';
        if (score >= 0.4) return 'medium';
        if (score >= 0.2) return 'low';
        return 'none';
    }

    // ==================== CONTEXTUAL INFORMATION ====================
    
    /**
     * Contextual explanations for each discipline's relevance
     * Used when discipline button is clicked in ACTIVE state
     */
    const disciplineContextTemplates = {
        history: {
            high: 'Historical context is highly relevant here. Understanding precedents, how similar situations evolved, and what the historical record shows can illuminate this question.',
            medium: 'Some historical context may help frame this question. Consider what precedents exist and how similar claims have been evaluated in the past.',
            low: 'Historical context has limited direct relevance, but understanding how we know what we know always involves some historical awareness.'
        },
        sciences: {
            high: 'Scientific evidence and methodology are central to evaluating this claim. Look for peer-reviewed research, experimental evidence, and scientific consensus.',
            medium: 'Scientific thinking can help here—consider what evidence would support or refute this claim, and whether it\'s been tested.',
            low: 'While not primarily a scientific question, applying scientific skepticism (requiring evidence, considering alternatives) is always useful.'
        },
        philosophy: {
            high: 'This raises significant philosophical questions about knowledge, ethics, or meaning. Consider underlying assumptions and logical implications.',
            medium: 'Some philosophical reflection may help—what values or assumptions underlie this question? What would count as a satisfying answer?',
            low: 'Philosophical tools like clarifying definitions and examining assumptions can sharpen any inquiry.'
        },
        logic: {
            high: 'Logical structure is crucial here. Watch for fallacies, examine the reasoning chain, and check whether conclusions follow from premises.',
            medium: 'Consider the logical structure—are there hidden assumptions? Does the conclusion follow from the premises?',
            low: 'Basic logical hygiene (avoiding contradictions, checking inferences) applies to all questions.'
        },
        rhetoric: {
            high: 'Rhetorical framing is significant here. Pay attention to word choice, emotional appeals, and persuasive techniques being used.',
            medium: 'Consider how this is being framed. What words are chosen? What emotions are being invoked? Who benefits from this framing?',
            low: 'Awareness of rhetorical techniques helps evaluate any communication.'
        },
        media: {
            high: 'Media literacy is essential here. Consider the source, check for corroboration, and be aware of how information spreads.',
            medium: 'Source evaluation matters—where did this claim originate? Has it been verified by reliable outlets?',
            low: 'Basic source awareness (who\'s saying this and why) is always relevant.'
        },
        psychology: {
            high: 'Psychological factors are central here. Consider cognitive biases, emotional reasoning, and group dynamics that may be at play.',
            medium: 'Be aware of psychological factors—confirmation bias, motivated reasoning, and emotional investment can all influence how we evaluate claims.',
            low: 'Awareness of our own cognitive biases helps with any inquiry.'
        },
        statistics: {
            high: 'Statistical literacy is crucial here. Look at sample sizes, methodology, base rates, and whether correlations imply causation.',
            medium: 'Consider the numbers—are statistics being used appropriately? What\'s the sample size? Is correlation being confused with causation?',
            low: 'Basic numeracy (being skeptical of vague quantities, asking "compared to what?") helps evaluate claims.'
        },
        sources: {
            high: 'Source evaluation is critical here. Trace claims to their origins, check credentials, and look for conflicts of interest.',
            medium: 'Consider the sources—are they primary or secondary? Are they reliable? Do they have potential biases?',
            low: 'Asking "says who?" and "how do they know?" is always valuable.'
        }
    };

    /**
     * Gets contextual information for a discipline given current query (internal, English)
     * @param {string} discipline - Discipline name
     * @param {string} query - Current user query
     * @param {Object} salience - Salience scores
     * @returns {Object} - { discipline, relevance, explanation, suggestions }
     */
    function _getDisciplineContextInternal(discipline, query, salience) {
        const score = salience[discipline] || 0;
        const level = score >= 0.7 ? 'high' : score >= 0.3 ? 'medium' : 'low';
        const template = disciplineContextTemplates[discipline];
        
        if (!template) {
            return {
                discipline: discipline,
                relevance: level,
                score: score,
                explanation: 'Consider how this discipline\'s tools might apply to your question.',
                suggestions: []
            };
        }

        return {
            discipline: discipline,
            relevance: level,
            score: score,
            explanation: template[level],
            suggestions: getSpecificSuggestions(discipline, query, level)
        };
    }

    /**
     * Gets contextual information for a discipline given current query
     * Returns translated context if non-English language selected
     * @param {string} discipline - Discipline name
     * @param {string} query - Current user query
     * @param {Object} salience - Salience scores
     * @returns {Promise<Object>} - { discipline, relevance, explanation, suggestions }
     */
    async function getDisciplineContext(discipline, query, salience) {
        const context = _getDisciplineContextInternal(discipline, query, salience);
        
        if (typeof Vinculum !== 'undefined') {
            const lang = Vinculum.getCurrentLanguage();
            if (lang !== 'en') {
                return Vinculum.translateDisciplineContext(context, lang);
            }
        }
        return context;
    }

    /**
     * Generates specific suggestions based on discipline and query content
     * @param {string} discipline
     * @param {string} query
     * @param {string} level
     * @returns {Array} - Array of suggestion strings
     */
    function getSpecificSuggestions(discipline, query, level) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();
        
        // Add discipline-specific suggestions based on query content
        if (discipline === 'sources') {
            if (lowerQuery.includes('said') || lowerQuery.includes('claimed')) {
                suggestions.push('Verify the attribution—did this person actually say this?');
            }
            if (lowerQuery.includes('study') || lowerQuery.includes('research')) {
                suggestions.push('Locate the original study and check if it\'s peer-reviewed.');
            }
            suggestions.push('Use lateral reading—search for what others say about this source.');
        }
        
        if (discipline === 'logic') {
            if (lowerQuery.includes('because') || lowerQuery.includes('therefore')) {
                suggestions.push('Check if the conclusion actually follows from the premises.');
            }
            if (lowerQuery.includes('all') || lowerQuery.includes('never') || lowerQuery.includes('always')) {
                suggestions.push('Watch for overgeneralization—absolute claims are often false.');
            }
        }
        
        if (discipline === 'psychology') {
            if (lowerQuery.includes('believe') || lowerQuery.includes('think')) {
                suggestions.push('Consider what cognitive biases might be influencing this belief.');
            }
            if (lowerQuery.includes('everyone') || lowerQuery.includes('nobody')) {
                suggestions.push('Be aware of false consensus effect—not everyone thinks alike.');
            }
        }
        
        if (discipline === 'statistics') {
            if (lowerQuery.includes('percent') || lowerQuery.includes('%') || lowerQuery.includes('study')) {
                suggestions.push('Check the sample size and methodology.');
                suggestions.push('Ask: compared to what baseline?');
            }
            if (lowerQuery.includes('cause') || lowerQuery.includes('caused')) {
                suggestions.push('Correlation doesn\'t equal causation—look for confounding variables.');
            }
        }
        
        return suggestions;
    }

    /**
     * Synchronous English-only access (for backward compatibility)
     */
    const sync = {
        getDisciplineContext: _getDisciplineContextInternal
    };

    // ==================== PUBLIC API ====================
    
    return {
        // Compound question handling
        decomposeCompoundQuestion,
        generateClarificationPrompt,
        suggestExplorationOrder,
        
        // Two-state button behavior
        getButtonState,
        getSalienceClass,
        
        // Contextual information
        getDisciplineContext,
        
        // Synchronous English-only access
        sync,
        
        // Templates (for customization if needed)
        disciplineContextTemplates,
        claimPatterns
    };

})();

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeracityContextual;
}
