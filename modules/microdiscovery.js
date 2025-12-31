/**
 * VERACITY v5.0 — MICRO-DISCOVERY MODULE
 * ========================================
 * Module: microdiscovery.js
 * Version: 1.0.0
 * Last Modified: 2025-12-30
 * 
 * PURPOSE:
 * Powers the number column on the left sidebar—transforming decorative LCARS
 * numbers into "little portals of curiosity." Each number has substance;
 * playful but never trivial.
 * 
 * BEHAVIOR:
 * - Numbers randomize on load (or every 30 seconds)
 * - Hover reveals tooltip with context
 * - Numbers are discipline-appropriate (years for history, atomic numbers for science, etc.)
 * 
 * PHILOSOPHY:
 * "Every number has a story. Every story teaches without lecturing."
 * 
 * DEPENDENCIES: None (data module)
 * DEPENDED ON BY: main.html
 * 
 * CHANGE IMPACT: LOW — Data only, no logic dependencies
 * 
 * EXPORTS:
 * - getRandomEntry(discipline) → MicroDiscoveryEntry
 * - getEntryByValue(discipline, value) → MicroDiscoveryEntry
 * - getAllEntries(discipline) → Array of entries
 * - MICRO_DATA → Raw data database
 * 
 * ⚠️ IMMUTABLE until change protocol executed
 */

