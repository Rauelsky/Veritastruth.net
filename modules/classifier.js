/**
 * VERACITY v5.0 — CLASSIFIER MODULE
 * ===================================
 * Module: classifier.js
 * Version: 2.0.0 (AI-First Architecture)
 * Last Modified: 2026-01-03
 * 
 * PURPOSE:
 * Minimal routing engine that defers ALL classification to Claude API.
 * Calculates discipline salience scores for the "thinking dashboard".
 * 
 * PHILOSOPHY SHIFT (v2.0):
 * Previous versions used pattern matching to route queries to tracks.
 * v2.0 sends EVERYTHING to Claude API for intelligent, empathetic classification.
 * 
 * WHY THE CHANGE:
 * - Pattern matching is brittle and formulaic
 * - Claude understands nuance, emotion, and context better than any regex
 * - Users deserve personalized, empathetic responses - not sterile templates
 * - Cost increase ($270/month vs $180/month) is worth the quality improvement
 * 
 * DEPENDENCIES: None (core module)
 * DEPENDED ON BY: veracity.html, animations.js, contextual.js, export.js
 * 
 * CHANGE IMPACT: HIGH
 * All queries now trigger adaptive clarification via VeracityAdaptive module.
 * 
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CRITICAL: TEMPORAL VERIFICATION REQUIREMENT                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  This classifier routes queries but CANNOT verify current facts.             ║
 * ║                                                                              ║
 * ║  KNOWN FAILURE MODE (documented incidents):                                  ║
 * ║  - Dec 2025: Claude asserted Rob Reiner was alive (murdered Dec 14)          ║
 * ║  - Dec 2025: Claude asserted Kash Patel not FBI Director (confirmed Feb 25)  ║
 * ║                                                                              ║
 * ║  BEFORE ASSESSMENT, any query involving:                                     ║
 * ║  - Current status (alive/dead, holds position, policy in effect)             ║
 * ║  - Recent events (deaths, elections, appointments, policy changes)           ║
 * ║  - Attribution ("X said Y") where Y involves current events                  ║
 * ║                                                                              ║
 * ║  MUST trigger real-time web verification. Training data is NOT reliable      ║
 * ║  for current events. When user contradicts Claude's "knowledge" — SEARCH     ║
 * ║  FIRST, do not push back.                                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * EXPORTS:
 * - classifyIntent(input) → ClassificationResult (always returns AMBIGUOUS)
 * - TRACK_INFO → Track metadata object
 */

