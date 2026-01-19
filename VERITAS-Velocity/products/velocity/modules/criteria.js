/**
 * CRITERIA MODULE — Assessment Framework Definitions
 * ===================================================
 * 
 * Defines the evaluation criteria sets used by Track A and Track B
 * for structured assessment of different claim types.
 * 
 * Extracted from: assess.js
 * Used by: assess.js (Track A/B), potentially verify.js
 * 
 * VERITAS Philosophy:
 * - Reality PROFILE (not score) — Understanding communication frameworks
 * - Integrity PROFILE — Evaluating consistency and transparency
 * - Teaching critical thinking, not delivering verdicts
 */

// ============================================
// CRITERIA SETS BY CLAIM TYPE
// ============================================

export const CRITERIA_SETS = {
    qualification: {
        label: 'Person Qualification',
        criteria: [
            { 
                id: 'legal', 
                label: 'Legal Eligibility', 
                description: 'Does the person meet legal/constitutional requirements for the role?' 
            },
            { 
                id: 'experience', 
                label: 'Experience & Credentials', 
                description: 'What relevant experience, education, or credentials does the person have?' 
            },
            { 
                id: 'record', 
                label: 'Historical Record', 
                description: 'What is their track record in similar or related roles?' 
            },
            { 
                id: 'alignment', 
                label: 'Value Alignment', 
                description: 'How do their stated values align with the role\'s requirements?' 
            },
            { 
                id: 'controversies', 
                label: 'Controversies & Concerns', 
                description: 'What documented concerns, controversies, or red flags exist?' 
            }
        ]
    },
    
    policy: {
        label: 'Policy Effectiveness',
        criteria: [
            { 
                id: 'goals', 
                label: 'Stated Goals Clarity', 
                description: 'Are the policy\'s goals clearly defined and measurable?' 
            },
            { 
                id: 'outcomes', 
                label: 'Measurable Outcomes', 
                description: 'What evidence exists about the policy\'s actual outcomes?' 
            },
            { 
                id: 'costbenefit', 
                label: 'Cost/Benefit Analysis', 
                description: 'How do the costs compare to the benefits?' 
            },
            { 
                id: 'alternatives', 
                label: 'Comparison to Alternatives', 
                description: 'How does this policy compare to alternative approaches?' 
            },
            { 
                id: 'implementation', 
                label: 'Implementation Challenges', 
                description: 'What practical challenges affect implementation?' 
            }
        ]
    },
    
    product: {
        label: 'Product/Service Quality',
        criteria: [
            { 
                id: 'audience', 
                label: 'Who benefits from this product or service?', 
                description: 'For whom is this product/service appropriate?' 
            },
            { 
                id: 'measure', 
                label: 'Success Criteria', 
                description: 'By what measure is success/quality defined?' 
            },
            { 
                id: 'comparison', 
                label: 'Comparison to Alternatives', 
                description: 'How does it compare to alternatives?' 
            },
            { 
                id: 'timeframe', 
                label: 'Timeframe Considerations', 
                description: 'What are short-term vs long-term implications?' 
            },
            { 
                id: 'credibility', 
                label: 'Source Credibility', 
                description: 'What conflicts of interest or biases exist in claims about it?' 
            }
        ]
    },
    
    prediction: {
        label: 'Prediction/Forecast',
        criteria: [
            { 
                id: 'trackrecord', 
                label: 'Predictor Track Record', 
                description: 'What is the predictor\'s history of accuracy?' 
            },
            { 
                id: 'transparency', 
                label: 'Model Transparency', 
                description: 'Is the reasoning/model behind the prediction transparent?' 
            },
            { 
                id: 'baserates', 
                label: 'Base Rates Acknowledged', 
                description: 'Are historical base rates considered?' 
            },
            { 
                id: 'uncertainty', 
                label: 'Uncertainty Quantified', 
                description: 'Is uncertainty appropriately acknowledged and quantified?' 
            },
            { 
                id: 'falsifiability', 
                label: 'Falsifiability Defined', 
                description: 'What would prove the prediction wrong?' 
            }
        ]
    },
    
    generic: {
        label: 'General Assessment',
        criteria: [
            { 
                id: 'evidence', 
                label: 'Evidence Quality', 
                description: 'What evidence supports or refutes this claim?' 
            },
            { 
                id: 'expertise', 
                label: 'Source Expertise', 
                description: 'Do the sources have relevant expertise?' 
            },
            { 
                id: 'audience', 
                label: 'Who benefits?', 
                description: 'Who gains or loses if this claim is accepted?' 
            },
            { 
                id: 'alternatives', 
                label: 'Alternative Perspectives', 
                description: 'What competing viewpoints exist?' 
            },
            { 
                id: 'outcomes', 
                label: 'Measurable Outcomes', 
                description: 'What concrete outcomes can be measured?' 
            },
            { 
                id: 'timeframe', 
                label: 'Timeframe Considerations', 
                description: 'What are short-term vs long-term implications?' 
            }
        ]
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get criteria set for a claim type
 * Falls back to generic if type not found
 * 
 * @param {string} claimType - One of: qualification, policy, product, prediction, generic
 * @returns {Object} Criteria set with label and criteria array
 */
export function getCriteriaSet(claimType) {
    return CRITERIA_SETS[claimType] || CRITERIA_SETS.generic;
}

/**
 * Get the display label for a claim type
 * 
 * @param {string} claimType - Claim type key
 * @returns {string} Human-readable label
 */
export function getClaimTypeLabel(claimType) {
    const set = CRITERIA_SETS[claimType];
    return set ? set.label : 'General Assessment';
}

/**
 * Get list of all available claim types
 * 
 * @returns {Array<{key: string, label: string}>} Array of type objects
 */
export function getAvailableClaimTypes() {
    return Object.entries(CRITERIA_SETS).map(([key, value]) => ({
        key,
        label: value.label
    }));
}

/**
 * Get a specific criterion by ID within a claim type
 * 
 * @param {string} claimType - Claim type key
 * @param {string} criterionId - Criterion ID
 * @returns {Object|null} Criterion object or null if not found
 */
export function getCriterion(claimType, criterionId) {
    const set = getCriteriaSet(claimType);
    return set.criteria.find(c => c.id === criterionId) || null;
}

/**
 * Format criteria as prompt-friendly text
 * Used when building assessment prompts
 * 
 * @param {string} claimType - Claim type key
 * @returns {string} Formatted criteria list for prompts
 */
export function formatCriteriaForPrompt(claimType) {
    const set = getCriteriaSet(claimType);
    return set.criteria.map((c, i) => 
        `${i + 1}. **${c.label}**: ${c.description}`
    ).join('\n');
}

// ============================================
// EXPORTS
// ============================================

export default {
    CRITERIA_SETS,
    getCriteriaSet,
    getClaimTypeLabel,
    getAvailableClaimTypes,
    getCriterion,
    formatCriteriaForPrompt
};
