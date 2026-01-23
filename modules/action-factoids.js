/**
 * VERACITY v5.2 — ACTION FACTOIDS MODULE
 * =======================================
 * Module: action-factoids.js
 * Version: 1.0.0
 * Last Modified: 2026-01-22
 * 
 * PURPOSE:
 * Powers the RIGHT column of the sidebar (ARCHIVES, RESEARCH, ETHICS, etc.)
 * Each action button teaches about the METHOD or APPROACH, not the field itself.
 * 
 * SYMMETRY WITH FACTOIDS:
 * - Left column (sidebar-label): "What is this field about?" → factoids.js
 * - Right column (sidebar-action): "What is this approach/tool about?" → action-factoids.js
 * 
 * ARCHITECTURE:
 * PRIMARY: Calls /api/action-factoids for Claude-generated content
 * FALLBACK: Static ACTION_FACTOID_DATA when API unavailable
 * 
 * VINCULUM INTEGRATION:
 * API generates culturally-resonant content based on language.
 * 
 * PHILOSOPHY:
 * "Teaching the tools of truth-seeking, not just the truths themselves."
 * 
 * EXPORTS:
 * - getRandomActionFactoid(action) → Promise<ActionFactoid> (API-first)
 * - sync.getRandomActionFactoid(action) → ActionFactoid (English only, static)
 * - ACTION_FACTOID_DATA → Raw data (fallback)
 * 
 * VERITAS LLC — Prairie du Sac, Wisconsin
 * 🖖 Infinite Diversity in Infinite Combinations
 */

