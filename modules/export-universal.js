/**
 * VERACITY v5.2 — Universal Export System
 * ========================================
 * 
 * Provides export/print functionality across all three tracks:
 * - Track A (Assess): Factual assessments
 * - Track B (Interview): Socratic conversations
 * - Track C (Navigate): Life guidance conversations
 * 
 * Supported Formats:
 * - PDF (professional, branded)
 * - JSON (machine-readable, complete data)
 * - Markdown (universal, portable)
 * - Print (browser print dialog)
 * 
 * Dependencies:
 * - jsPDF (https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js)
 * - jsPDF-AutoTable (https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js)
 * 
 * VERITAS LLC — Prairie du Sac, Wisconsin
 * https://veritastruth.net
 * 
 * 🖖 Live Long and Prosper
 */

const UniversalExport = {
  
  // Version info
  version: '5.2',
  
  // Brand colors
  colors: {
    primary: '#0d9488',      // Teal
    secondary: '#d4a853',    // Gold
    text: '#1a1a1a',
    textLight: '#6b7280',
    background: '#ffffff',
    accent: '#0891b2',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  
  // Logo paths (relative to site root)
  logos: {
    square: '/assets/-Veritas_Small_Square_copy.png',
    horizontal: '/assets/veritas-logo-horizontal.png'
  },
  
  /**
   * =============================================
   * MAIN EXPORT FUNCTION — ASSESSMENTS (Track A)
   * =============================================
   */
  async exportAssessment(config) {
    const { 
      type = 'pdf', 
      claim, 
      realityScore, 
      integrityScore,
      assessment,
      sections = {},
      sources = [],
      metadata = {}
    } = config;
    
    switch(type.toLowerCase()) {
      case 'pdf':
        return await this._generateAssessmentPDF(config);
      case 'json':
        return this._generateAssessmentJSON(config);
      case 'md':
      case 'markdown':
        return this._generateAssessmentMarkdown(config);
      default:
        console.error(`Unknown export type: ${type}`);
        return null;
    }
  },
  
  /**
   * =============================================
   * MAIN EXPORT FUNCTION — CONVERSATIONS (Track B/C)
   * =============================================
   */
  async exportConversation(config) {
    const {
      type = 'pdf',
      track = 'b',
      topic = '',
      messages = [],
      metadata = {}
    } = config;
    
    switch(type.toLowerCase()) {
      case 'pdf':
        return await this._generateConversationPDF(config);
      case 'json':
        return this._generateConversationJSON(config);
      case 'md':
      case 'markdown':
        return this._generateConversationMarkdown(config);
      default:
        console.error(`Unknown export type: ${type}`);
        return null;
    }
  },
  
  /**
   * =============================================
   * PRINT FUNCTION
   * =============================================
   */
  print(config) {
    const { 
      content, 
      title = 'Veracity Assessment',
      customCSS = ''
    } = config;
    
    if (!content) {
      console.error('No content provided for printing');
      return;
    }
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${this._escapeHtml(title)}</title>
        <style>
          /* Reset */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          /* Base styles */
          body {
            font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: ${this.colors.text};
            background: ${this.colors.background};
            padding: 0.5in;
          }
          
          /* Headers */
          h1, h2, h3, h4 {
            color: ${this.colors.primary};
            margin-bottom: 0.5em;
          }
          h1 { font-size: 18pt; border-bottom: 2px solid ${this.colors.primary}; padding-bottom: 0.3em; }
          h2 { font-size: 14pt; margin-top: 1em; }
          h3 { font-size: 12pt; margin-top: 0.8em; }
          
          /* Paragraphs and lists */
          p { margin-bottom: 0.8em; }
          ul, ol { margin-left: 1.5em; margin-bottom: 0.8em; }
          li { margin-bottom: 0.3em; }
          
          /* Scores */
          .score-display {
            display: inline-block;
            padding: 0.3em 0.8em;
            border-radius: 4px;
            font-weight: bold;
            margin-right: 1em;
          }
          .score-positive { background: #d1fae5; color: #065f46; }
          .score-neutral { background: #fef3c7; color: #92400e; }
          .score-negative { background: #fee2e2; color: #991b1b; }
          
          /* Blockquotes */
          blockquote {
            border-left: 4px solid ${this.colors.primary};
            padding-left: 1em;
            margin: 1em 0;
            font-style: italic;
            color: ${this.colors.textLight};
          }
          
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 0.5em;
            text-align: left;
          }
          th { background: #f3f4f6; font-weight: 600; }
          
          /* Print header/footer */
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1em;
            padding-bottom: 0.5em;
            border-bottom: 1px solid #e5e7eb;
          }
          .print-header h1 { border: none; margin: 0; padding: 0; }
          .print-meta { font-size: 9pt; color: ${this.colors.textLight}; }
          
          .print-footer {
            margin-top: 2em;
            padding-top: 0.5em;
            border-top: 1px solid #e5e7eb;
            font-size: 9pt;
            color: ${this.colors.textLight};
            text-align: center;
          }
          
          /* Hide elements not needed in print */
          .no-print { display: none !important; }
          
          /* Page break hints */
          .page-break { page-break-before: always; }
          
          /* Print-specific */
          @media print {
            @page {
              margin: 0.75in;
              size: letter;
            }
            body { padding: 0; }
            .print-header { position: running(header); }
          }
          
          /* Custom CSS */
          ${customCSS}
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>VERACITY™ Assessment</h1>
          <div class="print-meta">
            Generated: ${new Date().toLocaleDateString()}<br>
            Version: ${this.version}
          </div>
        </div>
        
        <main>
          ${typeof content === 'string' ? content : content.innerHTML}
        </main>
        
        <div class="print-footer">
          Generated by Veracity™ v${this.version} — VERITAS LLC<br>
          https://veritastruth.net — Truth • Clarity • Wisdom
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  },
  
  /**
   * =============================================
   * PDF GENERATION — ASSESSMENT
   * =============================================
   */
  async _generateAssessmentPDF(config) {
    const { 
      claim, 
      realityScore, 
      integrityScore,
      sections = {},
      sources = [],
      metadata = {}
    } = config;
    
    // Check for jsPDF
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      console.error('jsPDF library not loaded');
      alert('PDF export requires jsPDF library. Please ensure it is loaded.');
      return null;
    }
    
    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    
    // Helper: Add new page if needed
    const checkPageBreak = (requiredSpace = 100) => {
      if (y + requiredSpace > pageHeight - margin) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };
    
    // Helper: Draw text with word wrap
    const drawWrappedText = (text, x, startY, maxWidth, fontSize = 11, lineHeight = 1.4) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      let currentY = startY;
      
      for (const line of lines) {
        checkPageBreak(fontSize * lineHeight);
        doc.text(line, x, currentY);
        currentY += fontSize * lineHeight;
      }
      
      return currentY;
    };
    
    // ===== HEADER =====
    doc.setFillColor(13, 148, 136); // Teal
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VERACITY™ Assessment', margin, 40);
    
    // Subtitle
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Truth • Clarity • Wisdom', margin, 58);
    
    // Date & Version (right aligned)
    doc.setFontSize(10);
    const dateText = `Generated: ${new Date().toLocaleDateString()}`;
    const versionText = `Version: ${this.version} GS`;
    doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), 40);
    doc.text(versionText, pageWidth - margin - doc.getTextWidth(versionText), 55);
    
    y = 100;
    
    // ===== CLAIM SECTION =====
    doc.setTextColor(13, 148, 136);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Claim Assessed', margin, y);
    y += 20;
    
    // Claim box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const claimBoxHeight = Math.max(50, Math.ceil(claim.length / 80) * 18 + 20);
    doc.roundedRect(margin, y, contentWidth, claimBoxHeight, 5, 5, 'FD');
    
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    y = drawWrappedText(claim, margin + 15, y + 20, contentWidth - 30, 12);
    y += 25;
    
    // ===== SCORES SECTION =====
    checkPageBreak(100);
    
    doc.setTextColor(13, 148, 136);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Assessment Scores', margin, y);
    y += 25;
    
    // Reality Score
    const realityColor = this._getScoreColor(realityScore, 10);
    doc.setFillColor(...realityColor.rgb);
    doc.roundedRect(margin, y, 200, 50, 5, 5, 'F');
    
    doc.setTextColor(realityColor.text[0], realityColor.text[1], realityColor.text[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Reality Score', margin + 15, y + 18);
    
    doc.setFontSize(22);
    const scoreText = `${realityScore > 0 ? '+' : ''}${realityScore}/10`;
    doc.text(scoreText, margin + 15, y + 40);
    
    // Integrity Score
    if (integrityScore !== undefined) {
      const integrityColor = this._getScoreColor(integrityScore, 1);
      doc.setFillColor(...integrityColor.rgb);
      doc.roundedRect(margin + 220, y, 200, 50, 5, 5, 'F');
      
      doc.setTextColor(integrityColor.text[0], integrityColor.text[1], integrityColor.text[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Integrity Score', margin + 235, y + 18);
      
      doc.setFontSize(22);
      const intText = integrityScore.toFixed(2);
      doc.text(intText, margin + 235, y + 40);
    }
    
    y += 70;
    
    // ===== ASSESSMENT SECTIONS =====
    // Full section order matching the actual assessment structure
    const sectionOrder = [
      { key: 'selectedFactors', title: '📊 Reality Score Breakdown' },
      { key: 'underlyingReality', title: '🔍 The Underlying Reality' },
      { key: 'centralClaims', title: '🎯 Central Claims' },
      { key: 'frameworkAnalysis', title: '🧩 Framework Analysis' },
      { key: 'truthDistortionPatterns', title: '⚠️ Truth Distortion Patterns' },
      { key: 'evidenceAnalysis', title: '⚖️ Evidence Analysis' },
      { key: 'integrity', title: '🔬 Integrity Analysis' },
      { key: 'whatWeCanBeConfidentAbout', title: '✓ What We Can Be Confident About' },
      { key: 'whatRemainsUncertain', title: '? What Remains Uncertain' },
      { key: 'lessonsForAssessment', title: '💡 Lessons & Implications' },
      { key: 'methodologyNotes', title: '📋 Methodology Notes' },
      { key: 'plainTruth', title: '🎭 The Plain Truth' }
    ];
    
    for (const { key, title } of sectionOrder) {
      const rawContent = sections[key];
      if (!rawContent) continue;
      
      // Extract text from nested structures
      const content = this._extractSectionText(key, rawContent);
      if (!content) continue;
      
      checkPageBreak(80);
      
      // Section header
      doc.setTextColor(13, 148, 136);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, y);
      y += 5;
      
      // Underline
      doc.setDrawColor(13, 148, 136);
      doc.setLineWidth(1);
      doc.line(margin, y, margin + doc.getTextWidth(title), y);
      y += 15;
      
      // Content
      doc.setTextColor(26, 26, 26);
      doc.setFont('helvetica', 'normal');
      y = drawWrappedText(content, margin, y, contentWidth, 11);
      y += 15;
    }
    
    // ===== SOURCES =====
    if (sources && sources.length > 0) {
      checkPageBreak(80);
      
      doc.setTextColor(13, 148, 136);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Sources Referenced', margin, y);
      y += 20;
      
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      for (let i = 0; i < sources.length; i++) {
        checkPageBreak(20);
        const source = sources[i];
        const sourceText = typeof source === 'string' ? source : source.title || source.url;
        y = drawWrappedText(`${i + 1}. ${sourceText}`, margin + 10, y, contentWidth - 20, 10);
        y += 5;
      }
    }
    
    // ===== FOOTER =====
    const footerY = pageHeight - 30;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const footerText = 'Generated by Veracity™ — VERITAS LLC — https://veritastruth.net';
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, footerY);
    
    // ===== SAVE =====
    const filename = this._generateFilename('veracity-assessment', 'pdf');
    doc.save(filename);
    
    return filename;
  },
  
  /**
   * =============================================
   * PDF GENERATION — CONVERSATION
   * =============================================
   */
  async _generateConversationPDF(config) {
    const {
      track = 'b',
      topic = '',
      messages = [],
      metadata = {}
    } = config;
    
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      console.error('jsPDF library not loaded');
      alert('PDF export requires jsPDF library. Please ensure it is loaded.');
      return null;
    }
    
    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    
    const checkPageBreak = (requiredSpace = 100) => {
      if (y + requiredSpace > pageHeight - margin) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };
    
    const drawWrappedText = (text, x, startY, maxWidth, fontSize = 11, lineHeight = 1.4) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      let currentY = startY;
      
      for (const line of lines) {
        checkPageBreak(fontSize * lineHeight);
        doc.text(line, x, currentY);
        currentY += fontSize * lineHeight;
      }
      
      return currentY;
    };
    
    // Track info
    const trackInfo = {
      'b': { name: 'Interview', subtitle: 'Socratic Exploration', icon: '🎯' },
      'c': { name: 'Navigate', subtitle: 'Life Guidance', icon: '🧭' }
    };
    const info = trackInfo[track] || trackInfo['b'];
    
    // ===== HEADER =====
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`VERACITY™ ${info.name}`, margin, 40);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(info.subtitle, margin, 58);
    
    doc.setFontSize(10);
    const dateText = `Generated: ${new Date().toLocaleDateString()}`;
    doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), 40);
    
    y = 100;
    
    // ===== TOPIC =====
    if (topic) {
      doc.setTextColor(13, 148, 136);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Topic', margin, y);
      y += 20;
      
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      const topicBoxHeight = Math.max(40, Math.ceil(topic.length / 80) * 18 + 15);
      doc.roundedRect(margin, y, contentWidth, topicBoxHeight, 5, 5, 'FD');
      
      doc.setTextColor(26, 26, 26);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      y = drawWrappedText(topic, margin + 15, y + 18, contentWidth - 30, 11);
      y += 25;
    }
    
    // ===== CONVERSATION =====
    doc.setTextColor(13, 148, 136);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Conversation', margin, y);
    y += 25;
    
    for (const msg of messages) {
      checkPageBreak(60);
      
      const isUser = msg.role === 'user';
      const bgColor = isUser ? [241, 245, 249] : [240, 253, 250];
      const labelColor = isUser ? [71, 85, 105] : [13, 148, 136];
      const label = isUser ? 'You' : 'Veracity';
      
      // Message bubble
      doc.setFillColor(...bgColor);
      const msgHeight = Math.max(40, Math.ceil(msg.content.length / 70) * 16 + 30);
      doc.roundedRect(margin, y, contentWidth, msgHeight, 5, 5, 'F');
      
      // Label
      doc.setTextColor(...labelColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin + 12, y + 16);
      
      // Timestamp if available
      if (msg.timestamp) {
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(9);
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        doc.text(time, pageWidth - margin - 50, y + 16);
      }
      
      // Content
      doc.setTextColor(26, 26, 26);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      drawWrappedText(msg.content, margin + 12, y + 32, contentWidth - 24, 11);
      
      y += msgHeight + 10;
    }
    
    // ===== FOOTER =====
    const footerY = pageHeight - 30;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    const footerText = 'Generated by Veracity™ — VERITAS LLC — https://veritastruth.net';
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, footerY);
    
    // ===== SAVE =====
    const filename = this._generateFilename(`veracity-${info.name.toLowerCase()}`, 'pdf');
    doc.save(filename);
    
    return filename;
  },
  
  /**
   * =============================================
   * JSON GENERATION — ASSESSMENT
   * =============================================
   */
  _generateAssessmentJSON(config) {
    const {
      claim,
      realityScore,
      integrityScore,
      sections = {},
      sources = [],
      metadata = {}
    } = config;
    
    const data = {
      veracity_version: this.version,
      export_format_version: '1.0',
      export_timestamp: new Date().toISOString(),
      track: 'a',
      assessment: {
        claim: claim,
        scores: {
          reality: realityScore,
          integrity: integrityScore
        },
        sections: sections,
        sources: sources,
        metadata: {
          ...metadata,
          generated_by: 'Veracity Universal Export',
          generator_version: this.version
        }
      }
    };
    
    const json = JSON.stringify(data, null, 2);
    const filename = this._generateFilename('veracity-assessment', 'json');
    this._downloadFile(json, filename, 'application/json');
    
    return filename;
  },
  
  /**
   * =============================================
   * JSON GENERATION — CONVERSATION
   * =============================================
   */
  _generateConversationJSON(config) {
    const {
      track = 'b',
      topic = '',
      messages = [],
      metadata = {}
    } = config;
    
    const trackNames = { 'b': 'interview', 'c': 'navigate' };
    
    const data = {
      veracity_version: this.version,
      export_format_version: '1.0',
      export_timestamp: new Date().toISOString(),
      track: track,
      track_name: trackNames[track] || 'conversation',
      conversation: {
        topic: topic,
        message_count: messages.length,
        messages: messages.map((msg, index) => ({
          index: index,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp || null
        })),
        metadata: {
          ...metadata,
          generated_by: 'Veracity Universal Export',
          generator_version: this.version
        }
      }
    };
    
    const json = JSON.stringify(data, null, 2);
    const filename = this._generateFilename(`veracity-${trackNames[track] || 'conversation'}`, 'json');
    this._downloadFile(json, filename, 'application/json');
    
    return filename;
  },
  
  /**
   * =============================================
   * MARKDOWN GENERATION — ASSESSMENT
   * =============================================
   */
  _generateAssessmentMarkdown(config) {
    const {
      claim,
      realityScore,
      integrityScore,
      sections = {},
      sources = [],
      metadata = {}
    } = config;
    
    let md = `# Veracity Assessment\n\n`;
    md += `**Generated:** ${new Date().toLocaleDateString()}  \n`;
    md += `**Version:** ${this.version} GS  \n`;
    md += `**Track:** A - Factual Assessment\n\n`;
    md += `---\n\n`;
    
    // Claim
    md += `## Claim Assessed\n\n`;
    md += `> ${claim}\n\n`;
    
    // Scores
    md += `## Scores\n\n`;
    md += `- **Reality Score:** ${realityScore > 0 ? '+' : ''}${realityScore}/10\n`;
    if (integrityScore !== undefined) {
      md += `- **Integrity Score:** ${integrityScore.toFixed(2)}\n`;
    }
    md += `\n`;
    
    // Sections - using same structure as PDF
    const sectionOrder = [
      { key: 'selectedFactors', title: 'Reality Score Breakdown' },
      { key: 'underlyingReality', title: 'The Underlying Reality' },
      { key: 'centralClaims', title: 'Central Claims' },
      { key: 'frameworkAnalysis', title: 'Framework Analysis' },
      { key: 'truthDistortionPatterns', title: 'Truth Distortion Patterns' },
      { key: 'evidenceAnalysis', title: 'Evidence Analysis' },
      { key: 'integrity', title: 'Integrity Analysis' },
      { key: 'whatWeCanBeConfidentAbout', title: 'What We Can Be Confident About' },
      { key: 'whatRemainsUncertain', title: 'What Remains Uncertain' },
      { key: 'lessonsForAssessment', title: 'Lessons & Implications' },
      { key: 'methodologyNotes', title: 'Methodology Notes' },
      { key: 'plainTruth', title: 'The Plain Truth' }
    ];
    
    for (const { key, title } of sectionOrder) {
      const rawContent = sections[key];
      if (!rawContent) continue;
      
      // Extract text from nested structures
      const content = this._extractSectionText(key, rawContent);
      if (!content) continue;
      
      md += `## ${title}\n\n`;
      md += `${content}\n\n`;
    }
    
    // Sources
    if (sources && sources.length > 0) {
      md += `## Sources\n\n`;
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const sourceText = typeof source === 'string' ? source : source.title || source.url;
        md += `${i + 1}. ${sourceText}\n`;
      }
      md += `\n`;
    }
    
    // Footer
    md += `---\n\n`;
    md += `*Generated by Veracity™ v${this.version} — Truth Assessment Engine*  \n`;
    md += `*VERITAS LLC — https://veritastruth.net*\n`;
    
    const filename = this._generateFilename('veracity-assessment', 'md');
    this._downloadFile(md, filename, 'text/markdown');
    
    return filename;
  },
  
  /**
   * =============================================
   * MARKDOWN GENERATION — CONVERSATION
   * =============================================
   */
  _generateConversationMarkdown(config) {
    const {
      track = 'b',
      topic = '',
      messages = [],
      metadata = {}
    } = config;
    
    const trackInfo = {
      'b': { name: 'Interview', subtitle: 'Socratic Exploration' },
      'c': { name: 'Navigate', subtitle: 'Life Guidance' }
    };
    const info = trackInfo[track] || trackInfo['b'];
    
    let md = `# Veracity ${info.name}\n\n`;
    md += `**Generated:** ${new Date().toLocaleDateString()}  \n`;
    md += `**Version:** ${this.version}  \n`;
    md += `**Track:** ${track.toUpperCase()} - ${info.subtitle}\n\n`;
    md += `---\n\n`;
    
    // Topic
    if (topic) {
      md += `## Topic\n\n`;
      md += `> ${topic}\n\n`;
    }
    
    // Conversation
    md += `## Conversation\n\n`;
    
    for (const msg of messages) {
      const label = msg.role === 'user' ? '**You:**' : '**Veracity:**';
      const timestamp = msg.timestamp ? ` *(${new Date(msg.timestamp).toLocaleTimeString()})*` : '';
      
      md += `${label}${timestamp}\n\n`;
      md += `${msg.content}\n\n`;
      md += `---\n\n`;
    }
    
    // Footer
    md += `*Generated by Veracity™ v${this.version} — ${info.subtitle}*  \n`;
    md += `*VERITAS LLC — https://veritastruth.net*\n`;
    
    const filename = this._generateFilename(`veracity-${info.name.toLowerCase()}`, 'md');
    this._downloadFile(md, filename, 'text/markdown');
    
    return filename;
  },
  
  /**
   * =============================================
   * HELPER FUNCTIONS
   * =============================================
   */
  
  /**
   * Extract readable text from nested assessment structures
   * Handles objects, arrays, and primitives intelligently
   */
  _extractSectionText(key, data) {
    if (!data) return '';
    
    // If it's already a string, return it
    if (typeof data === 'string') return data;
    
    // If it's an array, format as bullet points
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return `• ${item}`;
        if (typeof item === 'object') {
          // Handle selectedFactors array items
          if (item.factor && item.explanation) {
            return `• ${item.factor} (Score: ${item.score}, Weight: ${item.weight})\n  ${item.explanation}`;
          }
          // Generic object in array
          return `• ${this._objectToText(item)}`;
        }
        return `• ${item}`;
      }).join('\n\n');
    }
    
    // Handle specific section structures
    switch(key) {
      case 'underlyingReality':
        return [
          data.coreFinding && `Core Finding: ${data.coreFinding}`,
          data.howWeKnow && `How We Know: ${data.howWeKnow}`,
          data.whyItMatters && `Why It Matters: ${data.whyItMatters}`
        ].filter(Boolean).join('\n\n');
        
      case 'centralClaims':
        return [
          data.explicit && `Explicit Claims: ${data.explicit}`,
          data.hidden && `Hidden Assumptions: ${data.hidden}`,
          data.whatFramingServes && `What This Framing Serves: ${data.whatFramingServes}`
        ].filter(Boolean).join('\n\n');
        
      case 'frameworkAnalysis':
        return [
          data.hiddenPremises && `Hidden Premises: ${data.hiddenPremises}`,
          data.ideologicalOrigin && `Ideological Origin: ${data.ideologicalOrigin}`,
          data.whatBeingObscured && `What's Being Obscured: ${data.whatBeingObscured}`,
          data.reframingNeeded && `Reframing Needed: ${data.reframingNeeded}`
        ].filter(Boolean).join('\n\n');
        
      case 'evidenceAnalysis':
        let evidenceText = [];
        if (data.forTheClaim && data.forTheClaim.length) {
          evidenceText.push(`Evidence FOR the claim:\n${data.forTheClaim.map(e => `• ${e}`).join('\n')}`);
        }
        if (data.againstTheClaim && data.againstTheClaim.length) {
          evidenceText.push(`Evidence AGAINST the claim:\n${data.againstTheClaim.map(e => `• ${e}`).join('\n')}`);
        }
        if (data.whatComplicatesIt) {
          evidenceText.push(`What Complicates It: ${data.whatComplicatesIt}`);
        }
        if (data.whatRemainsGenuinelyUncertain) {
          evidenceText.push(`Genuine Uncertainties: ${data.whatRemainsGenuinelyUncertain}`);
        }
        if (data.sourceQuality) {
          evidenceText.push(`Source Quality: ${data.sourceQuality}`);
        }
        return evidenceText.join('\n\n');
        
      case 'integrity':
        let integrityText = [];
        if (data.observable) {
          integrityText.push(`Observable Markers (Score: ${data.observable.score}):`);
          if (data.observable.sourcesCited) integrityText.push(`• Sources Cited: ${data.observable.sourcesCited} - ${data.observable.sourcesCitedEvidence || ''}`);
          if (data.observable.limitationsAcknowledged) integrityText.push(`• Limitations Acknowledged: ${data.observable.limitationsAcknowledged} - ${data.observable.limitationsEvidence || ''}`);
          if (data.observable.fallaciesPresent) integrityText.push(`• Fallacies Present: ${data.observable.fallaciesPresent} - ${data.observable.fallaciesEvidence || ''}`);
        }
        if (data.comparative) {
          integrityText.push(`\nComparative Analysis (Score: ${data.comparative.score}):`);
          if (data.comparative.baseline) integrityText.push(`• Baseline: ${data.comparative.baseline}`);
          if (data.comparative.gaps && data.comparative.gaps.length) {
            integrityText.push(`• Gaps: ${data.comparative.gaps.join('; ')}`);
          }
        }
        if (data.bias) {
          integrityText.push(`\nBias Analysis (Score: ${data.bias.score}):`);
          if (data.bias.inflammatoryLanguage) integrityText.push(`• Inflammatory Language: ${data.bias.inflammatoryLanguage}`);
          if (data.bias.oneSidedFraming) integrityText.push(`• One-Sided Framing: ${data.bias.oneSidedFraming}`);
        }
        return integrityText.join('\n');
        
      case 'plainTruth':
        return [
          data.historicalPattern && `Historical Pattern: ${data.historicalPattern}`,
          data.whatYouCanDo && `What You Can Do: ${data.whatYouCanDo}`
        ].filter(Boolean).join('\n\n');
        
      case 'methodologyNotes':
        return [
          data.realityScoreRationale && `Reality Score Rationale: ${data.realityScoreRationale}`,
          data.integrityScoreRationale && `Integrity Score Rationale: ${data.integrityScoreRationale}`
        ].filter(Boolean).join('\n\n');
        
      default:
        // Generic object handling
        return this._objectToText(data);
    }
  },
  
  /**
   * Convert a generic object to readable text
   */
  _objectToText(obj) {
    if (!obj || typeof obj !== 'object') return String(obj);
    
    return Object.entries(obj)
      .filter(([k, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        if (Array.isArray(v)) {
          return `${label}:\n${v.map(item => `  • ${typeof item === 'object' ? JSON.stringify(item) : item}`).join('\n')}`;
        }
        if (typeof v === 'object') {
          return `${label}: ${JSON.stringify(v)}`;
        }
        return `${label}: ${v}`;
      })
      .join('\n');
  },

  // Generate unique filename with timestamp
  _generateFilename(base, extension) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const random = Math.random().toString(36).substring(2, 6);
    return `${base}-${timestamp}-${random}.${extension}`;
  },
  
  // Download file helper
  _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
  
  // Escape HTML for safe insertion
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // Get color based on score
  _getScoreColor(score, maxScore) {
    const normalized = score / maxScore;
    
    if (normalized >= 0.6) {
      return {
        rgb: [209, 250, 229],  // Green background
        text: [6, 95, 70]      // Green text
      };
    } else if (normalized >= 0.2) {
      return {
        rgb: [254, 243, 199],  // Yellow background
        text: [146, 64, 14]    // Yellow text
      };
    } else if (normalized >= -0.2) {
      return {
        rgb: [243, 244, 246],  // Gray background
        text: [75, 85, 99]     // Gray text
      };
    } else {
      return {
        rgb: [254, 226, 226],  // Red background
        text: [153, 27, 27]    // Red text
      };
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.UniversalExport = UniversalExport;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UniversalExport;
}