const VeracityMicroDiscovery = (function() {
    'use strict';

    // ==================== DATA STRUCTURE ====================
    // Each entry has: displayValue, tooltip, category
    // Categories: year, atomic, constant, percentage, count, duration
    
    const MICRO_DATA = {
        
        // ==================== HISTORY ====================
        // Primary: Important years in history of knowledge, communication, and epistemology
        history: [
            { displayValue: '1215', tooltip: 'Magna Carta signed — early foundation of rule of law', category: 'year' },
            { displayValue: '1440', tooltip: 'Gutenberg\'s printing press — information revolution begins', category: 'year' },
            { displayValue: '1517', tooltip: 'Luther\'s 95 Theses — printed pamphlets change Europe', category: 'year' },
            { displayValue: '1620', tooltip: 'Bacon\'s Novum Organum — birth of scientific method', category: 'year' },
            { displayValue: '1633', tooltip: 'Galileo forced to recant — science vs. authority', category: 'year' },
            { displayValue: '1644', tooltip: 'Milton\'s Areopagitica — early argument for press freedom', category: 'year' },
            { displayValue: '1690', tooltip: 'Locke\'s Essay Concerning Human Understanding', category: 'year' },
            { displayValue: '1751', tooltip: 'Diderot\'s Encyclopédie begins — democratizing knowledge', category: 'year' },
            { displayValue: '1776', tooltip: 'Declaration of Independence — Enlightenment ideals codified', category: 'year' },
            { displayValue: '1791', tooltip: 'First Amendment ratified — press freedom protected', category: 'year' },
            { displayValue: '1835', tooltip: 'Great Moon Hoax — early mass media disinformation', category: 'year' },
            { displayValue: '1844', tooltip: '"What hath God wrought" — first telegraph message', category: 'year' },
            { displayValue: '1859', tooltip: 'Darwin\'s Origin of Species — evidence reshapes worldview', category: 'year' },
            { displayValue: '1896', tooltip: 'Yellow journalism helps trigger Spanish-American War', category: 'year' },
            { displayValue: '1923', tooltip: 'Bernays\' Crystallizing Public Opinion — PR is born', category: 'year' },
            { displayValue: '1938', tooltip: 'War of the Worlds broadcast — media panic studied', category: 'year' },
            { displayValue: '1947', tooltip: 'Hutchins Commission — social responsibility of press', category: 'year' },
            { displayValue: '1964', tooltip: 'McLuhan\'s "the medium is the message"', category: 'year' },
            { displayValue: '1971', tooltip: 'Pentagon Papers — press vs. government secrecy', category: 'year' },
            { displayValue: '1996', tooltip: 'Fox News launches — cable news fragmentation begins', category: 'year' },
            { displayValue: '2004', tooltip: 'Facebook launches — social media era begins', category: 'year' },
            { displayValue: '2006', tooltip: 'Twitter launches — real-time information chaos', category: 'year' },
            { displayValue: '2016', tooltip: '"Post-truth" named word of the year', category: 'year' }
        ],

        // ==================== SCIENCES ====================
        // Primary: Atomic numbers, scientific constants, key measurements
        sciences: [
            { displayValue: '1', tooltip: 'Hydrogen — most abundant element in universe', category: 'atomic' },
            { displayValue: '6', tooltip: 'Carbon — basis of organic chemistry', category: 'atomic' },
            { displayValue: '8', tooltip: 'Oxygen — essential for respiration', category: 'atomic' },
            { displayValue: '14', tooltip: 'Silicon — basis of computer chips', category: 'atomic' },
            { displayValue: '26', tooltip: 'Iron — core of our planet, hemoglobin', category: 'atomic' },
            { displayValue: '47', tooltip: 'Silver — highest electrical conductivity', category: 'atomic' },
            { displayValue: '79', tooltip: 'Gold — symbol of value throughout history', category: 'atomic' },
            { displayValue: '82', tooltip: 'Lead — once everywhere, now known neurotoxin', category: 'atomic' },
            { displayValue: '92', tooltip: 'Uranium — nuclear energy and weapons', category: 'atomic' },
            { displayValue: '118', tooltip: 'Oganesson — current end of periodic table', category: 'atomic' },
            { displayValue: '299,792', tooltip: 'Speed of light in km/s — universal speed limit', category: 'constant' },
            { displayValue: '6e23', tooltip: 'Avogadro\'s number (6.022×10²³) — atoms in a mole', category: 'constant' },
            { displayValue: '3.14159', tooltip: 'Pi — ratio of circumference to diameter', category: 'constant' },
            { displayValue: '2.718', tooltip: 'Euler\'s number — natural logarithm base', category: 'constant' },
            { displayValue: '9.8', tooltip: 'Gravitational acceleration m/s² on Earth', category: 'constant' },
            { displayValue: '1.618', tooltip: 'Golden ratio — appears throughout nature', category: 'constant' },
            { displayValue: '0°', tooltip: 'Absolute zero in Celsius: -273.15°C', category: 'constant' },
            { displayValue: '13.8B', tooltip: 'Age of universe in years', category: 'count' },
            { displayValue: '4.5B', tooltip: 'Age of Earth in years', category: 'count' },
            { displayValue: '86,400', tooltip: 'Seconds in a day', category: 'count' },
            { displayValue: '37.2T', tooltip: 'Estimated cells in human body', category: 'count' },
            { displayValue: '100B', tooltip: 'Neurons in human brain', category: 'count' }
        ],

        // ==================== PHILOSOPHY ====================
        // Primary: Years of major philosophical works and events
        philosophy: [
            { displayValue: '399', tooltip: 'Socrates executed — questions cost him his life', category: 'year' },
            { displayValue: '387', tooltip: 'Plato founds the Academy — first university', category: 'year' },
            { displayValue: '335', tooltip: 'Aristotle founds the Lyceum — empiricism begins', category: 'year' },
            { displayValue: '300', tooltip: 'Euclid\'s Elements — model of logical proof', category: 'year' },
            { displayValue: '50', tooltip: 'Seneca writing — Stoic philosophy spreads', category: 'year' },
            { displayValue: '1265', tooltip: 'Aquinas\' Summa — faith and reason reconciled', category: 'year' },
            { displayValue: '1513', tooltip: 'Machiavelli\'s The Prince — realpolitik', category: 'year' },
            { displayValue: '1641', tooltip: 'Descartes\' Meditations — "I think therefore I am"', category: 'year' },
            { displayValue: '1651', tooltip: 'Hobbes\' Leviathan — social contract theory', category: 'year' },
            { displayValue: '1689', tooltip: 'Locke\'s Two Treatises — natural rights', category: 'year' },
            { displayValue: '1739', tooltip: 'Hume\'s Treatise — is-ought problem', category: 'year' },
            { displayValue: '1781', tooltip: 'Kant\'s Critique of Pure Reason', category: 'year' },
            { displayValue: '1843', tooltip: 'Mill\'s System of Logic — inductive reasoning', category: 'year' },
            { displayValue: '1859', tooltip: 'Mill\'s On Liberty — harm principle', category: 'year' },
            { displayValue: '1882', tooltip: 'Nietzsche\'s Gay Science — "God is dead"', category: 'year' },
            { displayValue: '1903', tooltip: 'Russell\'s paradox — foundations of logic shake', category: 'year' },
            { displayValue: '1921', tooltip: 'Wittgenstein\'s Tractatus — limits of language', category: 'year' },
            { displayValue: '1934', tooltip: 'Popper\'s falsifiability criterion', category: 'year' },
            { displayValue: '1945', tooltip: 'Popper\'s Open Society — defense of democracy', category: 'year' },
            { displayValue: '1962', tooltip: 'Kuhn\'s Structure of Scientific Revolutions', category: 'year' },
            { displayValue: '1971', tooltip: 'Rawls\' Theory of Justice — veil of ignorance', category: 'year' }
        ],

        // ==================== LOGIC ====================
        // Primary: Years of logical developments, plus key logical constants
        logic: [
            { displayValue: '350', tooltip: 'Aristotle\'s Organon — formal logic created', category: 'year' },
            { displayValue: '1847', tooltip: 'Boole\'s Mathematical Analysis of Logic', category: 'year' },
            { displayValue: '1854', tooltip: 'Boole\'s Laws of Thought — Boolean algebra', category: 'year' },
            { displayValue: '1879', tooltip: 'Frege\'s Begriffsschrift — predicate logic', category: 'year' },
            { displayValue: '1900', tooltip: 'Hilbert\'s 23 problems — agenda for mathematics', category: 'year' },
            { displayValue: '1910', tooltip: 'Russell & Whitehead\'s Principia Mathematica', category: 'year' },
            { displayValue: '1931', tooltip: 'Gödel\'s incompleteness theorems — limits of proof', category: 'year' },
            { displayValue: '1936', tooltip: 'Turing\'s computability — foundations of CS', category: 'year' },
            { displayValue: '1937', tooltip: 'Shannon\'s Boolean circuits — digital logic', category: 'year' },
            { displayValue: '1943', tooltip: 'McCulloch-Pitts neural model — AI beginnings', category: 'year' },
            { displayValue: '1950', tooltip: 'Turing test proposed — machine intelligence', category: 'year' },
            { displayValue: '1958', tooltip: 'LISP created — logic programming', category: 'year' },
            { displayValue: '2', tooltip: 'Binary — the language of computers: 0 and 1', category: 'constant' },
            { displayValue: '3', tooltip: 'Aristotle\'s three laws: identity, non-contradiction, excluded middle', category: 'constant' },
            { displayValue: '15', tooltip: 'Common informal fallacies identified', category: 'count' },
            { displayValue: '0', tooltip: 'False in Boolean logic', category: 'constant' },
            { displayValue: '1', tooltip: 'True in Boolean logic', category: 'constant' },
            { displayValue: '∞', tooltip: 'Infinity — concept that broke naive set theory', category: 'constant' },
            { displayValue: '256', tooltip: '2⁸ — values in a byte', category: 'count' }
        ],

        // ==================== RHETORIC ====================
        // Primary: Years of rhetorical developments and key speeches
        rhetoric: [
            { displayValue: '465', tooltip: 'Corax of Syracuse — earliest rhetoric treatise', category: 'year' },
            { displayValue: '436', tooltip: 'Gorgias arrives in Athens — Sophist rhetoric', category: 'year' },
            { displayValue: '350', tooltip: 'Aristotle\'s Rhetoric — ethos, pathos, logos', category: 'year' },
            { displayValue: '55', tooltip: 'Cicero\'s De Oratore — Roman rhetorical tradition', category: 'year' },
            { displayValue: '95', tooltip: 'Quintilian\'s Institutio Oratoria', category: 'year' },
            { displayValue: '1776', tooltip: 'Paine\'s Common Sense — pamphlets sway revolution', category: 'year' },
            { displayValue: '1863', tooltip: 'Gettysburg Address — 272 words reshape nation', category: 'year' },
            { displayValue: '1895', tooltip: 'LeBon\'s The Crowd — mass psychology', category: 'year' },
            { displayValue: '1928', tooltip: 'Bernays\' Propaganda — manufacturing consent', category: 'year' },
            { displayValue: '1936', tooltip: 'IPA identifies 7 propaganda techniques', category: 'year' },
            { displayValue: '1960', tooltip: 'Kennedy-Nixon debate — TV changes politics', category: 'year' },
            { displayValue: '1963', tooltip: '"I Have a Dream" — anaphora in action', category: 'year' },
            { displayValue: '3', tooltip: 'Aristotle\'s appeals: ethos, pathos, logos', category: 'count' },
            { displayValue: '5', tooltip: 'Canons of rhetoric: invention, arrangement, style, memory, delivery', category: 'count' },
            { displayValue: '7', tooltip: 'Classic propaganda techniques (IPA list)', category: 'count' },
            { displayValue: '272', tooltip: 'Words in Gettysburg Address', category: 'count' },
            { displayValue: '17', tooltip: 'Minutes of "I Have a Dream" speech', category: 'duration' },
            { displayValue: '40M', tooltip: 'Americans who heard FDR\'s fireside chats', category: 'count' }
        ],

        // ==================== MEDIA ====================
        // Primary: Years in media history, plus media statistics
        media: [
            { displayValue: '1605', tooltip: 'First regular newspaper — Relation (Strasbourg)', category: 'year' },
            { displayValue: '1690', tooltip: 'Publick Occurrences — first American newspaper', category: 'year' },
            { displayValue: '1833', tooltip: 'Penny press begins — news for the masses', category: 'year' },
            { displayValue: '1844', tooltip: 'First telegraph — news travels instantly', category: 'year' },
            { displayValue: '1848', tooltip: 'Associated Press founded — wire services begin', category: 'year' },
            { displayValue: '1896', tooltip: 'Marconi patents radio — wireless era begins', category: 'year' },
            { displayValue: '1920', tooltip: 'KDKA — first commercial radio broadcast', category: 'year' },
            { displayValue: '1927', tooltip: 'Philo Farnsworth demonstrates television', category: 'year' },
            { displayValue: '1941', tooltip: 'First TV news broadcast (CBS)', category: 'year' },
            { displayValue: '1948', tooltip: 'TV at 1 million US households', category: 'year' },
            { displayValue: '1968', tooltip: 'Cronkite on Vietnam — "living room war"', category: 'year' },
            { displayValue: '1980', tooltip: 'CNN launches — 24-hour news begins', category: 'year' },
            { displayValue: '1991', tooltip: 'World Wide Web goes public', category: 'year' },
            { displayValue: '1998', tooltip: 'Google founded — search changes everything', category: 'year' },
            { displayValue: '2005', tooltip: 'YouTube launches — user-generated video', category: 'year' },
            { displayValue: '2007', tooltip: 'iPhone — news in your pocket', category: 'year' },
            { displayValue: '2023', tooltip: 'ChatGPT reaches 100M users in 2 months', category: 'year' },
            { displayValue: '64%', tooltip: 'Americans who get news from social media', category: 'percentage' },
            { displayValue: '42%', tooltip: 'Trust in media at historic low (Gallup)', category: 'percentage' },
            { displayValue: '2,500', tooltip: 'US newspapers closed since 2005', category: 'count' },
            { displayValue: '8.5', tooltip: 'Average seconds spent on news article', category: 'duration' }
        ],

        // ==================== PSYCHOLOGY ====================
        // Primary: Years of major psychological discoveries, plus key statistics
        psychology: [
            { displayValue: '1879', tooltip: 'Wundt\'s lab — psychology becomes science', category: 'year' },
            { displayValue: '1890', tooltip: 'William James\' Principles of Psychology', category: 'year' },
            { displayValue: '1905', tooltip: 'Binet-Simon intelligence test', category: 'year' },
            { displayValue: '1920', tooltip: 'Watson\'s "Little Albert" — conditioned fear', category: 'year' },
            { displayValue: '1943', tooltip: 'Maslow\'s hierarchy of needs', category: 'year' },
            { displayValue: '1951', tooltip: 'Asch conformity experiments', category: 'year' },
            { displayValue: '1956', tooltip: 'Miller\'s "magical number seven"', category: 'year' },
            { displayValue: '1961', tooltip: 'Milgram obedience experiments', category: 'year' },
            { displayValue: '1963', tooltip: 'Milgram results published — 65% full obedience', category: 'year' },
            { displayValue: '1971', tooltip: 'Stanford Prison Experiment', category: 'year' },
            { displayValue: '1972', tooltip: 'Tversky & Kahneman — cognitive biases', category: 'year' },
            { displayValue: '1977', tooltip: 'Loftus on false memories', category: 'year' },
            { displayValue: '1984', tooltip: 'Cialdini\'s Influence — six principles', category: 'year' },
            { displayValue: '1999', tooltip: 'Dunning-Kruger effect identified', category: 'year' },
            { displayValue: '2002', tooltip: 'Kahneman wins Nobel — behavioral economics', category: 'year' },
            { displayValue: '2011', tooltip: 'Replication crisis emerges', category: 'year' },
            { displayValue: '7±2', tooltip: 'Items in working memory (Miller)', category: 'constant' },
            { displayValue: '65%', tooltip: 'Milgram subjects who gave max shock', category: 'percentage' },
            { displayValue: '75%', tooltip: 'Asch subjects who conformed at least once', category: 'percentage' },
            { displayValue: '50%', tooltip: 'Psychology studies that fail to replicate', category: 'percentage' },
            { displayValue: '6', tooltip: 'Cialdini\'s principles of influence', category: 'count' }
        ],

        // ==================== STATISTICS ====================
        // Primary: Statistical constants, key values, percentages
        statistics: [
            { displayValue: '1.96', tooltip: 'Z-score for 95% confidence interval', category: 'constant' },
            { displayValue: '2.58', tooltip: 'Z-score for 99% confidence interval', category: 'constant' },
            { displayValue: '0.05', tooltip: 'Standard p-value threshold for significance', category: 'constant' },
            { displayValue: '0.01', tooltip: 'Stricter p-value threshold', category: 'constant' },
            { displayValue: '30', tooltip: 'Often cited minimum sample size for CLT', category: 'count' },
            { displayValue: '68%', tooltip: 'Data within 1 standard deviation (normal)', category: 'percentage' },
            { displayValue: '95%', tooltip: 'Data within 2 standard deviations (normal)', category: 'percentage' },
            { displayValue: '99.7%', tooltip: 'Data within 3 standard deviations (normal)', category: 'percentage' },
            { displayValue: '0.8', tooltip: 'Often-cited threshold for adequate power', category: 'constant' },
            { displayValue: '0.5', tooltip: 'Medium effect size (Cohen\'s d)', category: 'constant' },
            { displayValue: '0.2', tooltip: 'Small effect size (Cohen\'s d)', category: 'constant' },
            { displayValue: '0.8', tooltip: 'Large effect size (Cohen\'s d)', category: 'constant' },
            { displayValue: '1713', tooltip: 'Bernoulli\'s law of large numbers', category: 'year' },
            { displayValue: '1763', tooltip: 'Bayes\' theorem published', category: 'year' },
            { displayValue: '1809', tooltip: 'Gauss describes normal distribution', category: 'year' },
            { displayValue: '1900', tooltip: 'Pearson\'s chi-square test', category: 'year' },
            { displayValue: '1908', tooltip: 'Student\'s t-test (Gosset at Guinness)', category: 'year' },
            { displayValue: '1925', tooltip: 'Fisher\'s p < 0.05 convention', category: 'year' },
            { displayValue: '1933', tooltip: 'Neyman-Pearson hypothesis testing', category: 'year' },
            { displayValue: '36%', tooltip: 'Probability in Monty Hall problem (staying)', category: 'percentage' },
            { displayValue: '67%', tooltip: 'Probability in Monty Hall problem (switching)', category: 'percentage' }
        ],

        // ==================== SOURCES ====================
        // Primary: Key dates in source verification history, plus statistics
        sources: [
            { displayValue: '1377', tooltip: 'Ibn Khaldun — early source criticism methods', category: 'year' },
            { displayValue: '1440', tooltip: 'Valla exposes Donation of Constantine forgery', category: 'year' },
            { displayValue: '1824', tooltip: 'Ranke — "wie es eigentlich gewesen" methodology', category: 'year' },
            { displayValue: '1851', tooltip: 'Reuters founded — news verification begins', category: 'year' },
            { displayValue: '1896', tooltip: 'Adolph Ochs buys NYT — "without fear or favor"', category: 'year' },
            { displayValue: '1923', tooltip: 'ASNE adopts ethics code', category: 'year' },
            { displayValue: '1974', tooltip: 'Woodward & Bernstein — two-source rule', category: 'year' },
            { displayValue: '1991', tooltip: 'Tim Berners-Lee — hyperlinks enable verification', category: 'year' },
            { displayValue: '1994', tooltip: 'Snopes founded — fact-checking site', category: 'year' },
            { displayValue: '2003', tooltip: 'FactCheck.org launches', category: 'year' },
            { displayValue: '2007', tooltip: 'PolitiFact launches — Truth-O-Meter', category: 'year' },
            { displayValue: '2015', tooltip: 'IFCN — International Fact-Checking Network', category: 'year' },
            { displayValue: '2016', tooltip: 'Oxford declares "post-truth" word of year', category: 'year' },
            { displayValue: '2017', tooltip: 'Fake news explosion — verification critical', category: 'year' },
            { displayValue: '59%', tooltip: 'Adults who shared news without verifying (Pew)', category: 'percentage' },
            { displayValue: '64%', tooltip: 'Say fabricated news causes confusion (Pew)', category: 'percentage' },
            { displayValue: '23%', tooltip: 'Shared news they later realized was fake', category: 'percentage' },
            { displayValue: '14%', tooltip: 'Shared news they knew was fake', category: 'percentage' },
            { displayValue: '2', tooltip: 'Source minimum for major claims (journalism)', category: 'count' },
            { displayValue: '5', tooltip: 'CRAAP test criteria', category: 'count' },
            { displayValue: '70%', tooltip: 'False news travels faster (MIT study)', category: 'percentage' }
        ],

        // ==================== EXPORT (Special) ====================
        // Easter eggs and meaningful numbers for the export button
        export: [
            { displayValue: '42', tooltip: 'The Answer to Life, the Universe, and Everything — Douglas Adams', category: 'easter-egg' },
            { displayValue: '451', tooltip: 'Fahrenheit 451 — temperature at which books burn (Bradbury)', category: 'easter-egg' },
            { displayValue: '1984', tooltip: 'Orwell\'s warning about truth and power', category: 'easter-egg' },
            { displayValue: '2001', tooltip: 'A Space Odyssey — HAL\'s careful attention', category: 'easter-egg' },
            { displayValue: '1138', tooltip: 'THX-1138 — George Lucas\'s first film', category: 'easter-egg' },
            { displayValue: '47', tooltip: 'Appears throughout Star Trek — production inside joke', category: 'easter-egg' },
            { displayValue: '23', tooltip: 'The Illuminatus! Trilogy — "fnord"', category: 'easter-egg' },
            { displayValue: '007', tooltip: 'Licensed to verify — your mission, should you choose', category: 'easter-egg' },
            { displayValue: '404', tooltip: 'Truth not found — keep searching', category: 'easter-egg' },
            { displayValue: '3.14', tooltip: 'Pi — some truths are irrational but undeniable', category: 'easter-egg' },
            { displayValue: '867', tooltip: '867-5309 — some numbers just stick (Tommy Tutone)', category: 'easter-egg' },
            { displayValue: '1701', tooltip: 'NCC-1701 — the Enterprise, seeking out new truths', category: 'easter-egg' },
            { displayValue: '2112', tooltip: 'Rush — the spirit of discovery', category: 'easter-egg' },
            { displayValue: '525600', tooltip: 'Minutes in a year — how do you measure truth?', category: 'easter-egg' }
        ]
    };

    // ==================== PUBLIC API ====================

    /**
     * Get a random entry for a discipline
     * @param {string} discipline - Discipline name
     * @returns {Object|null} Entry object with displayValue, tooltip, category, discipline
     */
    function getRandomEntry(discipline) {
        const entries = MICRO_DATA[discipline.toLowerCase()];
        if (!entries || entries.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * entries.length);
        return {
            ...entries[randomIndex],
            discipline: discipline.toLowerCase()
        };
    }

    /**
     * Get entry by display value
     * @param {string} discipline - Discipline name
     * @param {string} value - Display value to find
     * @returns {Object|null} Entry object or null
     */
    function getEntryByValue(discipline, value) {
        const entries = MICRO_DATA[discipline.toLowerCase()];
        if (!entries) return null;
        
        const found = entries.find(e => e.displayValue === value);
        if (found) {
            return { ...found, discipline: discipline.toLowerCase() };
        }
        return null;
    }

    /**
     * Get all entries for a discipline
     * @param {string} discipline - Discipline name
     * @returns {Array} Array of entry objects
     */
    function getAllEntries(discipline) {
        const entries = MICRO_DATA[discipline.toLowerCase()];
        if (!entries) return [];
        return entries.map(e => ({ ...e, discipline: discipline.toLowerCase() }));
    }

    /**
     * Get all discipline names
     * @returns {Array} Array of discipline names
     */
    function getDisciplines() {
        return Object.keys(MICRO_DATA);
    }

    /**
     * Get entries by category
     * @param {string} category - Category (year, atomic, constant, percentage, count, duration, easter-egg)
     * @returns {Array} Array of matching entries with discipline
     */
    function getByCategory(category) {
        const results = [];
        for (const [discipline, entries] of Object.entries(MICRO_DATA)) {
            for (const entry of entries) {
                if (entry.category === category) {
                    results.push({ ...entry, discipline });
                }
            }
        }
        return results;
    }

    /**
     * Get total entry count
     * @returns {number} Total entries across all disciplines
     */
    function getTotalCount() {
        return Object.values(MICRO_DATA).reduce((sum, arr) => sum + arr.length, 0);
    }

    /**
     * Get formatted display object for a discipline number
     * @param {string} discipline - Discipline name
     * @returns {Object} { display: '1215', tooltip: '...', category: '...' }
     */
    function getDisplayForDiscipline(discipline) {
        const entry = getRandomEntry(discipline);
        if (!entry) {
            return { display: '---', tooltip: 'No data', category: 'none' };
        }
        return {
            display: entry.displayValue,
            tooltip: entry.tooltip,
            category: entry.category
        };
    }

    /**
     * Get a full set of random displays for all disciplines
     * @returns {Object} Keyed by discipline name
     */
    function getFullRandomSet() {
        const set = {};
        for (const discipline of Object.keys(MICRO_DATA)) {
            set[discipline] = getDisplayForDiscipline(discipline);
        }
        return set;
    }

    return {
        getRandomEntry,
        getEntryByValue,
        getAllEntries,
        getDisciplines,
        getByCategory,
        getTotalCount,
        getDisplayForDiscipline,
        getFullRandomSet,
        MICRO_DATA
    };

})();

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeracityMicroDiscovery;
}
