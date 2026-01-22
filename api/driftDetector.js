/**
 * VERITAS Conversational Drift Detector
 * =====================================
 * Module for detecting topic drift and conversational discontinuity
 * in Track B (Interview) and Track C (Navigate) interactions.
 * 
 * Philosophy: "Listening AND Hearing" - Better to ask for clarification
 * than to confidently proceed down the wrong path.
 * 
 * Author: VERITAS LLC
 * Version: 1.0.0
 */

// ============================================
// DOMAIN MARKER DEFINITIONS
// ============================================
const DOMAIN_MARKERS = {
    biblical: new Set([
        'bible', 'biblical', 'scripture', 'hebrew', 'greek', 'testament',
        'genesis', 'exodus', 'chronicles', 'psalm', 'gospel', 'apostle',
        'priest', 'priestly', 'levite', 'levitical', 'covenant', 'torah',
        'genealogy', 'genealogical', 'patriarch', 'theological', 'theology',
        'jesus', 'christ', 'god', 'lord', 'faith', 'church', 'prayer'
    ]),
    political: new Set([
        'trump', 'biden', 'democrat', 'republican', 'congress', 'senate',
        'election', 'vote', 'campaign', 'policy', 'legislation', 'governor',
        'president', 'administration', 'partisan', 'liberal', 'conservative',
        'government', 'politician', 'politics', 'political'
    ]),
    financial: new Set([
        'crypto', 'cryptocurrency', 'bitcoin', 'stock', 'market', 'investment',
        'bribe', 'bribery', 'money', 'fund', 'portfolio', 'trading', 'exchange',
        'currency', 'asset', 'wealth', 'financial', 'economic', 'bank', 'loan'
    ]),
    technical: new Set([
        'code', 'programming', 'software', 'algorithm', 'database', 'api',
        'function', 'variable', 'debug', 'compile', 'python', 'javascript',
        'html', 'css', 'server', 'client', 'framework', 'computer', 'app'
    ]),
    statistical: new Set([
        'statistical', 'statistics', 'probability', 'sample', 'hypothesis',
        'significance', 'significant', 'p-value', 'z-score', 'correlation',
        'regression', 'randomization', 'permutation', 'deviation', 'variance',
        'mean', 'average', 'data', 'analysis', 'experiment', 'test', 'result',
        'coefficient', 'confidence', 'interval', 'distribution', 'random'
    ]),
    personal: new Set([
        'family', 'wife', 'husband', 'child', 'children', 'daughter', 'son',
        'parent', 'home', 'health', 'feeling', 'relationship', 'friend',
        'marriage', 'divorce', 'love', 'anxiety', 'depression', 'stress'
    ]),
    wisdom: new Set([
        'wisdom', 'philosophy', 'ethical', 'moral', 'virtue', 'principle',
        'guidance', 'advice', 'counsel', 'tradition', 'ancient', 'proverb',
        'meaning', 'purpose', 'values', 'belief', 'truth'
    ])
};

// ============================================
// CONTINUATION MARKERS
// ============================================
const CONTINUATION_MARKERS = [
    'also', 'additionally', 'furthermore', 'related to that',
    'speaking of', 'on that note', 'building on that',
    'repeat the', 'again', 'another', 'same method',
    'similar to', 'different approach', 'instead of',
    'alternatively', 'the names', 'does this prove',
    'reminds me of', 'you mentioned', 'we discussed',
    'as you said', 'going back to', 'continuing'
];

const REFERENTIAL_MARKERS = [
    'the experiment', 'the analysis', 'the results',
    'this method', 'that approach', 'your suggestion',
    'p-value', 'significance', 'intentionally arranged',
    'pastor', 'hebrew', 'the names', 'genealog'
];

// ============================================
// CLARIFICATION PROMPTS
// ============================================
const CLARIFICATION_PROMPTS = {
    domain_change: [
        "I notice we seem to be shifting to a different topic area. Are we starting a new line of inquiry, or does this connect to what we've been discussing in a way I should understand?",
        "This appears to touch on something different from what we've been exploring. Should I treat this as a new conversation thread, or is there a connection I'm missing?"
    ],
    entity_shift: [
        "You've introduced some new elements that seem different from what we've been exploring. Are we pivoting to a new topic, or building on our previous discussion?"
    ],
    semantic_discontinuity: [
        "I want to make sure I'm fully hearing you. This seems like it might be a new topic — is that right, or am I missing a connection to our previous conversation?"
    ]
};

