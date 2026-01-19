/**
 * VERACITY v5.2 — FACTOIDS MODULE
 * =================================
 * Module: factoids.js
 * Version: 2.0.0
 * Last Modified: 2026-01-14
 * 
 * PURPOSE:
 * Provides educational factoids for discipline buttons in IDLE state.
 * Now API-powered: fresh, improvised, culturally-attuned factoids every time.
 * 
 * ARCHITECTURE:
 * PRIMARY: Calls /api/factoids-api for Claude-generated content
 * FALLBACK: Static FACTOID_DATA when API unavailable
 * 
 * Every click is a new improvisation - dinner party brilliance, not database lookup.
 * 
 * VINCULUM INTEGRATION:
 * API generates culturally-resonant content based on language.
 * Fallback uses client-side VINCULUM translation if available.
 * 
 * PHILOSOPHY:
 * "Not telling people what to think, but giving them frameworks to think with."
 * Each factoid plants seeds for critical thinking without being preachy.
 * 
 * DEPENDENCIES: /api/factoids-api (primary), vinculum.js (fallback)
 * DEPENDED ON BY: veracity.html, export.js
 * 
 * EXPORTS:
 * - getRandomFactoid(discipline) → Promise<Factoid> (API-first)
 * - getFactoidById(id) → Promise<Factoid> (static only)
 * - getAllFactoids(discipline) → Promise<Array<Factoid>> (static only)
 * - sync.getRandomFactoid(discipline) → Factoid (English only, static)
 * - FACTOID_DATA → Raw factoid database (fallback)
 * 
 * VERITAS LLC — Prairie du Sac, Wisconsin
 * 🖖 Infinite Diversity in Infinite Combinations
 */