const VeracityClassifier = (function() {
    'use strict';

    // ==================== TRACK DEFINITIONS ====================
    const TRACK_INFO = {
        'A': { 
            name: 'ASSESS', 
            desc: 'Factual evaluation mode',
            color: '#c89146',
            empathyMessage: "This sounds like a factual claim that can be verified. Let me analyze the evidence and reasoning behind it."
        },
        'B': { 
            name: 'INTERVIEW',  // Changed from DEBATE per Rauel's direction
            desc: 'Socratic exploration mode',
            color: '#735fa5',
            empathyMessage: "I sense this reflects something you believe or feel strongly about. I'd like to understand your perspective better — what's leading you to this view?"
        },
        'C': { 
            name: 'NAVIGATE', 
            desc: 'Practical guidance mode',
            color: '#4b91a5',
            empathyMessage: "This sounds like a challenging situation. Let's explore it together so I can help you find some clarity and useful next steps."
        },
        'AMBIGUOUS': { 
            name: 'CLARIFY', 
            desc: 'Additional context needed',
            color: '#64748b',
            empathyMessage: "I want to make sure I help you the right way. Are you looking to verify facts, explore your thinking, or work through a difficult situation?"
        }
    };

    // ==================== DISCIPLINE DEFINITIONS ====================
    // These map to sidebar buttons and drive salience scoring
    const DISCIPLINES = [
        'history',
        'sciences', 
        'philosophy',
        'logic',
        'rhetoric',
        'media',
        'psychology',
        'statistics',
        'sources'
    ];

    // ==================== TRACK CLASSIFICATION PATTERNS ====================
    
    // PHILOSOPHY SHIFT: Let Claude API handle ALL classification
    // Cost: ~$0.003 per query (100% vs 65%)
    // Benefit: Every user gets intelligent, empathetic, contextual response
    // 
    // Previous approach: Pattern matching for "slam dunks"
    // New approach: Claude understands nuance better than any regex
    // 
    // For 1000 daily users × 3 queries = 3000 API calls/day
    // Cost: $9/day = $270/month
    // Worth it? ABSOLUTELY.
    
    const trackAPatterns = [];  // Empty - Claude handles it
    const trackBPatterns = [];  // Empty - Claude handles it
    const trackCPatterns = [];  // Empty - Claude handles it

    // Ambiguous patterns — EVERYTHING goes here now
    const ambiguousPatterns = [
        /.+/  // Matches everything - send all queries to Claude API
    ];

    // Compound/layered question patterns — contain multiple claims or embedded assumptions
    // These MUST trigger clarification to decompose before routing
    const compoundPatterns = [
        // "Is it true that X said Y" — contains both attribution AND content claims
        /is\s+it\s+true\s+that\s+.+\s+(said|claimed|stated|tweeted|posted)\s+.+/i,
        
        // Questions with "and" or "or" connecting distinct claims
        /\?\s*$.*\b(and\s+(that|also|if)|or\s+(that|if|whether))\b/i,
        
        // "Did X cause Y" where Y itself may be false
        /did\s+.+\s+cause\s+.+/i,
        
        // Questions containing quotations or reported speech with embedded claims
        /.+\s+(said|claimed|believes)\s+(that\s+)?.+\s+(is|was|caused|killed|died)/i,
        
        // "Why did X" — presupposes X happened
        /^why\s+did\s+.+/i,
        
        // "When did X stop" — classic loaded question
        /when\s+did\s+.+\s+stop/i,
        
        // Multiple question marks or semicolons (multiple questions in one)
        /\?.*\?/,
        
        // "Is it true that... and..." — compound truth claims
        /is\s+it\s+true\s+that\s+.+\s+and\s+.+/i,
        
        // Attribution + causation combinations
        /.+\s+(murder|death|died|killed).+\s+(caused|because|due\s+to)/i,
    ];

    // ==================== TEMPORAL VERIFICATION PATTERNS ====================
    // These patterns indicate claims that REQUIRE real-time verification
    // before any assessment. Training data is NOT reliable for these.
    //
    // DOCUMENTED FAILURES:
    // - Kash Patel: Claude said "not FBI Director" (he was, since Feb 2025)
    // - Rob Reiner: Claude said "alive" (murdered Dec 14, 2025)
    
    const temporalVerificationPatterns = [
        // Death/alive status
        /\b(dead|died|alive|killed|murdered|death of|passed away)\b/i,
        
        // Current position holders
        /\b(current|currently|still|now)\s+(is|serves?|holds?|works?)\b/i,
        /\bwho\s+is\s+(the\s+)?(current\s+)?(president|director|ceo|chairman|secretary|governor|mayor|senator|congressman)\b/i,
        /\bis\s+.+\s+(still\s+)?(the\s+)?(president|director|ceo|chairman|fbi|cia)\b/i,
        
        // Recent appointments/confirmations
        /\b(confirmed|appointed|sworn in|took office|resigned|fired|stepped down)\b/i,
        
        // Policy status
        /\b(is|are)\s+.+\s+(legal|illegal|banned|allowed|in effect)\b/i,
        /\b(still|currently|now)\s+(in effect|active|enforced)\b/i,
        
        // Recent events (deaths, elections, disasters)
        /\b(just|recently|this week|this month|yesterday|last week)\s+(happened|occurred|died|elected|announced)\b/i,
        
        // Election results
        /\bwho\s+won\s+(the\s+)?(election|race|vote)\b/i,
        /\b(won|lost|elected)\s+(the\s+)?(election|presidency|race)\b/i,
        
        // "Did X happen" for recent events
        /\bdid\s+.+\s+(really\s+)?(happen|occur|die|resign|get fired)\b/i,
        
        // Attribution to living/current figures about recent statements  
        /\b(trump|biden|[A-Z][a-z]+)\s+(said|says|claimed|tweeted|posted|announced)\b/i,
    ];

    /**
     * Checks if a query requires temporal (real-time) verification
     * @param {string} text - Lowercase query text
     * @returns {Object} - { required: boolean, reason: string, patterns: string[] }
     */
    function checkTemporalVerification(text) {
        const matchedPatterns = [];
        
        for (const pattern of temporalVerificationPatterns) {
            if (pattern.test(text)) {
                matchedPatterns.push(pattern.toString());
            }
        }
        
        if (matchedPatterns.length > 0) {
            return {
                required: true,
                reason: 'Query involves time-sensitive claims that require real-time verification. Training data may be outdated.',
                patterns: matchedPatterns,
                warning: '⚠️ TEMPORAL VERIFICATION REQUIRED: Do NOT rely on training data for current status claims.'
            };
        }
        
        return { required: false, reason: null, patterns: [] };
    }

    // ==================== SALIENCE KEYWORD MAPS ====================
    // Keywords that indicate relevance of each discipline to the query
    // Scores: strong match = 0.9, moderate = 0.6, weak = 0.3
    
    const salienceKeywords = {
        history: {
            strong: [
                'historical', 'history', 'historically', 'ancient', 'medieval',
                'century', 'decade', 'era', 'period', 'war', 'revolution',
                'founding fathers', 'constitution', 'civil war', 'world war',
                'holocaust', 'slavery', 'colonialism', 'empire', 'dynasty'
            ],
            moderate: [
                'past', 'traditional', 'originally', 'founded', 'established',
                'precedent', 'legacy', 'heritage', 'ancestor', 'generation'
            ],
            weak: [
                'old', 'before', 'used to', 'back then', 'always been'
            ]
        },
        sciences: {
            strong: [
                'scientific', 'science', 'study', 'research', 'experiment',
                'data', 'evidence', 'peer-reviewed', 'journal', 'laboratory',
                'hypothesis', 'theory', 'empirical', 'observation', 'clinical',
                'vaccine', 'virus', 'dna', 'gene', 'evolution', 'climate',
                'physics', 'chemistry', 'biology', 'medicine', 'medical'
            ],
            moderate: [
                'proven', 'tested', 'measured', 'observed', 'documented',
                'expert', 'specialist', 'doctor', 'scientist', 'researcher'
            ],
            weak: [
                'natural', 'chemical', 'technical', 'discovery'
            ]
        },
        philosophy: {
            strong: [
                'philosophical', 'philosophy', 'ethics', 'ethical', 'moral',
                'morality', 'virtue', 'justice', 'rights', 'freedom',
                'meaning', 'existence', 'truth', 'reality', 'consciousness',
                'free will', 'determinism', 'metaphysics', 'epistemology'
            ],
            moderate: [
                'principle', 'value', 'belief', 'worldview', 'ideology',
                'should', 'ought', 'right', 'wrong', 'good', 'evil'
            ],
            weak: [
                'think', 'believe', 'feel', 'perspective', 'viewpoint'
            ]
        },
        logic: {
            strong: [
                'logical', 'logic', 'fallacy', 'fallacious', 'argument',
                'premise', 'conclusion', 'syllogism', 'valid', 'invalid',
                'deductive', 'inductive', 'inference', 'reasoning',
                'contradiction', 'consistent', 'inconsistent', 'paradox'
            ],
            moderate: [
                'therefore', 'thus', 'hence', 'because', 'since',
                'implies', 'follows', 'proof', 'prove', 'disprove'
            ],
            weak: [
                'makes sense', 'doesn\'t follow', 'reason', 'rational'
            ]
        },
        rhetoric: {
            strong: [
                'rhetoric', 'rhetorical', 'persuasion', 'persuade', 'propaganda',
                'manipulation', 'framing', 'narrative', 'spin', 'talking points',
                'dog whistle', 'loaded language', 'euphemism', 'appeal to'
            ],
            moderate: [
                'argument', 'debate', 'convince', 'influence', 'messaging',
                'speech', 'statement', 'claim', 'assertion'
            ],
            weak: [
                'said', 'says', 'saying', 'told', 'telling', 'word choice'
            ]
        },
        media: {
            strong: [
                'media', 'news', 'journalist', 'journalism', 'reporter',
                'mainstream', 'coverage', 'headline', 'article', 'broadcast',
                'social media', 'facebook', 'twitter', 'youtube', 'tiktok',
                'viral', 'misinformation', 'disinformation', 'fake news',
                'fact-check', 'bias', 'editorial', 'opinion piece'
            ],
            moderate: [
                'source', 'outlet', 'channel', 'network', 'publication',
                'reported', 'published', 'posted', 'shared', 'spread'
            ],
            weak: [
                'read', 'saw', 'heard', 'online', 'internet'
            ]
        },
        psychology: {
            strong: [
                'psychological', 'psychology', 'cognitive', 'bias', 'biases',
                'confirmation bias', 'motivated reasoning', 'groupthink',
                'tribalism', 'identity', 'belief', 'emotion', 'emotional',
                'trauma', 'anxiety', 'fear', 'anger', 'denial', 'projection'
            ],
            moderate: [
                'mindset', 'mentality', 'attitude', 'perception', 'feel',
                'feeling', 'think', 'thinking', 'brain', 'mental'
            ],
            weak: [
                'people', 'person', 'human', 'behavior', 'react', 'response'
            ]
        },
        statistics: {
            strong: [
                'statistic', 'statistics', 'statistical', 'percent', 'percentage',
                'average', 'mean', 'median', 'correlation', 'causation',
                'sample', 'population', 'margin of error', 'confidence interval',
                'p-value', 'significant', 'significance', 'probability', 'odds',
                'rate', 'ratio', 'trend', 'data', 'numbers', 'figures'
            ],
            moderate: [
                'survey', 'poll', 'study', 'research', 'analysis',
                'increase', 'decrease', 'growth', 'decline', 'change'
            ],
            weak: [
                'many', 'most', 'few', 'some', 'majority', 'minority'
            ]
        },
        sources: {
            strong: [
                'source', 'sources', 'citation', 'cite', 'reference',
                'credibility', 'credible', 'reliable', 'unreliable',
                'primary source', 'secondary source', 'peer-reviewed',
                'verified', 'unverified', 'anonymous', 'attributed'
            ],
            moderate: [
                'according to', 'reported by', 'stated by', 'claimed by',
                'origin', 'original', 'where did', 'who said'
            ],
            weak: [
                'they say', 'people say', 'i heard', 'i read', 'somewhere'
            ]
        }
    };

    // ==================== CLASSIFICATION FUNCTION ====================
    
    /**
     * Classifies user input into a track and calculates discipline salience
     * @param {string} input - User's query text
     * @returns {ClassificationResult} - Track, confidence, reasoning, and salience scores
     */
    function classifyIntent(input) {
        const text = input.toLowerCase().trim();
        const originalText = input.trim();
        
        let track = null;
        let confidence = 0;
        let reasoning = '';
        let isCompound = false;

        // CRITICAL: Check for temporal verification requirement FIRST
        // This is a corruption-resistance precept based on documented failures
        const temporalCheck = checkTemporalVerification(text);

        // FIRST: Check for compound/layered questions that need decomposition
        // These take priority because they contain multiple claims that could route differently
        for (const pattern of compoundPatterns) {
            if (pattern.test(text)) {
                isCompound = true;
                track = 'AMBIGUOUS';
                confidence = 0.70 + Math.random() * 0.15;
                reasoning = 'COMPOUND QUESTION DETECTED: This query contains multiple embedded claims or assumptions that need to be separated before assessment. ';
                
                // Add specific reasoning based on pattern type
                if (/is\s+it\s+true\s+that\s+.+\s+(said|claimed)/i.test(text)) {
                    reasoning += 'Contains both an attribution claim (did X say this?) AND a content claim (is what they said true?). These require separate verification.';
                } else if (/.+\s+(murder|death|died|killed).+\s+(caused|because)/i.test(text)) {
                    reasoning += 'Contains claims about both an event AND its causation. The event itself may need verification before analyzing causation.';
                } else if (/^why\s+did/i.test(text)) {
                    reasoning += 'This "why" question presupposes that something happened. We should first verify the underlying claim before exploring reasons.';
                } else if (/when\s+did\s+.+\s+stop/i.test(text)) {
                    reasoning += 'Classic loaded question structure — presupposes an action that may not have occurred.';
                } else if (/\?.*\?/.test(text)) {
                    reasoning += 'Multiple questions detected. Each should be addressed separately for clarity.';
                } else {
                    reasoning += 'Multiple claims detected that may require different analytical approaches.';
                }
                break;
            }
        }

        // Only proceed with standard classification if not a compound question
        if (!isCompound) {
            // Check Track A patterns (ASSESS)
            for (const pattern of trackAPatterns) {
                if (pattern.test(text)) {
                    track = 'A';
                    confidence = 0.85 + Math.random() * 0.12;
                    reasoning = 'Input contains interrogative structure seeking factual verification. ';
                    
                    if (/is\s+(that|this|it)\s+true/i.test(text)) {
                        reasoning += 'Explicit truth-seeking phrase detected.';
                        confidence = 0.95;
                    } else if (/evidence|consensus|scientific/i.test(text)) {
                        reasoning += 'Request for empirical or consensus information.';
                        confidence = 0.92;
                    } else if (/fact[\s-]?check|verify/i.test(text)) {
                        reasoning += 'Explicit verification request detected.';
                        confidence = 0.94;
                    }
                    break;
                }
            }

            // Check Track B patterns (INTERVIEW) - only if not already matched
            if (!track) {
                for (const pattern of trackBPatterns) {
                    if (pattern.test(text)) {
                        track = 'B';
                        confidence = 0.80 + Math.random() * 0.15;
                        reasoning = 'Input presents a belief statement or strong position. ';
                        
                        if (/^i\s+believe/i.test(text)) {
                            reasoning += 'Explicit first-person belief declaration.';
                            confidence = 0.94;
                        } else if (/hoax|murder|stolen|absolute/i.test(text)) {
                            reasoning += 'Contains absolutist framing indicating defended position.';
                        } else if (/prove\s+(me\s+)?wrong|change\s+my\s+mind/i.test(text)) {
                            reasoning += 'Challenge to engage Socratically.';
                            confidence = 0.93;
                        } else if (/wake\s+up|sheep|sheeple/i.test(text)) {
                            reasoning += 'Conspiratorial framing suggests deeply held belief.';
                            confidence = 0.88;
                        }
                        break;
                    }
                }
            }

            // Check Track C patterns (NAVIGATE)
            for (const pattern of trackCPatterns) {
                if (pattern.test(text)) {
                    track = 'C';
                    confidence = 0.85 + Math.random() * 0.12;
                    reasoning = 'Input indicates practical or interpersonal guidance need. ';
                    
                    if (/how\s+(do|can|should)\s+i/i.test(text)) {
                        reasoning += 'Explicit request for actionable guidance.';
                        confidence = 0.91;
                    } else if (/my\s+(dad|mom|mother|father|sister|brother|friend|spouse|partner|wife|husband)/i.test(text)) {
                        reasoning += 'References personal relationship requiring navigation.';
                        confidence = 0.93;
                    } else if (/thanksgiving|christmas|holiday|family\s+(gathering|dinner)/i.test(text)) {
                        reasoning += 'References high-stakes interpersonal context.';
                        confidence = 0.90;
                    }
                    break;
                }
            }

            // Check ambiguous patterns
            for (const pattern of ambiguousPatterns) {
                if (pattern.test(text)) {
                    track = 'AMBIGUOUS';
                    confidence = 0.45 + Math.random() * 0.15;
                    reasoning = 'Input is ambiguous—could be seeking facts, exploration, or guidance. Clarification needed.';
                    break;
                }
            }

            // Fallback classification based on punctuation
            if (!track) {
                if (text.endsWith('?')) {
                    track = 'A';
                    confidence = 0.65;
                    reasoning = 'Question mark suggests factual inquiry. Moderate confidence.';
                } else if (text.endsWith('.') || text.endsWith('!')) {
                    track = 'B';
                    confidence = 0.60;
                    reasoning = 'Declarative statement suggests belief or position. Moderate confidence.';
                } else {
                    track = 'AMBIGUOUS';
                    confidence = 0.40;
                    reasoning = 'Unable to determine clear intent. Clarification recommended.';
                }
            }
        } // end if (!isCompound)

        // Calculate discipline salience scores
        const salience = calculateSalience(text);

        return { 
            track, 
            confidence: Math.round(confidence * 100), 
            reasoning,
            empathyMessage: TRACK_INFO[track].empathyMessage,
            isCompound,
            temporalVerification: temporalCheck,
            salience,
            originalInput: originalText,
            timestamp: new Date().toISOString()
        };
    }

    // ==================== SALIENCE CALCULATION ====================
    
    /**
     * Calculates salience scores for each discipline based on query content
     * @param {string} text - Lowercase query text
     * @returns {Object} - Salience scores (0.0-1.0) for each discipline
     */
    function calculateSalience(text) {
        const scores = {};
        
        for (const discipline of DISCIPLINES) {
            let score = 0;
            const keywords = salienceKeywords[discipline];
            
            // Check strong keywords (0.9 weight)
            for (const keyword of keywords.strong) {
                if (text.includes(keyword.toLowerCase())) {
                    score = Math.max(score, 0.9);
                    break; // One strong match is enough for high salience
                }
            }
            
            // Check moderate keywords (0.6 weight) if no strong match
            if (score < 0.9) {
                for (const keyword of keywords.moderate) {
                    if (text.includes(keyword.toLowerCase())) {
                        score = Math.max(score, 0.6);
                        break;
                    }
                }
            }
            
            // Check weak keywords (0.3 weight) if no moderate match
            if (score < 0.6) {
                for (const keyword of keywords.weak) {
                    if (text.includes(keyword.toLowerCase())) {
                        score = Math.max(score, 0.3);
                        break;
                    }
                }
            }
            
            // Apply track-based baseline adjustments
            // Certain disciplines are inherently relevant to certain tracks
            scores[discipline] = score;
        }
        
        // Apply track-agnostic baseline for universally relevant disciplines
        // SOURCES and LOGIC are almost always at least somewhat relevant
        if (scores.sources < 0.3) scores.sources = 0.25;
        if (scores.logic < 0.3) scores.logic = 0.2;
        
        return scores;
    }

    /**
     * Returns salience level string for a given score
     * @param {number} score - Salience score (0.0-1.0)
     * @returns {string} - 'high', 'medium', or 'low'
     */
    function getSalienceLevel(score) {
        if (score >= 0.7) return 'high';
        if (score >= 0.3) return 'medium';
        return 'low';
    }

    /**
     * Returns disciplines sorted by salience (highest first)
     * @param {Object} salience - Salience scores object
     * @returns {Array} - Array of {discipline, score, level} sorted by score
     */
    function getRankedDisciplines(salience) {
        return DISCIPLINES
            .map(d => ({ 
                discipline: d, 
                score: salience[d], 
                level: getSalienceLevel(salience[d]) 
            }))
            .sort((a, b) => b.score - a.score);
    }

    // ==================== PUBLIC API ====================
    
    return {
        classifyIntent,
        calculateSalience,
        getSalienceLevel,
        getRankedDisciplines,
        checkTemporalVerification,
        TRACK_INFO,
        DISCIPLINES
    };

})();

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeracityClassifier;
}