const VeracityActionFactoids = (function() {
    'use strict';

    // ==================== ACTION FACTOID DATA STRUCTURE ====================
    // Each factoid teaches about the METHOD or TOOL, not the field
    
    const ACTION_FACTOID_DATA = {
        
        // ==================== ARCHIVES ====================
        // Teaching: How to do archival research, primary source evaluation
        archives: [
            {
                id: 'arch_001',
                text: 'Primary sources aren\'t automatically more truthful than secondary ones. A diary entry captures one perspective; a historian synthesizing hundreds of diaries might see patterns the diarist couldn\'t.',
                source: 'Archival methodology',
                tags: ['primary-sources', 'methodology', 'perspective']
            },
            {
                id: 'arch_002',
                text: 'The archives that survive aren\'t random. They reflect who had power to preserve their records. The history of the poor is often written in the court documents of the rich who prosecuted them.',
                source: 'Archival theory',
                tags: ['selection-bias', 'power', 'preservation']
            },
            {
                id: 'arch_003',
                text: 'Absence of evidence isn\'t evidence of absence—but in archives, it often means something. Someone decided not to record it, or decided to destroy it, or never had the power to create records at all.',
                source: 'Historical methodology',
                tags: ['silence', 'gaps', 'interpretation']
            },
            {
                id: 'arch_004',
                text: 'The best archival researchers read against the grain—asking not just what a document says, but why it was created, who was meant to see it, and what the author assumed didn\'t need saying.',
                source: 'Archival practice',
                tags: ['close-reading', 'context', 'intention']
            },
            {
                id: 'arch_005',
                text: 'Digital archives feel complete but often aren\'t. Only about 10-15% of historical newspapers have been digitized. If you only search online, you\'re searching a biased sample.',
                source: 'Digital humanities',
                tags: ['digitization', 'bias', 'completeness']
            }
        ],

        // ==================== RESEARCH ====================
        // Teaching: Scientific method, research design, evidence evaluation
        research: [
            {
                id: 'res_001',
                text: 'A single study proves almost nothing. Science works through replication, meta-analysis, and the slow accumulation of evidence. Headlines about "groundbreaking studies" are usually premature.',
                source: 'Philosophy of science',
                tags: ['replication', 'methodology', 'skepticism']
            },
            {
                id: 'res_002',
                text: 'The "gold standard" randomized controlled trial isn\'t always possible or ethical. We can\'t randomly assign people to smoke for 30 years. Much of what we know comes from imperfect but carefully designed observational studies.',
                source: 'Research methodology',
                tags: ['RCT', 'ethics', 'observational']
            },
            {
                id: 'res_003',
                text: 'Peer review catches some errors but misses many. It\'s a filter, not a guarantee. Reviewers are unpaid volunteers with their own biases, checking work in fields where they\'re competitors.',
                source: 'Academic publishing',
                tags: ['peer-review', 'limitations', 'process']
            },
            {
                id: 'res_004',
                text: 'Negative results—experiments that found nothing—rarely get published. This "file drawer problem" means the published literature systematically overestimates effect sizes.',
                source: 'Publication bias',
                tags: ['publication-bias', 'null-results', 'distortion']
            },
            {
                id: 'res_005',
                text: 'The phrase "studies show" is almost meaningless without knowing: which studies, how many, how well-designed, how consistent, and whether the person citing them actually read them.',
                source: 'Science communication',
                tags: ['citation', 'verification', 'rhetoric']
            }
        ],

        // ==================== ETHICS ====================
        // Teaching: Ethical reasoning methods, moral philosophy tools
        ethics: [
            {
                id: 'eth_001',
                text: 'Most ethical dilemmas aren\'t between good and evil—they\'re between competing goods. The hard part isn\'t knowing right from wrong; it\'s choosing between loyalty and honesty, justice and mercy.',
                source: 'Moral philosophy',
                tags: ['dilemmas', 'competing-values', 'complexity']
            },
            {
                id: 'eth_002',
                text: 'The "trolley problem" is famous but misleading. Real ethical choices rarely involve pulling levers with certain outcomes. They involve uncertainty, relationships, institutions, and consequences we can\'t foresee.',
                source: 'Applied ethics',
                tags: ['thought-experiments', 'limitations', 'realism']
            },
            {
                id: 'eth_003',
                text: 'Consequentialism asks "what outcome is best?" Deontology asks "what rule should I follow?" Virtue ethics asks "what would a good person do?" Each captures something the others miss.',
                source: 'Ethical frameworks',
                tags: ['frameworks', 'complementarity', 'tools']
            },
            {
                id: 'eth_004',
                text: 'The "is-ought gap" (Hume\'s guillotine) reminds us: facts alone don\'t tell us what to do. Knowing how the world is doesn\'t automatically reveal how it should be. Values require separate justification.',
                source: 'Hume',
                tags: ['is-ought', 'facts-values', 'reasoning']
            },
            {
                id: 'eth_005',
                text: 'Moral intuitions are data, not conclusions. When a philosophical argument contradicts your gut feeling, either the argument is flawed or your intuition needs examining. Both are possible.',
                source: 'Moral epistemology',
                tags: ['intuition', 'reasoning', 'reflection']
            }
        ],

        // ==================== FALLACIES ====================
        // Teaching: Logical fallacies, reasoning errors, argument evaluation
        fallacies: [
            {
                id: 'fal_001',
                text: 'Naming a fallacy doesn\'t win an argument. "That\'s an ad hominem!" is often just a way to avoid engaging with substance. The question is whether the reasoning actually fails, not whether it fits a Latin label.',
                source: 'Argumentation theory',
                tags: ['fallacy-fallacy', 'engagement', 'rhetoric']
            },
            {
                id: 'fal_002',
                text: 'The slippery slope isn\'t always a fallacy. Sometimes A really does lead to B. The question is whether the causal chain is plausible or merely asserted. Evidence matters.',
                source: 'Logic',
                tags: ['slippery-slope', 'causation', 'evidence']
            },
            {
                id: 'fal_003',
                text: 'Appeal to authority is only fallacious when the authority isn\'t actually expert in the relevant domain. Citing a physicist on physics isn\'t a fallacy; citing a physicist on economics might be.',
                source: 'Critical thinking',
                tags: ['authority', 'expertise', 'relevance']
            },
            {
                id: 'fal_004',
                text: 'The "strawman" is overdiagnosed. Before accusing someone of attacking a strawman, check: did they misunderstand, or did they identify an implication you didn\'t intend but your argument actually has?',
                source: 'Argumentation',
                tags: ['strawman', 'charity', 'implications']
            },
            {
                id: 'fal_005',
                text: 'Tu quoque ("you do it too") doesn\'t refute an argument, but it can reveal hypocrisy or double standards. Whether that matters depends on whether consistency is relevant to the claim.',
                source: 'Logic',
                tags: ['tu-quoque', 'hypocrisy', 'relevance']
            }
        ],

        // ==================== PERSUASION ====================
        // Teaching: Rhetorical techniques, influence awareness
        persuasion: [
            {
                id: 'per_001',
                text: 'Aristotle\'s three appeals—ethos (credibility), pathos (emotion), logos (logic)—are descriptive, not prescriptive. Effective persuasion usually combines all three. Spotting them helps you evaluate arguments.',
                source: 'Classical rhetoric',
                tags: ['aristotle', 'appeals', 'analysis']
            },
            {
                id: 'per_002',
                text: 'Framing effects are everywhere. "90% fat-free" and "10% fat" are identical information but feel different. The frame isn\'t the lie; it\'s the choice of which truth to emphasize.',
                source: 'Behavioral science',
                tags: ['framing', 'psychology', 'emphasis']
            },
            {
                id: 'per_003',
                text: 'The most powerful persuasion often doesn\'t feel like persuasion. It works by shaping what questions get asked, what options seem available, and what counts as "common sense."',
                source: 'Media studies',
                tags: ['agenda-setting', 'invisible', 'framing']
            },
            {
                id: 'per_004',
                text: 'Repetition creates familiarity, and familiarity feels like truth. This "illusory truth effect" works even when people know better. Hearing something multiple times makes it feel more credible.',
                source: 'Cognitive psychology',
                tags: ['repetition', 'illusory-truth', 'familiarity']
            },
            {
                id: 'per_005',
                text: 'Social proof ("everyone\'s doing it") is persuasive because it\'s often genuinely informative. When you don\'t know what to do, others\' behavior is evidence. The question is whether they know more than you.',
                source: 'Social psychology',
                tags: ['social-proof', 'heuristics', 'information']
            }
        ],

        // ==================== LITERACY ====================
        // Teaching: Media literacy skills, information evaluation
        literacy: [
            {
                id: 'lit_001',
                text: 'Lateral reading—opening new tabs to check what others say about a source—beats vertical reading (scrutinizing the source itself). Professional fact-checkers spend less time on suspicious sites, not more.',
                source: 'Stanford History Education Group',
                tags: ['lateral-reading', 'fact-checking', 'technique']
            },
            {
                id: 'lit_002',
                text: 'The question isn\'t "is this source biased?" (all sources have perspectives) but "does this source follow practices that help it get things right despite its perspective?"',
                source: 'Media literacy',
                tags: ['bias', 'methodology', 'evaluation']
            },
            {
                id: 'lit_003',
                text: 'Checking who owns or funds a source isn\'t conspiracy thinking—it\'s basic due diligence. Ownership doesn\'t determine content, but it shapes incentives. Follow the money is just good epistemics.',
                source: 'Media analysis',
                tags: ['ownership', 'funding', 'incentives']
            },
            {
                id: 'lit_004',
                text: 'Screenshots prove almost nothing. They\'re trivially easy to fabricate. A screenshot of a "deleted tweet" is just an image file. Without archival verification, treat screenshots as claims, not evidence.',
                source: 'Digital literacy',
                tags: ['screenshots', 'verification', 'evidence']
            },
            {
                id: 'lit_005',
                text: 'The headline and the article often tell different stories. Headlines are written for clicks; articles are written for readers. Many viral "outrages" dissolve when you read past the headline.',
                source: 'News literacy',
                tags: ['headlines', 'reading', 'context']
            }
        ],

        // ==================== BIAS ====================
        // Teaching: Cognitive biases, mental shortcuts, self-awareness
        bias: [
            {
                id: 'bias_001',
                text: 'Knowing about biases doesn\'t make you immune to them. Studies show that learning about cognitive biases has almost no effect on actually being less biased. Awareness is necessary but not sufficient.',
                source: 'Cognitive psychology',
                tags: ['debiasing', 'limitations', 'humility']
            },
            {
                id: 'bias_002',
                text: 'Confirmation bias isn\'t about ignoring contrary evidence—it\'s about setting different evidence standards. We scrutinize what we disagree with and accept what confirms our views more easily.',
                source: 'Psychology research',
                tags: ['confirmation-bias', 'asymmetry', 'standards']
            },
            {
                id: 'bias_003',
                text: 'The "bias blind spot" means we see biases in others more easily than in ourselves. Ironically, the smarter you are, the better you may be at rationalizing your biased conclusions.',
                source: 'Social psychology',
                tags: ['blind-spot', 'intelligence', 'rationalization']
            },
            {
                id: 'bias_004',
                text: 'Hindsight bias makes the past feel inevitable. After something happens, we "knew it all along." This makes us overconfident about predicting the future and unfair to those who didn\'t foresee events.',
                source: 'Judgment research',
                tags: ['hindsight', 'inevitability', 'prediction']
            },
            {
                id: 'bias_005',
                text: 'The availability heuristic means vivid, recent, or emotional events feel more common than they are. Plane crashes feel riskier than car rides because crashes make news. Your fear isn\'t calibrated to reality.',
                source: 'Behavioral economics',
                tags: ['availability', 'risk', 'perception']
            }
        ],

        // ==================== DATA ====================
        // Teaching: Statistical literacy, data interpretation
        data: [
            {
                id: 'data_001',
                text: 'Correlation doesn\'t imply causation, but it doesn\'t rule it out either. The question is always: what else could explain this pattern? Dismissing correlations entirely is as foolish as accepting them uncritically.',
                source: 'Statistics',
                tags: ['correlation', 'causation', 'nuance']
            },
            {
                id: 'data_002',
                text: 'The mean can lie. If Jeff Bezos walks into a bar, the average wealth in the room skyrockets, but nobody got richer. Medians often tell truer stories about typical experiences.',
                source: 'Statistical literacy',
                tags: ['mean', 'median', 'distribution']
            },
            {
                id: 'data_003',
                text: 'A "statistically significant" finding might be trivially small. Significance means unlikely to be chance; it doesn\'t mean important. A huge study can find "significant" effects too tiny to matter.',
                source: 'Research methods',
                tags: ['significance', 'effect-size', 'interpretation']
            },
            {
                id: 'data_004',
                text: 'Base rates matter more than most people realize. A 99% accurate test still produces more false positives than true positives if the condition is rare enough. Always ask: how common is this in the first place?',
                source: 'Bayesian reasoning',
                tags: ['base-rate', 'probability', 'testing']
            },
            {
                id: 'data_005',
                text: 'Graphs can lie without containing false data. Truncated axes, cherry-picked time ranges, and misleading scales can make small differences look huge or big trends disappear. Always check the axes.',
                source: 'Data visualization',
                tags: ['graphs', 'manipulation', 'visual']
            }
        ],

        // ==================== VERIFY ====================
        // Teaching: Source verification, fact-checking methods
        verify: [
            {
                id: 'ver_001',
                text: 'The best fact-checkers don\'t just check claims—they check claimers. Before evaluating what someone says, they ask: who is this person? What\'s their track record? What are their incentives?',
                source: 'Fact-checking methodology',
                tags: ['sources', 'credibility', 'process']
            },
            {
                id: 'ver_002',
                text: 'Reverse image search is your friend. Many viral images are old photos repurposed for new contexts. A "breaking news" image might be years old. Always check when and where an image originated.',
                source: 'Digital verification',
                tags: ['images', 'reverse-search', 'context']
            },
            {
                id: 'ver_003',
                text: 'WHOIS lookups reveal who registered a domain and when. A website claiming to be a decades-old news source but registered last month is a red flag. Domain age doesn\'t prove legitimacy, but sudden appearance suggests caution.',
                source: 'Digital forensics',
                tags: ['domains', 'WHOIS', 'verification']
            },
            {
                id: 'ver_004',
                text: 'Check the "About" page, but don\'t trust it blindly. Then search for what others say about the organization. Wikipedia, media reports, and fact-checker databases often reveal what the "About" page omits.',
                source: 'Source evaluation',
                tags: ['about-pages', 'cross-reference', 'skepticism']
            },
            {
                id: 'ver_005',
                text: 'Beware of sources that only cite themselves or each other in closed loops. Real expertise connects to broader networks of knowledge. Isolated citation networks often indicate fringe or fabricated authority.',
                source: 'Information literacy',
                tags: ['citation', 'networks', 'isolation']
            }
        ]
    };

    // ==================== INTERNAL FUNCTIONS ====================

    function _getRandomActionFactoidInternal(action) {
        const factoids = ACTION_FACTOID_DATA[action.toLowerCase()];
        if (!factoids || factoids.length === 0) return null;
        const idx = Math.floor(Math.random() * factoids.length);
        return { ...factoids[idx], action: action.toLowerCase() };
    }

    function _getCurrentLanguage() {
        if (typeof Vinculum !== 'undefined' && Vinculum.getCurrentLanguage) {
            return Vinculum.getCurrentLanguage();
        }
        return localStorage.getItem('veritasLanguage') || 'en';
    }

    // ==================== PUBLIC API ====================

    /**
     * Get a random action factoid
     * PRIMARY: Calls /api/action-factoids for fresh content
     * FALLBACK: Uses static data if API unavailable
     * @param {string} action - One of: archives, research, ethics, fallacies, persuasion, literacy, bias, data, verify
     * @returns {Promise<Object|null>} ActionFactoid object or null
     */
    async function getRandomActionFactoid(action) {
        const lang = _getCurrentLanguage();
        
        // Try API first
        try {
            const response = await fetch('/api/action-factoids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: action,
                    language: lang 
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.factoid) {
                    return {
                        ...data.factoid,
                        action: action.toLowerCase(),
                        _source: 'api'
                    };
                }
            }
        } catch (err) {
            console.log('Action Factoids API unavailable, using fallback:', err.message);
        }
        
        // Fallback to static data
        const factoid = _getRandomActionFactoidInternal(action);
        if (!factoid) return null;
        
        return { ...factoid, _source: 'static' };
    }

    /**
     * Get all action names
     * @returns {Array} Array of action names
     */
    function getActions() {
        return Object.keys(ACTION_FACTOID_DATA);
    }

    /**
     * Synchronous English-only access
     */
    const sync = {
        getRandomActionFactoid: _getRandomActionFactoidInternal
    };

    return {
        getRandomActionFactoid,
        getActions,
        sync,
        ACTION_FACTOID_DATA
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeracityActionFactoids;
}