const VeracityFactoids = (function() {
    'use strict';

    // ==================== FACTOID DATA STRUCTURE ====================
    // Each factoid has: id, discipline, text, source (optional), tags
    
    const FACTOID_DATA = {
        
        // ==================== HISTORY ====================
        history: [
            {
                id: 'hist_001',
                text: 'The Library of Alexandria wasn\'t destroyed in a single fire—it declined over centuries through funding cuts, civil wars, and shifting priorities. The myth of one catastrophic loss is itself a lesson in how history gets simplified.',
                source: 'Multiple historical accounts',
                tags: ['ancient', 'knowledge', 'myth', 'complexity']
            },
            {
                id: 'hist_002',
                text: 'The phrase "Let them eat cake" was never said by Marie Antoinette. It appears in Rousseau\'s Confessions, written when Marie was only 9 years old, attributed to "a great princess." Misattribution has a long history.',
                source: 'Rousseau, Confessions (1782)',
                tags: ['misattribution', 'french-revolution', 'quotes']
            },
            {
                id: 'hist_003',
                text: 'Medieval people knew the Earth was round. The "flat Earth" myth about the Middle Ages was largely invented in the 19th century. Even ancient Greeks calculated Earth\'s circumference with surprising accuracy.',
                source: 'Eratosthenes (c. 240 BCE)',
                tags: ['medieval', 'myth', 'science-history']
            },
            {
                id: 'hist_004',
                text: 'The Great Wall of China is not visible from space with the naked eye—but many highways are. This commonly repeated "fact" fails basic geometry: the Wall is narrow (15-30 feet) but thousands of miles long.',
                source: 'NASA',
                tags: ['china', 'myth', 'common-misconception']
            },
            {
                id: 'hist_005',
                text: 'The term "propaganda" wasn\'t originally negative. It comes from the Catholic Church\'s "Congregatio de Propaganda Fide" (1622), meaning "spreading the faith." Its modern connotation emerged after World War I.',
                source: 'Etymology',
                tags: ['propaganda', 'language', 'media-history']
            },
            {
                id: 'hist_006',
                text: 'Paul Revere never shouted "The British are coming!" Colonial Americans considered themselves British. He likely said "The Regulars are coming out!" Longfellow\'s 1861 poem rewrote history.',
                source: 'Paul Revere\'s own account',
                tags: ['american-revolution', 'myth', 'poetry']
            },
            {
                id: 'hist_007',
                text: 'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid. The pyramids were already 2,500 years old when she ruled Egypt.',
                source: 'Timeline analysis',
                tags: ['egypt', 'perspective', 'time']
            },
            {
                id: 'hist_008',
                text: 'The Emancipation Proclamation didn\'t immediately free all enslaved people—it only applied to Confederate states, not border states loyal to the Union. Full abolition required the 13th Amendment.',
                source: 'U.S. Constitutional history',
                tags: ['slavery', 'civil-war', 'nuance']
            },
            {
                id: 'hist_009',
                text: 'Vikings never wore horned helmets in battle. This image comes from 19th-century Romantic artists and Wagner\'s operas. Actual Viking helmets were practical rounded iron or leather.',
                source: 'Archaeological evidence',
                tags: ['vikings', 'myth', 'popular-culture']
            },
            {
                id: 'hist_010',
                text: 'The "Spanish Flu" of 1918 likely didn\'t originate in Spain. Spain was neutral in WWI and reported freely on the outbreak, while combatant nations censored news. The name stuck anyway.',
                source: 'Epidemiological research',
                tags: ['pandemic', 'naming', 'censorship']
            },
            {
                id: 'hist_011',
                text: 'Napoleon wasn\'t short. At 5\'7", he was average or above-average for his time. British propaganda exaggerated his height, and French inches were longer than English inches, causing confusion.',
                source: 'Historical records',
                tags: ['napoleon', 'propaganda', 'measurement']
            },
            {
                id: 'hist_012',
                text: 'The Declaration of Independence wasn\'t signed on July 4, 1776. It was adopted that day, but most delegates signed on August 2nd. Some didn\'t sign until later, and one signed in 1781.',
                source: 'Congressional records',
                tags: ['july-fourth', 'founding', 'dates']
            }
        ],

        // ==================== SCIENCES ====================
        sciences: [
            {
                id: 'sci_001',
                text: 'Scientific "theories" aren\'t guesses—they\'re well-tested explanations backed by extensive evidence. Evolution, gravity, and germ theory are all "just theories" in the same way electricity is "just a phenomenon."',
                source: 'Philosophy of science',
                tags: ['theory', 'terminology', 'common-misconception']
            },
            {
                id: 'sci_002',
                text: 'Humans have more than five senses. Beyond sight, hearing, taste, smell, and touch, we have proprioception (body position), equilibrioception (balance), thermoception (temperature), and more.',
                source: 'Neuroscience',
                tags: ['senses', 'biology', 'common-misconception']
            },
            {
                id: 'sci_003',
                text: 'Goldfish have memories lasting months, not seconds. This myth may persist because it makes us feel better about keeping them in small bowls. Studies show they can learn and remember complex tasks.',
                source: 'Fish cognition research',
                tags: ['animals', 'memory', 'myth']
            },
            {
                id: 'sci_004',
                text: 'You don\'t use only 10% of your brain. Brain scans show activity throughout the entire brain, even during sleep. This myth likely arose from misunderstood neuroscience in the early 20th century.',
                source: 'Neuroimaging studies',
                tags: ['brain', 'myth', 'neuroscience']
            },
            {
                id: 'sci_005',
                text: 'Correlation doesn\'t equal causation, but it often suggests a relationship worth investigating. The challenge is distinguishing direct causation from reverse causation, confounding variables, or coincidence.',
                source: 'Statistical methodology',
                tags: ['statistics', 'causation', 'methodology']
            },
            {
                id: 'sci_006',
                text: 'A scientific paper being "peer-reviewed" doesn\'t guarantee it\'s correct—it means other experts checked the methodology. Retracted papers, p-hacking, and replication failures still happen.',
                source: 'Philosophy of science',
                tags: ['peer-review', 'methodology', 'limitations']
            },
            {
                id: 'sci_007',
                text: 'The Coriolis effect doesn\'t determine which way your toilet flushes. The effect is real for large systems like hurricanes, but toilets and sinks are too small—their flow is determined by bowl shape and jets.',
                source: 'Physics',
                tags: ['coriolis', 'myth', 'physics']
            },
            {
                id: 'sci_008',
                text: 'Glass isn\'t a slow-flowing liquid. Old windows are thicker at the bottom because of how they were manufactured, not because glass "flowed" over time. Glass is an amorphous solid.',
                source: 'Materials science',
                tags: ['glass', 'myth', 'materials']
            },
            {
                id: 'sci_009',
                text: 'Lightning can and does strike the same place twice. Tall buildings like the Empire State Building get struck about 25 times per year. The saying makes for wisdom but poor physics.',
                source: 'Meteorology',
                tags: ['lightning', 'myth', 'weather']
            },
            {
                id: 'sci_010',
                text: 'Scientific consensus isn\'t about voting—it\'s about converging evidence. When 97% of climate scientists agree, it\'s because the data points the same direction, not because they took a poll.',
                source: 'Philosophy of science',
                tags: ['consensus', 'methodology', 'climate']
            },
            {
                id: 'sci_011',
                text: 'Antibiotics don\'t work against viruses. Using them for viral infections like colds or flu contributes to antibiotic resistance. Viruses and bacteria are fundamentally different types of pathogens.',
                source: 'Medical science',
                tags: ['antibiotics', 'viruses', 'medicine']
            },
            {
                id: 'sci_012',
                text: 'The placebo effect is real and measurable. Even when patients know they\'re taking a placebo, they often improve. This tells us something profound about the mind-body connection.',
                source: 'Clinical research',
                tags: ['placebo', 'psychology', 'medicine']
            }
        ],

        // ==================== PHILOSOPHY ====================
        philosophy: [
            {
                id: 'phil_001',
                text: 'Socrates wrote nothing. Everything we know about him comes from students like Plato, who may have put his own ideas in Socrates\' mouth. We can\'t always separate the teacher from the student.',
                source: 'Classical philosophy',
                tags: ['socrates', 'sources', 'attribution']
            },
            {
                id: 'phil_002',
                text: 'The "Ship of Theseus" paradox asks: If you replace every plank of a ship, is it the same ship? This ancient puzzle applies to cells in your body, national identity, and software updates.',
                source: 'Plutarch',
                tags: ['identity', 'paradox', 'thought-experiment']
            },
            {
                id: 'phil_003',
                text: 'Occam\'s Razor doesn\'t say the simplest explanation is true—it says you shouldn\'t multiply assumptions unnecessarily. Sometimes reality is complex, and the "simple" answer is wrong.',
                source: 'William of Ockham (14th c.)',
                tags: ['occams-razor', 'methodology', 'complexity']
            },
            {
                id: 'phil_004',
                text: 'The "No True Scotsman" fallacy occurs when someone protects a generalization by dismissing counterexamples as not "real" members of the group. It\'s a way of making claims unfalsifiable.',
                source: 'Antony Flew (1975)',
                tags: ['fallacy', 'logic', 'argumentation']
            },
            {
                id: 'phil_005',
                text: 'Nietzsche\'s "God is dead" wasn\'t a celebration—it was a warning. He worried that without shared meaning systems, society might descend into nihilism or be exploited by new ideologies.',
                source: 'The Gay Science (1882)',
                tags: ['nietzsche', 'misquote', 'context']
            },
            {
                id: 'phil_006',
                text: 'Machiavelli\'s "The Prince" may have been satire or a job application, not sincere advice. He was a republican who was tortured by the Medici, then wrote a book praising authoritarian rule to them.',
                source: 'Historical analysis',
                tags: ['machiavelli', 'interpretation', 'context']
            },
            {
                id: 'phil_007',
                text: 'The "Trolley Problem" isn\'t about finding the right answer—it\'s about revealing our moral intuitions and the tension between utilitarian outcomes and deontological rules.',
                source: 'Philippa Foot (1967)',
                tags: ['ethics', 'thought-experiment', 'trolley']
            },
            {
                id: 'phil_008',
                text: '"I think, therefore I am" was Descartes\' foundation for certainty: even if everything else is illusion, the fact that you\'re doubting proves something exists to do the doubting.',
                source: 'Meditations (1641)',
                tags: ['descartes', 'epistemology', 'certainty']
            },
            {
                id: 'phil_009',
                text: 'Plato\'s Cave Allegory describes prisoners who mistake shadows for reality. When freed, they\'re blinded by sunlight. It asks: How much of what we "know" are just shadows of deeper truth?',
                source: 'The Republic',
                tags: ['plato', 'allegory', 'knowledge']
            },
            {
                id: 'phil_010',
                text: 'The "Is-Ought Problem" notes you can\'t derive what should be from what is. Just because something is natural doesn\'t make it good; just because something is common doesn\'t make it right.',
                source: 'David Hume (1739)',
                tags: ['hume', 'ethics', 'naturalistic-fallacy']
            },
            {
                id: 'phil_011',
                text: 'Karl Popper argued that real science must be "falsifiable"—you must be able to specify what evidence would prove the theory wrong. Unfalsifiable claims aren\'t scientific, even if they\'re true.',
                source: 'The Logic of Scientific Discovery (1934)',
                tags: ['popper', 'falsifiability', 'science']
            },
            {
                id: 'phil_012',
                text: 'The Paradox of Tolerance: Unlimited tolerance leads to the disappearance of tolerance. A society that tolerates intolerance will eventually be overthrown by the intolerant.',
                source: 'Karl Popper (1945)',
                tags: ['tolerance', 'paradox', 'society']
            }
        ],

        // ==================== LOGIC ====================
        logic: [
            {
                id: 'log_001',
                text: 'The "Straw Man" fallacy misrepresents someone\'s argument to make it easier to attack. Always ask: Am I responding to what they actually said, or to a weaker version I\'ve constructed?',
                source: 'Informal logic',
                tags: ['fallacy', 'argumentation', 'representation']
            },
            {
                id: 'log_002',
                text: 'Ad hominem attacks the person instead of their argument. But note: Pointing out someone\'s expertise IS relevant. The fallacy is dismissing an argument solely because of who made it.',
                source: 'Informal logic',
                tags: ['fallacy', 'ad-hominem', 'nuance']
            },
            {
                id: 'log_003',
                text: 'Modus ponens: If A implies B, and A is true, then B is true. Modus tollens: If A implies B, and B is false, then A is false. These are the workhorses of logical reasoning.',
                source: 'Formal logic',
                tags: ['formal-logic', 'deduction', 'rules']
            },
            {
                id: 'log_004',
                text: 'The "Appeal to Authority" isn\'t always a fallacy. Citing genuine experts in their field of expertise is reasonable. It becomes fallacy when the authority is irrelevant or when expertise is treated as infallibility.',
                source: 'Informal logic',
                tags: ['fallacy', 'authority', 'nuance']
            },
            {
                id: 'log_005',
                text: 'The "Slippery Slope" isn\'t always a fallacy either. Some slopes genuinely are slippery—the question is whether each step in the chain actually follows, or if you\'re just imagining catastrophe.',
                source: 'Informal logic',
                tags: ['fallacy', 'slippery-slope', 'causation']
            },
            {
                id: 'log_006',
                text: 'Begging the question means assuming what you\'re trying to prove. "The Bible is true because it\'s God\'s word, and we know it\'s God\'s word because the Bible says so" is circular reasoning.',
                source: 'Informal logic',
                tags: ['fallacy', 'circular', 'reasoning']
            },
            {
                id: 'log_007',
                text: 'The "False Dilemma" presents only two options when more exist. "You\'re either with us or against us" ignores neutrality, partial agreement, or nuanced positions. Reality rarely offers only two choices.',
                source: 'Informal logic',
                tags: ['fallacy', 'dichotomy', 'options']
            },
            {
                id: 'log_008',
                text: 'The "Burden of Proof" typically rests with whoever makes a claim. You can\'t prove a negative ("Prove unicorns don\'t exist"), so the burden falls on those asserting something exists or is true.',
                source: 'Epistemology',
                tags: ['burden-of-proof', 'evidence', 'claims']
            },
            {
                id: 'log_009',
                text: 'The "Gambler\'s Fallacy" assumes past random events affect future ones. A coin doesn\'t know it landed heads five times—the sixth flip is still 50/50. Each event is independent.',
                source: 'Probability theory',
                tags: ['fallacy', 'probability', 'gambling']
            },
            {
                id: 'log_010',
                text: 'Confirmation bias isn\'t stupidity—it\'s a mental shortcut that served our ancestors well. The problem is when we never test it. Actively seeking disconfirming evidence is a learned skill.',
                source: 'Cognitive psychology',
                tags: ['bias', 'confirmation', 'psychology']
            },
            {
                id: 'log_011',
                text: '"Post hoc ergo propter hoc" (after this, therefore because of this) is the fallacy of assuming that because B followed A, A caused B. Roosters don\'t cause sunrise.',
                source: 'Informal logic',
                tags: ['fallacy', 'causation', 'sequence']
            },
            {
                id: 'log_012',
                text: 'Reductio ad absurdum proves a claim false by showing it leads to absurd conclusions. If assuming X leads to contradiction, X must be false. It\'s a powerful but often misused technique.',
                source: 'Formal logic',
                tags: ['proof', 'absurdity', 'method']
            }
        ],

        // ==================== RHETORIC ====================
        rhetoric: [
            {
                id: 'rhet_001',
                text: 'Aristotle identified three persuasive appeals: Ethos (credibility), Pathos (emotion), and Logos (logic). Most effective messages use all three. Notice which one dominates in any argument.',
                source: 'Rhetoric (4th c. BCE)',
                tags: ['aristotle', 'persuasion', 'appeals']
            },
            {
                id: 'rhet_002',
                text: 'Framing matters: "90% survival rate" and "10% mortality rate" are the same statistic, but feel different. How information is presented shapes how we process it.',
                source: 'Behavioral economics',
                tags: ['framing', 'psychology', 'presentation']
            },
            {
                id: 'rhet_003',
                text: 'Repetition breeds familiarity, and familiarity breeds credibility. This "illusory truth effect" means we tend to believe things we\'ve heard before, regardless of evidence.',
                source: 'Psychological research',
                tags: ['repetition', 'familiarity', 'credibility']
            },
            {
                id: 'rhet_004',
                text: 'The "Gish Gallop" floods opponents with many weak arguments rather than defending a few strong ones. It\'s exhausting to refute every point, which creates an illusion of winning.',
                source: 'Debate tactics',
                tags: ['gish-gallop', 'debate', 'tactics']
            },
            {
                id: 'rhet_005',
                text: 'Euphemisms and dysphemisms are rhetorical tools: "Enhanced interrogation" vs "torture," "freedom fighter" vs "terrorist." The words chosen reveal the speaker\'s framing before the argument even begins.',
                source: 'Linguistics',
                tags: ['language', 'framing', 'euphemism']
            },
            {
                id: 'rhet_006',
                text: 'Anecdotes aren\'t data, but they\'re powerful. A single story can override statistics because our brains evolved for narrative. This is why one identifiable victim moves us more than millions.',
                source: 'Cognitive psychology',
                tags: ['anecdote', 'narrative', 'psychology']
            },
            {
                id: 'rhet_007',
                text: 'The "Anchoring Effect" means the first number you hear influences your estimate. When negotiating, the first offer sets expectations—even if it\'s absurd. Awareness helps, but doesn\'t eliminate the effect.',
                source: 'Behavioral economics',
                tags: ['anchoring', 'bias', 'negotiation']
            },
            {
                id: 'rhet_008',
                text: 'Aristotle distinguished forensic rhetoric (about the past), deliberative rhetoric (about the future), and epideictic rhetoric (about the present, often praise or blame). Different contexts, different tools.',
                source: 'Rhetoric (4th c. BCE)',
                tags: ['aristotle', 'types', 'context']
            },
            {
                id: 'rhet_009',
                text: 'The "Bandwagon Effect" suggests popularity equals validity. But truth isn\'t democratic—millions of people can be wrong, and one person can be right. Consensus is evidence, not proof.',
                source: 'Social psychology',
                tags: ['bandwagon', 'popularity', 'consensus']
            },
            {
                id: 'rhet_010',
                text: 'Chiasmus creates memorable reversals: "Ask not what your country can do for you, but what you can do for your country." The mirror structure makes ideas stick in memory.',
                source: 'Rhetorical figures',
                tags: ['chiasmus', 'style', 'memory']
            },
            {
                id: 'rhet_011',
                text: 'The "mere exposure effect" means we prefer things we\'ve seen before, even if we don\'t remember seeing them. This is why advertisers prioritize frequency and why unfamiliar ideas face an uphill battle.',
                source: 'Robert Zajonc (1968)',
                tags: ['exposure', 'preference', 'advertising']
            },
            {
                id: 'rhet_012',
                text: '"Kairos" is the Greek concept of the right or opportune moment. Effective rhetoric isn\'t just about what you say, but when you say it. Timing can make or break a message.',
                source: 'Classical rhetoric',
                tags: ['kairos', 'timing', 'context']
            }
        ],

        // ==================== MEDIA ====================
        media: [
            {
                id: 'med_001',
                text: 'Headlines are written to generate clicks, not to accurately summarize content. The article often contradicts or qualifies the headline. Always read beyond the title.',
                source: 'Media literacy',
                tags: ['headlines', 'clickbait', 'reading']
            },
            {
                id: 'med_002',
                text: 'The inverted pyramid of journalism puts the most important information first. If an article buries the key facts in paragraph 12, ask why the structure was inverted.',
                source: 'Journalism practice',
                tags: ['structure', 'journalism', 'reading']
            },
            {
                id: 'med_003',
                text: 'News outlets selecting which stories to cover is itself a form of bias, even with accurate reporting. What\'s NOT covered can be as revealing as what is.',
                source: 'Media studies',
                tags: ['selection-bias', 'coverage', 'omission']
            },
            {
                id: 'med_004',
                text: 'The 24-hour news cycle prioritizes speed over accuracy. Breaking news is often wrong news. The most reliable version of a story usually emerges hours or days later.',
                source: 'Media analysis',
                tags: ['breaking-news', 'speed', 'accuracy']
            },
            {
                id: 'med_005',
                text: 'Social media algorithms optimize for engagement, not truth. Outrage, fear, and tribalism generate more interaction than nuance. The most shared content isn\'t the most accurate.',
                source: 'Platform studies',
                tags: ['algorithms', 'engagement', 'social-media']
            },
            {
                id: 'med_006',
                text: 'The decline of local journalism creates "news deserts" where residents lack coverage of local government, courts, and schools. National news can\'t fill this gap.',
                source: 'Journalism research',
                tags: ['local-news', 'decline', 'democracy']
            },
            {
                id: 'med_007',
                text: 'Anonymous sources can be legitimate (whistleblowers) or problematic (unaccountable claims). Ask: Does the outlet have a track record? Why does anonymity make sense here?',
                source: 'Journalism ethics',
                tags: ['sources', 'anonymous', 'verification']
            },
            {
                id: 'med_008',
                text: 'The "false balance" trap treats fringe views as equivalent to mainstream consensus. Giving a climate denier equal time with 97% of scientists isn\'t balance—it\'s distortion.',
                source: 'Media criticism',
                tags: ['balance', 'false-equivalence', 'consensus']
            },
            {
                id: 'med_009',
                text: 'Corrections and retractions matter. Outlets that issue them demonstrate accountability; outlets that never admit error should raise suspicion. Credibility requires acknowledging mistakes.',
                source: 'Media ethics',
                tags: ['corrections', 'accountability', 'trust']
            },
            {
                id: 'med_010',
                text: 'Photo and video can be deceptively edited. Images can be cropped, taken out of context, or digitally altered. Reverse image search and source verification are essential skills.',
                source: 'Visual literacy',
                tags: ['images', 'video', 'manipulation']
            },
            {
                id: 'med_011',
                text: 'Opinion sections are labeled for a reason. Columnists aren\'t reporters—they\'re paid to have viewpoints. The news/opinion distinction matters, but many readers miss it.',
                source: 'Media literacy',
                tags: ['opinion', 'news', 'distinction']
            },
            {
                id: 'med_012',
                text: 'Native advertising is designed to look like editorial content. When an "article" is actually an ad, disclosure is required but often buried. Follow the money.',
                source: 'Advertising standards',
                tags: ['native-ads', 'disclosure', 'advertising']
            }
        ],

        // ==================== PSYCHOLOGY ====================
        psychology: [
            {
                id: 'psych_001',
                text: 'The Dunning-Kruger effect shows that low-skilled individuals overestimate their abilities, while experts often underestimate theirs. Confidence isn\'t competence.',
                source: 'Kruger & Dunning (1999)',
                tags: ['dunning-kruger', 'confidence', 'expertise']
            },
            {
                id: 'psych_002',
                text: 'Cognitive dissonance is the discomfort of holding contradictory beliefs. We resolve it by changing beliefs, adding rationalizations, or discounting conflicting information—not by thinking clearly.',
                source: 'Festinger (1957)',
                tags: ['cognitive-dissonance', 'beliefs', 'rationalization']
            },
            {
                id: 'psych_003',
                text: 'The "backfire effect" suggests that corrections can strengthen false beliefs. This finding is more limited than initially thought, but tribal identity does make us resist information that threatens our group.',
                source: 'Political psychology',
                tags: ['backfire', 'correction', 'identity']
            },
            {
                id: 'psych_004',
                text: 'Fundamental Attribution Error: We attribute others\' behavior to their character but our own to circumstances. They\'re late because they\'re irresponsible; I\'m late because of traffic.',
                source: 'Social psychology',
                tags: ['attribution', 'bias', 'others']
            },
            {
                id: 'psych_005',
                text: 'Motivated reasoning means we use our intelligence to defend beliefs we already hold, not to find truth. Smarter people can be better at rationalization, not just analysis.',
                source: 'Cognitive psychology',
                tags: ['motivated-reasoning', 'intelligence', 'rationalization']
            },
            {
                id: 'psych_006',
                text: 'The "halo effect" means one positive trait colors our perception of everything else. Attractive people are assumed to be smarter; articulate speakers are assumed to be honest.',
                source: 'Thorndike (1920)',
                tags: ['halo-effect', 'perception', 'bias']
            },
            {
                id: 'psych_007',
                text: 'Availability heuristic: We judge likelihood by how easily examples come to mind. Plane crashes are memorable; car accidents are mundane. Our fear doesn\'t match actual risk.',
                source: 'Tversky & Kahneman',
                tags: ['availability', 'heuristic', 'risk']
            },
            {
                id: 'psych_008',
                text: 'In-group bias: We favor people we perceive as "like us" and are more skeptical of outsiders. This can be triggered by something as trivial as shared preferences or random assignment.',
                source: 'Social identity theory',
                tags: ['in-group', 'tribalism', 'identity']
            },
            {
                id: 'psych_009',
                text: 'The "Spotlight Effect" makes us overestimate how much others notice our appearance and behavior. You\'re not as visible as you feel. Others are busy with their own spotlight effect.',
                source: 'Gilovich & Savitsky (1999)',
                tags: ['spotlight', 'self-consciousness', 'perception']
            },
            {
                id: 'psych_010',
                text: 'Sunk cost fallacy: We continue investing in failures because of what we\'ve already invested. But past costs are irrelevant to future decisions—only future costs and benefits matter.',
                source: 'Behavioral economics',
                tags: ['sunk-cost', 'decision-making', 'fallacy']
            },
            {
                id: 'psych_011',
                text: 'Social proof: We look to others\' behavior to determine our own. Laugh tracks, testimonials, and "most popular" labels all exploit this tendency.',
                source: 'Cialdini (1984)',
                tags: ['social-proof', 'conformity', 'influence']
            },
            {
                id: 'psych_012',
                text: 'The "identifiable victim effect" means we donate more to help one named child than to save thousands of statistical victims. Our compassion scales poorly with numbers.',
                source: 'Small & Loewenstein',
                tags: ['identifiable-victim', 'compassion', 'numbers']
            }
        ],

        // ==================== STATISTICS ====================
        statistics: [
            {
                id: 'stat_001',
                text: 'Averages can mislead. If Bill Gates walks into a bar, the average net worth skyrockets, but nobody in the bar got richer. Median often tells a more accurate story.',
                source: 'Statistics basics',
                tags: ['average', 'median', 'distribution']
            },
            {
                id: 'stat_002',
                text: 'Sample size matters. A survey of 50 people tells you less than one of 5,000. But even huge samples can be biased if they\'re not representative. Quality beats quantity.',
                source: 'Statistical methodology',
                tags: ['sample-size', 'representation', 'methodology']
            },
            {
                id: 'stat_003',
                text: 'A "statistically significant" result doesn\'t mean "important." With large enough samples, tiny effects become significant. Effect size tells you whether the finding matters.',
                source: 'Statistical interpretation',
                tags: ['significance', 'effect-size', 'interpretation']
            },
            {
                id: 'stat_004',
                text: 'Percentages can be manipulated by changing the base. A 100% increase from 1 is just 2. "Crime doubled!" might mean going from 2 incidents to 4.',
                source: 'Statistical literacy',
                tags: ['percentages', 'base-rate', 'manipulation']
            },
            {
                id: 'stat_005',
                text: 'Survivorship bias: We see winners and forget losers. "All successful people wake up at 5am" ignores the many 5am risers who failed. The graveyard has no spokespeople.',
                source: 'Statistical reasoning',
                tags: ['survivorship-bias', 'success', 'selection']
            },
            {
                id: 'stat_006',
                text: 'Cherry-picking data means selecting evidence that supports your conclusion while ignoring contradicting evidence. Look for systematic reviews that analyze ALL relevant studies.',
                source: 'Research methods',
                tags: ['cherry-picking', 'selection-bias', 'evidence']
            },
            {
                id: 'stat_007',
                text: 'Regression to the mean: Extreme performances tend to be followed by more average ones. A sports "sophomore slump" or stock "correction" might just be normal variation.',
                source: 'Statistical concepts',
                tags: ['regression-to-mean', 'variation', 'performance']
            },
            {
                id: 'stat_008',
                text: 'A 95% confidence interval doesn\'t mean there\'s a 95% chance the true value is within it. It means that if we repeated the study infinitely, 95% of intervals would contain the true value.',
                source: 'Frequentist statistics',
                tags: ['confidence-interval', 'interpretation', 'probability']
            },
            {
                id: 'stat_009',
                text: 'Confounding variables can make two things appear related when they\'re both caused by something else. Ice cream sales and drowning rates correlate—both increase in summer.',
                source: 'Statistical methodology',
                tags: ['confounding', 'correlation', 'causation']
            },
            {
                id: 'stat_010',
                text: 'P-hacking is testing many comparisons until something looks significant by chance. With 20 tests at p<0.05, you expect one "significant" result randomly. Pre-registration prevents this.',
                source: 'Research methodology',
                tags: ['p-hacking', 'significance', 'methodology']
            },
            {
                id: 'stat_011',
                text: 'Absolute risk vs. relative risk: "50% increased risk" sounds scary, but if the baseline risk was 2%, it\'s now 3%—an absolute increase of 1 percentage point.',
                source: 'Medical statistics',
                tags: ['absolute-risk', 'relative-risk', 'interpretation']
            },
            {
                id: 'stat_012',
                text: 'The law of large numbers means that with more data, averages converge on true values. But any single data point can still be wildly off. Don\'t mistake one case for a trend.',
                source: 'Probability theory',
                tags: ['large-numbers', 'convergence', 'sample']
            }
        ],

        // ==================== SOURCES ====================
        sources: [
            {
                id: 'src_001',
                text: 'Primary sources are original documents: court records, scientific data, firsthand accounts. Secondary sources analyze or interpret primary sources. Know which you\'re reading.',
                source: 'Research methods',
                tags: ['primary', 'secondary', 'types']
            },
            {
                id: 'src_002',
                text: 'Wikipedia is a starting point, not an ending point. Its value is in the references at the bottom—follow them to primary sources. The article itself is secondary.',
                source: 'Research methods',
                tags: ['wikipedia', 'references', 'starting-point']
            },
            {
                id: 'src_003',
                text: 'The CRAAP test evaluates sources: Currency (when), Relevance (why), Authority (who), Accuracy (evidence), and Purpose (why written). Apply it systematically.',
                source: 'Information literacy',
                tags: ['craap', 'evaluation', 'methodology']
            },
            {
                id: 'src_004',
                text: 'Preprint servers (arXiv, medRxiv) publish research before peer review. They enable faster science but require more skepticism. Check if the paper was ever published in a journal.',
                source: 'Academic publishing',
                tags: ['preprints', 'peer-review', 'verification']
            },
            {
                id: 'src_005',
                text: 'Funding sources matter. Studies funded by interested parties aren\'t automatically wrong, but conflicts of interest should be disclosed and considered.',
                source: 'Research ethics',
                tags: ['funding', 'conflicts', 'disclosure']
            },
            {
                id: 'src_006',
                text: 'Retraction Watch tracks withdrawn papers. A retracted study should no longer be cited as evidence, but retractions don\'t always reach the people who read the original.',
                source: 'Academic integrity',
                tags: ['retraction', 'accountability', 'tracking']
            },
            {
                id: 'src_007',
                text: 'Lateral reading means leaving a site to verify it. Instead of reading deeply, fact-checkers quickly search for what others say about the source. It\'s faster and more effective.',
                source: 'Stanford History Education Group',
                tags: ['lateral-reading', 'verification', 'method']
            },
            {
                id: 'src_008',
                text: 'Domain endings (.edu, .gov, .org) don\'t guarantee credibility. Anyone can get a .org domain. A prestigious .edu page might be a student project. Evaluate the actual content.',
                source: 'Digital literacy',
                tags: ['domains', 'credibility', 'evaluation']
            },
            {
                id: 'src_009',
                text: 'Archive.org\'s Wayback Machine can show you what a website said in the past. Useful for catching edits, deleted content, or verifying what was originally published.',
                source: 'Digital tools',
                tags: ['archive', 'wayback', 'verification']
            },
            {
                id: 'src_010',
                text: 'Check the "About" page. Who runs this site? Who funds it? What\'s their mission? Legitimate sources are transparent about their ownership and purpose.',
                source: 'Source evaluation',
                tags: ['about-page', 'transparency', 'ownership']
            },
            {
                id: 'src_011',
                text: 'Fact-checkers themselves should be evaluated. Do they show their work? Do they cover multiple perspectives? Do they correct their own mistakes? Transparency is key.',
                source: 'Media literacy',
                tags: ['fact-checkers', 'evaluation', 'transparency']
            },
            {
                id: 'src_012',
                text: 'Outdated sources aren\'t always wrong, but they may be incomplete. Science advances; laws change; statistics expire. Check the publication date and whether newer information exists.',
                source: 'Research methods',
                tags: ['currency', 'dates', 'updates']
            }
        ]
    };

    // ==================== INTERNAL FUNCTIONS (English only) ====================

    /**
     * Get a random factoid from a specific discipline (internal, English)
     * @param {string} discipline - Discipline name
     * @returns {Object|null} Factoid object or null
     */
    function _getRandomFactoidInternal(discipline) {
        const factoids = FACTOID_DATA[discipline.toLowerCase()];
        if (!factoids || factoids.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * factoids.length);
        return {
            ...factoids[randomIndex],
            discipline: discipline.toLowerCase()
        };
    }

    /**
     * Get a specific factoid by ID (internal, English)
     * @param {string} id - Factoid ID
     * @returns {Object|null} Factoid object or null
     */
    function _getFactoidByIdInternal(id) {
        for (const [discipline, factoids] of Object.entries(FACTOID_DATA)) {
            const found = factoids.find(f => f.id === id);
            if (found) {
                return { ...found, discipline };
            }
        }
        return null;
    }

    /**
     * Get all factoids for a discipline (internal, English)
     * @param {string} discipline - Discipline name
     * @returns {Array} Array of factoid objects
     */
    function _getAllFactoidsInternal(discipline) {
        const factoids = FACTOID_DATA[discipline.toLowerCase()];
        if (!factoids) return [];
        return factoids.map(f => ({ ...f, discipline: discipline.toLowerCase() }));
    }

    // ==================== PUBLIC API (with VINCULUM translation) ====================

    /**
     * Get current language from VINCULUM or localStorage
     * @returns {string} Language code (e.g., 'en', 'es', 'ja')
     */
    function _getCurrentLanguage() {
        if (typeof Vinculum !== 'undefined' && Vinculum.getCurrentLanguage) {
            return Vinculum.getCurrentLanguage();
        }
        return localStorage.getItem('veritasLanguage') || 'en';
    }

    /**
     * Get a random factoid from a specific discipline
     * PRIMARY: Calls /api/factoids-api for fresh, improvised content
     * FALLBACK: Uses static FACTOID_DATA if API unavailable
     * @param {string} discipline - One of: history, sciences, philosophy, logic, rhetoric, media, psychology, statistics, sources
     * @returns {Promise<Object|null>} Factoid object or null if discipline not found
     */
    async function getRandomFactoid(discipline) {
        const lang = _getCurrentLanguage();
        
        // Try API first for fresh, improvised content
        try {
            const response = await fetch('/api/factoids-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    discipline: discipline,
                    language: lang 
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.factoid) {
                    return {
                        ...data.factoid,
                        discipline: discipline.toLowerCase(),
                        _source: 'api'
                    };
                }
            }
        } catch (err) {
            console.log('Factoids API unavailable, using fallback:', err.message);
        }
        
        // Fallback to static data
        const factoid = _getRandomFactoidInternal(discipline);
        if (!factoid) return null;
        
        // Apply VINCULUM translation for fallback if available
        if (typeof Vinculum !== 'undefined' && lang !== 'en') {
            return Vinculum.translateFactoid(factoid, lang);
        }
        
        return { ...factoid, _source: 'static' };
    }

    /**
     * Get a specific factoid by ID
     * Returns translated factoid if non-English language selected
     * @param {string} id - Factoid ID (e.g., 'hist_001')
     * @returns {Promise<Object|null>} Factoid object or null if not found
     */
    async function getFactoidById(id) {
        const factoid = _getFactoidByIdInternal(id);
        if (!factoid) return null;
        
        if (typeof Vinculum !== 'undefined') {
            const lang = Vinculum.getCurrentLanguage();
            if (lang !== 'en') {
                return Vinculum.translateFactoid(factoid, lang);
            }
        }
        return factoid;
    }

    /**
     * Get all factoids for a discipline
     * Returns translated factoids if non-English language selected
     * @param {string} discipline - Discipline name
     * @returns {Promise<Array>} Array of factoid objects
     */
    async function getAllFactoids(discipline) {
        const factoids = _getAllFactoidsInternal(discipline);
        if (factoids.length === 0) return [];
        
        if (typeof Vinculum !== 'undefined') {
            const lang = Vinculum.getCurrentLanguage();
            if (lang !== 'en') {
                // Translate all factoids in parallel
                return Promise.all(factoids.map(f => Vinculum.translateFactoid(f, lang)));
            }
        }
        return factoids;
    }

    /**
     * Get all discipline names
     * @returns {Array} Array of discipline names
     */
    function getDisciplines() {
        return Object.keys(FACTOID_DATA);
    }

    /**
     * Get total factoid count
     * @returns {number} Total number of factoids across all disciplines
     */
    function getTotalCount() {
        return Object.values(FACTOID_DATA).reduce((sum, arr) => sum + arr.length, 0);
    }

    /**
     * Search factoids by tag
     * Returns translated factoids if non-English language selected
     * @param {string} tag - Tag to search for
     * @returns {Promise<Array>} Array of matching factoids
     */
    async function searchByTag(tag) {
        const results = [];
        for (const [discipline, factoids] of Object.entries(FACTOID_DATA)) {
            for (const factoid of factoids) {
                if (factoid.tags.includes(tag.toLowerCase())) {
                    results.push({ ...factoid, discipline });
                }
            }
        }
        
        if (results.length === 0) return [];
        
        if (typeof Vinculum !== 'undefined') {
            const lang = Vinculum.getCurrentLanguage();
            if (lang !== 'en') {
                return Promise.all(results.map(f => Vinculum.translateFactoid(f, lang)));
            }
        }
        return results;
    }

    /**
     * Synchronous English-only access (for backward compatibility or performance)
     * Use these when you specifically need English or can't use async
     */
    const sync = {
        getRandomFactoid: _getRandomFactoidInternal,
        getFactoidById: _getFactoidByIdInternal,
        getAllFactoids: _getAllFactoidsInternal
    };

    return {
        getRandomFactoid,
        getFactoidById,
        getAllFactoids,
        getDisciplines,
        getTotalCount,
        searchByTag,
        sync,  // Synchronous English-only access
        FACTOID_DATA
    };

})();

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeracityFactoids;
}