// ============================================
// SENSITIVITY THRESHOLDS
// ============================================
const SENSITIVITY_THRESHOLDS = {
    gentle: 0.70,
    balanced: 0.50,
    vigilant: 0.35
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Detect which domains are present in a text
 */
function detectDomains(text) {
    const textLower = text.toLowerCase();
    const detected = new Set();
    
    for (const [domain, markers] of Object.entries(DOMAIN_MARKERS)) {
        let matchCount = 0;
        for (const marker of markers) {
            if (textLower.includes(marker)) {
                matchCount++;
            }
        }
        // Require at least 1 match to claim a domain
        if (matchCount >= 1) {
            detected.add(domain);
        }
    }
    
    return detected;
}

/**
 * Check for continuation signals in text
 */
function detectContinuationSignals(text) {
    const textLower = text.toLowerCase();
    
    const hasContinuation = CONTINUATION_MARKERS.some(marker => 
        textLower.includes(marker)
    );
    
    const hasReferential = REFERENTIAL_MARKERS.some(marker => 
        textLower.includes(marker)
    );
    
    return { hasContinuation, hasReferential };
}

/**
 * Calculate set intersection
 */
function setIntersection(setA, setB) {
    return new Set([...setA].filter(x => setB.has(x)));
}

/**
 * Check if setA is subset of setB
 */
function isSubset(setA, setB) {
    for (const elem of setA) {
        if (!setB.has(elem)) return false;
    }
    return true;
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

/**
 * Analyze a new message for drift from conversation context
 * 
 * @param {string} newMessage - The new user message to analyze
 * @param {Array} conversationHistory - Array of {role, content} message objects
 * @param {Object} options - Configuration options
 * @param {string} options.track - 'interview' or 'navigate'
 * @param {string} options.sensitivity - 'gentle', 'balanced', or 'vigilant'
 * @param {number} options.windowSize - Number of recent messages to consider (default: 6)
 * 
 * @returns {Object} Analysis result with:
 *   - driftScore: 0.0 to 1.0
 *   - shouldClarify: boolean
 *   - clarificationPrompt: string or null
 *   - details: object with breakdown
 */
function analyzeForDrift(newMessage, conversationHistory = [], options = {}) {
    const {
        track = 'interview',
        sensitivity = track === 'navigate' ? 'vigilant' : 'balanced',
        windowSize = 6
    } = options;
    
    const threshold = SENSITIVITY_THRESHOLDS[sensitivity] || 0.50;
    
    // Need at least 2 prior turns to assess drift meaningfully
    if (conversationHistory.length < 2) {
        return {
            driftScore: 0,
            shouldClarify: false,
            clarificationPrompt: null,
            details: { reason: 'insufficient_history' }
        };
    }
    
    // Get recent window of conversation
    const recentMessages = conversationHistory.slice(-windowSize);
    
    // Aggregate domains from conversation history
    const establishedDomains = new Set();
    for (const msg of recentMessages) {
        const domains = detectDomains(msg.content);
        for (const d of domains) {
            establishedDomains.add(d);
        }
    }
    
    // Detect domains in new message
    const currentDomains = detectDomains(newMessage);
    
    // Detect continuation signals
    const { hasContinuation, hasReferential } = detectContinuationSignals(newMessage);
    
    // Calculate continuation reduction
    let continuationReduction = 0;
    if (hasContinuation) continuationReduction += 0.35;
    if (hasReferential) continuationReduction += 0.25;
    
    // Calculate domain drift
    let domainDrift;
    const details = {
        currentDomains: [...currentDomains],
        establishedDomains: [...establishedDomains],
        hasContinuation,
        hasReferential
    };
    
    if (currentDomains.size === 0 && establishedDomains.size === 0) {
        // Neither has domain markers
        domainDrift = 0.2;
    } else if (currentDomains.size === 0 && establishedDomains.size > 0) {
        // Established domains exist but new message doesn't match any
        domainDrift = 0.7;
    } else if (isSubset(currentDomains, establishedDomains)) {
        // Current is subset of established - staying within topic
        domainDrift = 0.0;
    } else if (setIntersection(currentDomains, establishedDomains).size > 0) {
        // Some overlap - partial continuity
        const overlap = setIntersection(currentDomains, establishedDomains).size;
        const overlapRatio = overlap / currentDomains.size;
        domainDrift = 0.5 * (1.0 - overlapRatio);
    } else {
        // No overlap - complete domain shift
        domainDrift = 1.0;
    }
    
    details.domainDrift = domainDrift;
    
    // Calculate weighted drift score
    let weightedDrift;
    
    if (domainDrift >= 0.95) {
        // Complete domain shift to NEW domain
        weightedDrift = 0.85;
    } else if (domainDrift >= 0.6 && setIntersection(currentDomains, establishedDomains).size === 0) {
        // No domain detected but established domains exist
        weightedDrift = 0.65;
    } else if (domainDrift <= 0.1) {
        // Strong domain continuity
        weightedDrift = 0.1 + (domainDrift * 0.2);
    } else {
        // Normal weighting
        weightedDrift = 0.1 + (domainDrift * 0.6);
    }
    
    // Apply continuation reduction
    weightedDrift = Math.max(0, weightedDrift - continuationReduction);
    
    details.weightedDrift = weightedDrift;
    details.continuationReduction = continuationReduction;
    details.threshold = threshold;
    
    // Determine if clarification needed
    const shouldClarify = weightedDrift >= threshold;
    
    // Select appropriate clarification prompt
    let clarificationPrompt = null;
    let driftType = null;
    
    if (shouldClarify) {
        if (domainDrift >= 0.9) {
            driftType = 'domain_change';
        } else {
            driftType = 'semantic_discontinuity';
        }
        
        const prompts = CLARIFICATION_PROMPTS[driftType];
        clarificationPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    }
    
    return {
        driftScore: Math.round(weightedDrift * 100) / 100,
        shouldClarify,
        clarificationPrompt,
        driftType,
        details
    };
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    analyzeForDrift,
    detectDomains,
    SENSITIVITY_THRESHOLDS,
    DOMAIN_MARKERS
};
