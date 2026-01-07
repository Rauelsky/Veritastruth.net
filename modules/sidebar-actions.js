/**
 * VERACITY v5.2 — Sidebar Actions Module
 * =======================================
 * 
 * Provides interactive functionality for sidebar action buttons:
 * - LITERACY: Information literacy guide
 * - BIAS: Cognitive bias reference with live examples
 * - DATA: Understanding statistics primer
 * - VERIFY: Source verification checklist
 * - REPORTS: Assessment archive/history
 * 
 * Features:
 * - Context-aware (different behavior when idle vs assessment active)
 * - Live examples from current assessment
 * - Educational content
 * - Modal-based UI
 * 
 * VERITAS LLC — Prairie du Sac, Wisconsin
 * https://veritastruth.net
 * 
 * 🖖 Live Long and Prosper
 */

const SidebarActions = {
  
  // Current state
  context: 'idle',
  assessmentData: null,
  detectedBiases: {},
  
  /**
   * Initialize sidebar actions
   * @param {string} context - 'idle', 'assess', 'interview', 'navigate'
   * @param {object} data - Assessment or conversation data
   */
  init(context = 'idle', data = null) {
    this.context = context;
    this.assessmentData = data;
    this.detectedBiases = {};
    
    // If assessment data provided, detect biases
    if (data && context === 'assess') {
      this.detectedBiases = this._detectBiases(data);
    }
    
    // Wire up button event listeners
    this._attachEventListeners();
    
    console.log(`SidebarActions initialized: context=${context}`);
  },
  
  /**
   * Attach event listeners to sidebar buttons
   */
  _attachEventListeners() {
    const buttonMap = {
      'literacyBtn': () => this.showLiteracyGuide(),
      'biasBtn': () => this.showBiasGuide(),
      'dataBtn': () => this.showDataGuide(),
      'verifyBtn': () => this.showVerifyGuide(),
      'reportsBtn': () => this.showReports()
    };
    
    for (const [id, handler] of Object.entries(buttonMap)) {
      const btn = document.getElementById(id);
      if (btn) {
        // Remove existing listeners
        btn.replaceWith(btn.cloneNode(true));
        // Re-get and attach
        const newBtn = document.getElementById(id);
        if (newBtn) {
          newBtn.addEventListener('click', handler);
        }
      }
    }
    
    // Also attach to buttons by class or data attribute
    document.querySelectorAll('[data-sidebar-action]').forEach(btn => {
      const action = btn.dataset.sidebarAction;
      btn.addEventListener('click', () => {
        switch(action) {
          case 'literacy': this.showLiteracyGuide(); break;
          case 'bias': this.showBiasGuide(); break;
          case 'data': this.showDataGuide(); break;
          case 'verify': this.showVerifyGuide(); break;
          case 'reports': this.showReports(); break;
        }
      });
    });
  },
  
  /**
   * =============================================
   * BIAS GUIDE (Primary Feature)
   * =============================================
   */
  showBiasGuide() {
    const biases = BiasKnowledgeBase.getAllBiases();
    const examples = this.detectedBiases;
    const hasLiveExamples = Object.keys(examples).length > 0;
    
    let html = '<div class="bias-guide">';
    
    // Introduction
    html += `
      <div class="bias-intro">
        <p>Cognitive biases are systematic patterns of deviation from rationality in judgment. 
        Understanding them helps us think more clearly and evaluate information more effectively.</p>
        ${hasLiveExamples ? `
          <div class="live-examples-badge">
            <span class="badge-icon">🔍</span>
            <span class="badge-text">${Object.keys(examples).length} bias pattern(s) detected in current assessment</span>
          </div>
        ` : ''}
      </div>
    `;
    
    // Category grouping
    const categories = {};
    for (const bias of biases) {
      if (!categories[bias.category]) {
        categories[bias.category] = [];
      }
      categories[bias.category].push(bias);
    }
    
    // Render by category
    for (const [category, categoryBiases] of Object.entries(categories)) {
      html += `<div class="bias-category">`;
      html += `<h3 class="category-title">${category}</h3>`;
      
      for (const bias of categoryBiases) {
        const hasExample = examples[bias.id];
        
        html += `
          <div class="bias-entry ${hasExample ? 'has-live-example' : ''}">
            <div class="bias-header">
              <h4 class="bias-name">${bias.name}</h4>
              ${hasExample ? '<span class="live-indicator">● DETECTED</span>' : ''}
            </div>
            
            <p class="bias-definition">${bias.definition}</p>
            
            <div class="bias-example">
              <strong>Example:</strong> ${bias.example}
            </div>
            
            <details class="bias-details">
              <summary>How to Spot & Avoid</summary>
              
              <div class="bias-tips">
                <strong>🔍 How to Spot It:</strong>
                <ul>
                  ${bias.howToSpot.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
              </div>
              
              <div class="bias-tips">
                <strong>🛡️ How to Avoid It:</strong>
                <ul>
                  ${bias.howToAvoid.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
              </div>
            </details>
            
            ${hasExample ? `
              <div class="live-example-panel">
                <div class="live-example-header">
                  <span class="live-icon">🔍</span>
                  <span>Found in Current Assessment</span>
                </div>
                <div class="live-example-content">
                  <p class="example-quote">"${examples[bias.id].example}"</p>
                  <p class="example-explanation">${examples[bias.id].explanation}</p>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }
      
      html += `</div>`; // bias-category
    }
    
    html += '</div>'; // bias-guide
    
    this._showModal({
      title: '🧠 Cognitive Bias Reference',
      content: html,
      size: 'large'
    });
  },
  
  /**
   * =============================================
   * LITERACY GUIDE
   * =============================================
   */
  showLiteracyGuide() {
    const html = `
      <div class="literacy-guide">
        <div class="guide-intro">
          <p>Information literacy is the ability to identify, find, evaluate, and use information effectively. 
          In an age of information overload, these skills are essential.</p>
        </div>
        
        <div class="guide-section">
          <h3>📚 The CRAAP Test</h3>
          <p>A framework for evaluating information sources:</p>
          
          <div class="craap-grid">
            <div class="craap-item">
              <h4>C - Currency</h4>
              <p>When was it published? Has it been updated? Is timeliness important for your topic?</p>
            </div>
            <div class="craap-item">
              <h4>R - Relevance</h4>
              <p>Does it relate to your topic? Who is the intended audience? Is it at an appropriate level?</p>
            </div>
            <div class="craap-item">
              <h4>A - Authority</h4>
              <p>Who is the author? What are their credentials? Is the publisher reputable?</p>
            </div>
            <div class="craap-item">
              <h4>A - Accuracy</h4>
              <p>Is the information supported by evidence? Can it be verified? Are there citations?</p>
            </div>
            <div class="craap-item">
              <h4>P - Purpose</h4>
              <p>Why does this exist? Is it to inform, teach, sell, entertain, or persuade?</p>
            </div>
          </div>
        </div>
        
        <div class="guide-section">
          <h3>🔍 Lateral Reading</h3>
          <p>Don't just evaluate a source in isolation. Instead:</p>
          <ol>
            <li><strong>Open new tabs</strong> — Search for information ABOUT the source</li>
            <li><strong>Check what others say</strong> — Look for reviews, critiques, or coverage of the source</li>
            <li><strong>Verify the author</strong> — Search for the author's credentials independently</li>
            <li><strong>Find the original</strong> — If it's reporting on a study or event, find the primary source</li>
          </ol>
        </div>
        
        <div class="guide-section">
          <h3>⚠️ Red Flags</h3>
          <ul class="red-flags-list">
            <li>Emotional language designed to provoke strong reactions</li>
            <li>Lack of author attribution or anonymous sources</li>
            <li>No dates or outdated information presented as current</li>
            <li>Headlines that don't match the content</li>
            <li>Missing citations or links to original sources</li>
            <li>Site designed to look like a legitimate news source but isn't</li>
            <li>Claims that "mainstream media won't tell you"</li>
          </ul>
        </div>
        
        <div class="guide-section">
          <h3>✅ Green Flags</h3>
          <ul class="green-flags-list">
            <li>Clear author attribution with verifiable credentials</li>
            <li>Links to primary sources and original research</li>
            <li>Acknowledgment of uncertainty or limitations</li>
            <li>Updates or corrections when errors are found</li>
            <li>Distinction between news and opinion</li>
            <li>Multiple independent sources confirm the information</li>
          </ul>
        </div>
      </div>
    `;
    
    this._showModal({
      title: '📖 Information Literacy Guide',
      content: html,
      size: 'large'
    });
  },
  
  /**
   * =============================================
   * DATA/STATISTICS GUIDE
   * =============================================
   */
  showDataGuide() {
    const html = `
      <div class="data-guide">
        <div class="guide-intro">
          <p>Statistics can illuminate truth or obscure it. Understanding how to interpret data 
          helps you separate genuine insights from misleading claims.</p>
        </div>
        
        <div class="guide-section">
          <h3>📊 Key Questions to Ask</h3>
          <ul>
            <li><strong>What's the sample size?</strong> Larger samples are generally more reliable.</li>
            <li><strong>Who was sampled?</strong> Was it representative of the population being discussed?</li>
            <li><strong>What's the margin of error?</strong> A 2-point difference with ±3% margin means nothing.</li>
            <li><strong>Correlation vs. Causation?</strong> Just because two things correlate doesn't mean one causes the other.</li>
            <li><strong>What's the baseline?</strong> "Doubled" sounds dramatic, but 2 in a million vs 1 in a million isn't.</li>
            <li><strong>Absolute vs. Relative?</strong> "50% increase" could be 2→3 or 1,000,000→1,500,000.</li>
          </ul>
        </div>
        
        <div class="guide-section">
          <h3>🎭 Common Statistical Tricks</h3>
          
          <div class="trick-item">
            <h4>Cherry-Picking Timeframes</h4>
            <p>Selecting start/end dates that support a narrative. "Crime is up 30%!" (if you start counting from an unusually low month)</p>
          </div>
          
          <div class="trick-item">
            <h4>Misleading Axes</h4>
            <p>Graphs that don't start at zero or use irregular intervals can exaggerate small differences.</p>
          </div>
          
          <div class="trick-item">
            <h4>Survivorship Bias</h4>
            <p>Only looking at successes. "These successful people dropped out of college!" ignores millions who dropped out and didn't succeed.</p>
          </div>
          
          <div class="trick-item">
            <h4>Simpson's Paradox</h4>
            <p>A trend that appears in different groups can disappear or reverse when groups are combined.</p>
          </div>
          
          <div class="trick-item">
            <h4>Base Rate Neglect</h4>
            <p>Ignoring how common something is. A 99% accurate test still produces many false positives if the condition is rare.</p>
          </div>
        </div>
        
        <div class="guide-section">
          <h3>📈 Understanding Risk</h3>
          <table class="risk-table">
            <tr>
              <th>Term</th>
              <th>Meaning</th>
              <th>Example</th>
            </tr>
            <tr>
              <td>Absolute Risk</td>
              <td>Actual probability of an event</td>
              <td>1 in 1,000 chance</td>
            </tr>
            <tr>
              <td>Relative Risk</td>
              <td>How much risk changes compared to baseline</td>
              <td>"2x higher risk" (could be 2/1000 vs 1/1000)</td>
            </tr>
            <tr>
              <td>Number Needed to Treat (NNT)</td>
              <td>How many people need treatment for one to benefit</td>
              <td>NNT of 100 = treat 100 people to help 1</td>
            </tr>
          </table>
        </div>
      </div>
    `;
    
    this._showModal({
      title: '📊 Understanding Statistics',
      content: html,
      size: 'large'
    });
  },
  
  /**
   * =============================================
   * VERIFY/SOURCE EVALUATION GUIDE
   * =============================================
   */
  showVerifyGuide() {
    const html = `
      <div class="verify-guide">
        <div class="guide-intro">
          <p>Not all sources are created equal. This checklist helps you evaluate the reliability 
          and trustworthiness of information sources.</p>
        </div>
        
        <div class="guide-section">
          <h3>✅ Source Verification Checklist</h3>
          
          <div class="checklist">
            <div class="checklist-item">
              <input type="checkbox" id="check1">
              <label for="check1"><strong>Author Identified</strong> — Can you verify who wrote this?</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check2">
              <label for="check2"><strong>Author Qualified</strong> — Do they have relevant expertise?</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check3">
              <label for="check3"><strong>Publication Reputable</strong> — Is the outlet known and accountable?</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check4">
              <label for="check4"><strong>Date Current</strong> — Is the information up to date?</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check5">
              <label for="check5"><strong>Sources Cited</strong> — Does it link to original evidence?</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check6">
              <label for="check6"><strong>Multiple Confirmation</strong> — Do other sources confirm this?</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check7">
              <label for="check7"><strong>Conflicts Disclosed</strong> — Are potential biases acknowledged?</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check8">
              <label for="check8"><strong>Tone Measured</strong> — Is the language factual rather than inflammatory?</label>
            </div>
          </div>
        </div>
        
        <div class="guide-section">
          <h3>📰 Source Hierarchy</h3>
          <p>Generally, sources can be ranked by reliability:</p>
          
          <div class="source-hierarchy">
            <div class="hierarchy-tier tier-1">
              <strong>Tier 1: Primary Sources</strong>
              <p>Original research, official documents, firsthand accounts, raw data</p>
            </div>
            <div class="hierarchy-tier tier-2">
              <strong>Tier 2: Authoritative Secondary</strong>
              <p>Peer-reviewed journals, major news organizations, government reports, academic institutions</p>
            </div>
            <div class="hierarchy-tier tier-3">
              <strong>Tier 3: General Secondary</strong>
              <p>Encyclopedias, textbooks, reputable magazines, established news outlets</p>
            </div>
            <div class="hierarchy-tier tier-4">
              <strong>Tier 4: Tertiary/Opinion</strong>
              <p>Blog posts, opinion pieces, social media, anonymous sources</p>
            </div>
          </div>
        </div>
        
        <div class="guide-section">
          <h3>🔗 Quick Verification Tools</h3>
          <ul>
            <li><a href="https://www.snopes.com" target="_blank">Snopes</a> — Fact-checking</li>
            <li><a href="https://www.factcheck.org" target="_blank">FactCheck.org</a> — Political claims</li>
            <li><a href="https://mediabiasfactcheck.com" target="_blank">Media Bias/Fact Check</a> — Source ratings</li>
            <li><a href="https://scholar.google.com" target="_blank">Google Scholar</a> — Academic sources</li>
            <li><a href="https://archive.org" target="_blank">Internet Archive</a> — Historical versions</li>
          </ul>
        </div>
      </div>
    `;
    
    this._showModal({
      title: '✓ Source Verification Checklist',
      content: html,
      size: 'large'
    });
  },
  
  /**
   * =============================================
   * REPORTS/HISTORY
   * =============================================
   */
  showReports() {
    // Check for stored assessments
    const history = this._getAssessmentHistory();
    
    let html = `
      <div class="reports-panel">
        <div class="guide-intro">
          <p>Your assessment history and saved reports.</p>
        </div>
    `;
    
    if (history.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Saved Assessments</h3>
          <p>Assessments you export will appear here for easy access.</p>
          <p class="empty-hint">Run an assessment and use the export buttons to save your work.</p>
        </div>
      `;
    } else {
      html += `
        <div class="history-list">
          ${history.map(item => `
            <div class="history-item">
              <div class="history-meta">
                <span class="history-date">${new Date(item.timestamp).toLocaleDateString()}</span>
                <span class="history-track">Track ${item.track.toUpperCase()}</span>
              </div>
              <div class="history-claim">${this._truncate(item.claim, 100)}</div>
              <div class="history-score">Score: ${item.realityScore}/10</div>
              <div class="history-actions">
                <button onclick="SidebarActions._viewHistoryItem('${item.id}')">View</button>
                <button onclick="SidebarActions._deleteHistoryItem('${item.id}')">Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="history-footer">
          <button onclick="SidebarActions._clearHistory()" class="clear-btn">Clear All History</button>
        </div>
      `;
    }
    
    html += `</div>`;
    
    this._showModal({
      title: '📁 Assessment Reports',
      content: html,
      size: 'medium'
    });
  },
  
  /**
   * =============================================
   * BIAS DETECTION
   * =============================================
   */
  _detectBiases(data) {
    const detected = {};
    const claim = (data.claim || '').toLowerCase();
    const assessment = JSON.stringify(data.assessment || {}).toLowerCase();
    const combined = claim + ' ' + assessment;
    
    // Pattern matching for bias indicators
    const patterns = {
      confirmation_bias: {
        patterns: [
          /everyone knows/i,
          /obviously/i,
          /clearly/i,
          /it's a fact that/i,
          /undeniable/i,
          /proves that/i
        ],
        explanation: 'This language suggests treating a viewpoint as self-evident truth without examining alternatives.'
      },
      availability_bias: {
        patterns: [
          /always hear about/i,
          /constantly in the news/i,
          /everywhere/i,
          /all the time/i,
          /epidemic/i,
          /crisis/i
        ],
        explanation: 'This may overstate frequency based on memorable or recent examples rather than actual data.'
      },
      anchoring_bias: {
        patterns: [
          /originally/i,
          /started at/i,
          /compared to the initial/i,
          /first estimate/i
        ],
        explanation: 'The framing may be heavily influenced by an initial reference point.'
      },
      authority_bias: {
        patterns: [
          /experts say/i,
          /scientists agree/i,
          /studies show/i,
          /according to doctors/i
        ],
        explanation: 'Appeals to authority without specifying which experts or examining their actual consensus.'
      },
      bandwagon_effect: {
        patterns: [
          /everyone believes/i,
          /most people think/i,
          /the majority/i,
          /popular opinion/i,
          /nobody thinks/i
        ],
        explanation: 'Popularity doesn\'t determine truth. This appeals to consensus rather than evidence.'
      },
      false_dichotomy: {
        patterns: [
          /either.*or/i,
          /you're either.*or/i,
          /there are only two/i,
          /if you're not.*you're/i
        ],
        explanation: 'This presents limited options when more alternatives may exist.'
      },
      framing_effect: {
        patterns: [
          /90% success/i,
          /10% failure/i,
          /half full/i,
          /half empty/i,
          /saved.*lives/i,
          /killed.*people/i
        ],
        explanation: 'The same information can be framed positively or negatively to influence perception.'
      }
    };
    
    for (const [biasId, config] of Object.entries(patterns)) {
      for (const pattern of config.patterns) {
        const match = combined.match(pattern);
        if (match) {
          detected[biasId] = {
            example: match[0],
            explanation: config.explanation
          };
          break; // Only need one example per bias
        }
      }
    }
    
    return detected;
  },
  
  /**
   * =============================================
   * HISTORY MANAGEMENT
   * =============================================
   */
  _getAssessmentHistory() {
    try {
      const stored = localStorage.getItem('veracity_history');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading history:', e);
      return [];
    }
  },
  
  _saveToHistory(assessment) {
    try {
      const history = this._getAssessmentHistory();
      const item = {
        id: Date.now().toString(36),
        timestamp: new Date().toISOString(),
        track: assessment.track || 'a',
        claim: assessment.claim,
        realityScore: assessment.realityScore,
        data: assessment
      };
      history.unshift(item);
      // Keep only last 50
      if (history.length > 50) history.pop();
      localStorage.setItem('veracity_history', JSON.stringify(history));
    } catch (e) {
      console.error('Error saving to history:', e);
    }
  },
  
  _viewHistoryItem(id) {
    const history = this._getAssessmentHistory();
    const item = history.find(h => h.id === id);
    if (item) {
      // Could restore assessment or show in modal
      console.log('View history item:', item);
      alert('History view coming soon!');
    }
  },
  
  _deleteHistoryItem(id) {
    if (!confirm('Delete this assessment from history?')) return;
    
    try {
      let history = this._getAssessmentHistory();
      history = history.filter(h => h.id !== id);
      localStorage.setItem('veracity_history', JSON.stringify(history));
      this.showReports(); // Refresh
    } catch (e) {
      console.error('Error deleting history item:', e);
    }
  },
  
  _clearHistory() {
    if (!confirm('Clear all assessment history? This cannot be undone.')) return;
    
    try {
      localStorage.removeItem('veracity_history');
      this.showReports(); // Refresh
    } catch (e) {
      console.error('Error clearing history:', e);
    }
  },
  
  /**
   * =============================================
   * MODAL SYSTEM
   * =============================================
   */
  _showModal({ title, content, size = 'medium' }) {
    // Check for existing modal
    let modal = document.getElementById('sidebarModal');
    
    if (!modal) {
      // Create modal structure
      modal = document.createElement('div');
      modal.id = 'sidebarModal';
      modal.className = 'sidebar-modal-overlay';
      modal.innerHTML = `
        <div class="sidebar-modal">
          <div class="sidebar-modal-header">
            <h2 id="sidebarModalTitle"></h2>
            <button class="sidebar-modal-close" onclick="closeSidebarModal()">×</button>
          </div>
          <div class="sidebar-modal-content" id="sidebarModalContent"></div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Close on overlay click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeSidebarModal();
        }
      });
      
      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) {
          closeSidebarModal();
        }
      });
    }
    
    // Update content
    const titleEl = document.getElementById('sidebarModalTitle');
    const contentEl = document.getElementById('sidebarModalContent');
    const modalBox = modal.querySelector('.sidebar-modal');
    
    titleEl.textContent = title;
    contentEl.innerHTML = content;
    
    // Set size
    modalBox.className = `sidebar-modal sidebar-modal-${size}`;
    
    // Show
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },
  
  /**
   * =============================================
   * UTILITIES
   * =============================================
   */
  _truncate(str, length) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  }
};

/**
 * =============================================
 * BIAS KNOWLEDGE BASE
 * =============================================
 */
const BiasKnowledgeBase = {
  
  biases: [
    // === INFORMATION PROCESSING ===
    {
      id: 'confirmation_bias',
      name: 'Confirmation Bias',
      category: 'Information Processing',
      definition: 'The tendency to search for, interpret, favor, and recall information that confirms pre-existing beliefs while giving disproportionately less consideration to alternative possibilities.',
      example: 'If you believe vaccines are dangerous, you might focus on rare adverse reactions while ignoring millions of safe administrations.',
      howToSpot: [
        'Only citing sources that agree with initial position',
        'Dismissing contrary evidence as "biased" or "flawed"',
        'Remembering examples that support belief but forgetting counterexamples',
        'Interpreting ambiguous information in favor of existing beliefs'
      ],
      howToAvoid: [
        'Actively seek out information that challenges your view',
        'Give equal attention to disconfirming evidence',
        'Ask "What would change my mind?"',
        'Steel-man opposing arguments before dismissing them'
      ],
      relatedBiases: ['availability_bias', 'anchoring_bias', 'belief_perseverance']
    },
    {
      id: 'availability_bias',
      name: 'Availability Bias',
      category: 'Information Processing',
      definition: 'Overestimating the likelihood of events based on their availability in memory, which is influenced by how recent, dramatic, or emotionally charged they are.',
      example: 'Fearing plane crashes more than car accidents because plane crashes are more memorable and dramatic, despite being far less likely.',
      howToSpot: [
        'Judging risk based on recent news stories',
        'Overestimating dramatic but rare events',
        'Underestimating common but mundane risks',
        'Making decisions based on vivid examples'
      ],
      howToAvoid: [
        'Look up actual statistics instead of relying on memory',
        'Consider base rates and frequencies',
        'Ask "Is this memorable because it\'s common or because it\'s dramatic?"',
        'Wait before reacting to dramatic news'
      ],
      relatedBiases: ['recency_bias', 'salience_bias', 'confirmation_bias']
    },
    {
      id: 'anchoring_bias',
      name: 'Anchoring Bias',
      category: 'Information Processing',
      definition: 'The tendency to rely too heavily on the first piece of information offered (the "anchor") when making decisions.',
      example: 'If a house is first listed at $500,000, you might think $450,000 is a great deal, even if similar houses sell for $400,000.',
      howToSpot: [
        'First number mentioned heavily influences your estimate',
        'Initial framing affects your judgment disproportionately',
        'Hard to adjust away from starting point',
        'Negotiations influenced by first offer'
      ],
      howToAvoid: [
        'Deliberately consider multiple reference points',
        'Research independently before seeing initial offer',
        'Ask "Would I think this if presented differently?"',
        'Generate your own estimate before hearing others'
      ],
      relatedBiases: ['framing_effect', 'primacy_effect']
    },
    
    // === PROBABILITY & RISK ===
    {
      id: 'base_rate_neglect',
      name: 'Base Rate Neglect',
      category: 'Probability & Risk',
      definition: 'Ignoring general prevalence information in favor of specific case information when making probability judgments.',
      example: 'Assuming someone who loves books and is quiet is more likely to be a librarian than a salesperson, ignoring that salespeople vastly outnumber librarians.',
      howToSpot: [
        'Ignoring how common something is in the population',
        'Overweighting vivid or specific details',
        'Making predictions without considering background rates',
        'Confusing "fits the profile" with "is likely"'
      ],
      howToAvoid: [
        'Always ask "How common is this generally?"',
        'Consider the base rate before specific features',
        'Use Bayesian reasoning when possible',
        'Remember that rare conditions stay rare even with positive indicators'
      ],
      relatedBiases: ['representativeness_heuristic', 'conjunction_fallacy']
    },
    {
      id: 'gambler_fallacy',
      name: 'Gambler\'s Fallacy',
      category: 'Probability & Risk',
      definition: 'The mistaken belief that if something happens more frequently than normal during a given period, it will happen less frequently in the future (or vice versa).',
      example: 'Believing that after 10 heads in a row, tails is "due" — when each flip is actually independent with 50/50 odds.',
      howToSpot: [
        'Expecting patterns to "balance out"',
        'Believing something is "due" to happen',
        'Treating independent events as connected',
        'Looking for patterns in random sequences'
      ],
      howToAvoid: [
        'Remember that independent events don\'t affect each other',
        'Each trial has the same probability regardless of history',
        'Distinguish between independent and dependent events',
        'Trust mathematics over intuition for probability'
      ],
      relatedBiases: ['hot_hand_fallacy', 'clustering_illusion']
    },
    
    // === SOCIAL & INTERPERSONAL ===
    {
      id: 'authority_bias',
      name: 'Authority Bias',
      category: 'Social & Interpersonal',
      definition: 'The tendency to attribute greater accuracy to the opinion of an authority figure and be more influenced by that opinion.',
      example: 'Accepting a celebrity\'s health advice over evidence-based medical recommendations because the celebrity is famous.',
      howToSpot: [
        'Appeals to credentials without examining evidence',
        'Deferring to experts outside their field of expertise',
        'Accepting claims because of who said them, not what was said',
        'Reluctance to question authority figures'
      ],
      howToAvoid: [
        'Evaluate evidence independent of its source',
        'Check if the authority is actually expert in the relevant field',
        'Remember that experts can be wrong and have biases',
        'Look for consensus among multiple independent experts'
      ],
      relatedBiases: ['halo_effect', 'bandwagon_effect']
    },
    {
      id: 'bandwagon_effect',
      name: 'Bandwagon Effect',
      category: 'Social & Interpersonal',
      definition: 'The tendency to do or believe things because many other people do or believe the same.',
      example: 'Assuming a restaurant is good because there\'s always a line outside, without considering the actual food quality.',
      howToSpot: [
        'Arguments based on popularity ("everyone knows")',
        'Following trends without independent evaluation',
        'Conforming to group opinions to fit in',
        'Assuming widespread belief indicates truth'
      ],
      howToAvoid: [
        'Evaluate evidence independently of popularity',
        'Remember that popularity doesn\'t equal truth',
        'Consider why something might be popular (marketing vs. quality)',
        'Be willing to hold minority positions when evidence supports them'
      ],
      relatedBiases: ['groupthink', 'social_proof']
    },
    {
      id: 'ingroup_bias',
      name: 'In-Group Bias',
      category: 'Social & Interpersonal',
      definition: 'The tendency to favor members of one\'s own group over those in other groups.',
      example: 'Giving more credibility to news sources aligned with your political party while dismissing equally credible sources from the other side.',
      howToSpot: [
        'Automatically trusting "our" sources over "their" sources',
        'Interpreting identical behavior differently based on group membership',
        'Making excuses for in-group failures while condemning out-group failures',
        'Assuming positive motives for in-group, negative for out-group'
      ],
      howToAvoid: [
        'Apply the same standards to all groups consistently',
        'Imagine how you\'d react if the groups were reversed',
        'Seek out and seriously consider out-group perspectives',
        'Judge individuals and ideas on their merits, not group membership'
      ],
      relatedBiases: ['fundamental_attribution_error', 'outgroup_homogeneity']
    },
    
    // === MEMORY & RECALL ===
    {
      id: 'hindsight_bias',
      name: 'Hindsight Bias',
      category: 'Memory & Recall',
      definition: 'The tendency to perceive past events as having been predictable after they have occurred.',
      example: 'After a stock market crash, believing "it was obvious it was coming" even though few predicted it beforehand.',
      howToSpot: [
        '"I knew it all along" reactions to unexpected events',
        'Underestimating how uncertain things seemed before the outcome',
        'Judging past decisions unfairly based on outcomes',
        'Believing patterns were more visible than they were'
      ],
      howToAvoid: [
        'Record predictions before outcomes are known',
        'Remember how uncertain things actually seemed at the time',
        'Evaluate decisions based on information available at the time',
        'Acknowledge the role of chance in outcomes'
      ],
      relatedBiases: ['outcome_bias', 'curse_of_knowledge']
    },
    {
      id: 'rosy_retrospection',
      name: 'Rosy Retrospection',
      category: 'Memory & Recall',
      definition: 'The tendency to remember past events as more positive than they actually were.',
      example: 'Remembering childhood summers as perfect and carefree, forgetting the boredom, conflicts, and discomforts.',
      howToSpot: [
        '"Things were better back then" without specific evidence',
        'Idealizing past relationships, jobs, or experiences',
        'Forgetting negative aspects of past situations',
        'Comparing idealized past to imperfect present'
      ],
      howToAvoid: [
        'Keep journals or records for accurate recall',
        'Try to remember specific negative experiences too',
        'Ask others who shared the experience for their memories',
        'Be skeptical of "golden age" narratives'
      ],
      relatedBiases: ['nostalgia_bias', 'declinism']
    },
    
    // === DECISION MAKING ===
    {
      id: 'sunk_cost_fallacy',
      name: 'Sunk Cost Fallacy',
      category: 'Decision Making',
      definition: 'The tendency to continue investing in something because of previously invested resources (time, money, effort) rather than future value.',
      example: 'Finishing a terrible movie because you already paid for the ticket, even though leaving would be a better use of time.',
      howToSpot: [
        '"I\'ve already put so much into this"',
        'Continuing failing projects to justify past investment',
        'Reluctance to change course despite poor results',
        'Escalating commitment to losing propositions'
      ],
      howToAvoid: [
        'Evaluate decisions based only on future costs and benefits',
        'Accept that past investments are gone regardless of future choices',
        'Ask "Would I start this today knowing what I know now?"',
        'Be willing to cut losses'
      ],
      relatedBiases: ['loss_aversion', 'escalation_of_commitment']
    },
    {
      id: 'framing_effect',
      name: 'Framing Effect',
      category: 'Decision Making',
      definition: 'The tendency to draw different conclusions from the same information depending on how it is presented.',
      example: 'Preferring "90% fat-free" over "10% fat" even though they describe identical products.',
      howToSpot: [
        'Same statistics presented positively vs. negatively yield different reactions',
        'Marketing using gains vs. losses framing',
        'News headlines that frame stories to elicit specific reactions',
        'Different decisions based on presentation, not substance'
      ],
      howToAvoid: [
        'Reframe information multiple ways before deciding',
        'Convert percentages to absolute numbers',
        'Ask how the opposite framing would sound',
        'Focus on the underlying facts, not the presentation'
      ],
      relatedBiases: ['anchoring_bias', 'loss_aversion']
    },
    {
      id: 'false_dichotomy',
      name: 'False Dichotomy',
      category: 'Decision Making',
      definition: 'Presenting a situation as having only two alternatives when more options exist.',
      example: '"You\'re either with us or against us" — ignoring neutral positions, partial agreement, or alternative approaches.',
      howToSpot: [
        '"Either/or" framing with no middle ground',
        'Forcing choices between extremes',
        'Ignoring nuance or compromise positions',
        '"If you\'re not X, you must be Y"'
      ],
      howToAvoid: [
        'Ask "What other options exist?"',
        'Look for middle ground or partial solutions',
        'Be suspicious of "only two choices" arguments',
        'Consider spectrum positions, not just endpoints'
      ],
      relatedBiases: ['black_and_white_thinking', 'oversimplification']
    },
    
    // === SELF-PERCEPTION ===
    {
      id: 'dunning_kruger',
      name: 'Dunning-Kruger Effect',
      category: 'Self-Perception',
      definition: 'The cognitive bias in which people with limited knowledge or competence in a domain overestimate their own abilities.',
      example: 'Someone who read one article about economics confidently explaining why all professional economists are wrong.',
      howToSpot: [
        'High confidence combined with limited expertise',
        'Dismissing expert consensus without deep knowledge',
        'Failure to recognize the complexity of a topic',
        'Overconfidence in simple solutions to complex problems'
      ],
      howToAvoid: [
        'The more you learn, the more you realize you don\'t know',
        'Seek feedback from genuine experts',
        'Study a field deeply before forming strong opinions',
        'Maintain intellectual humility'
      ],
      relatedBiases: ['overconfidence_bias', 'illusory_superiority']
    },
    {
      id: 'fundamental_attribution_error',
      name: 'Fundamental Attribution Error',
      category: 'Self-Perception',
      definition: 'The tendency to overemphasize personality-based explanations for others\' behavior while underemphasizing situational explanations.',
      example: 'Assuming someone who cut you off in traffic is a jerk, rather than considering they might be rushing to an emergency.',
      howToSpot: [
        'Judging others\' character from single actions',
        'Excusing own behavior with circumstances but not others\'',
        'Assuming negative behavior reflects who someone "really is"',
        'Ignoring context when evaluating others'
      ],
      howToAvoid: [
        'Consider situational factors before judging character',
        'Ask "What circumstances might explain this behavior?"',
        'Apply the same standards to yourself and others',
        'Remember that you don\'t know what others are experiencing'
      ],
      relatedBiases: ['actor_observer_bias', 'self_serving_bias']
    }
  ],
  
  /**
   * Get all biases
   */
  getAllBiases() {
    return this.biases;
  },
  
  /**
   * Get bias by ID
   */
  getBiasById(id) {
    return this.biases.find(b => b.id === id);
  },
  
  /**
   * Get biases by category
   */
  getBiasesByCategory(category) {
    return this.biases.filter(b => b.category === category);
  },
  
  /**
   * Get all categories
   */
  getCategories() {
    return [...new Set(this.biases.map(b => b.category))];
  },
  
  /**
   * Search biases
   */
  searchBiases(query) {
    query = query.toLowerCase();
    return this.biases.filter(b => 
      b.name.toLowerCase().includes(query) ||
      b.definition.toLowerCase().includes(query) ||
      b.example.toLowerCase().includes(query)
    );
  }
};

/**
 * Global function to close sidebar modal
 */
function closeSidebarModal() {
  const modal = document.getElementById('sidebarModal');
  if (modal) {
    modal.classList.remove('visible');
    document.body.style.overflow = '';
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SidebarActions = SidebarActions;
  window.BiasKnowledgeBase = BiasKnowledgeBase;
  window.closeSidebarModal = closeSidebarModal;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SidebarActions, BiasKnowledgeBase, closeSidebarModal };
}
