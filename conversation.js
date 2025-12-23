// conversation.js - VERITAS Track B Chat Interface
// Client-side logic for Understand & Explore conversations

const API_BASE = '/api';

// State
let conversationId = null;
let messages = [];
let isLoading = false;

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const modeSelect = document.getElementById('mode-select');
const modeBanner = document.getElementById('mode-banner');
const exportBtn = document.getElementById('export-btn');
const newBtn = document.getElementById('new-btn');
const menuBtn = document.getElementById('menu-btn');
const menuOverlay = document.getElementById('menu-overlay');
const menuClose = document.getElementById('menu-close');
const menuExport = document.getElementById('menu-export');
const menuNew = document.getElementById('menu-new');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    setupEventListeners();
    autoResizeTextarea();
    
    // Check for query parameters (from classification routing)
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    const initialMode = urlParams.get('mode');
    
    // Set mode if provided
    if (initialMode && ['standard', 'armor', 'mirror'].includes(initialMode)) {
        modeSelect.value = initialMode;
        handleModeChange();
    }
    
    // If we have an initial query and no existing messages, auto-populate and send
    if (initialQuery && messages.length === 0) {
        userInput.value = initialQuery;
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        // Auto-send after a brief delay for UI to render
        setTimeout(() => {
            sendMessage();
        }, 500);
    } else if (messages.length === 0) {
        // Show welcome only if no messages and no auto-send pending
        addWelcomeMessage();
    }
});

function setupEventListeners() {
    // Send message
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Mode change
    modeSelect.addEventListener('change', handleModeChange);
    
    // Actions
    exportBtn.addEventListener('click', exportConversation);
    newBtn.addEventListener('click', newConversation);
    
    // Mobile menu
    if (menuBtn) menuBtn.addEventListener('click', openMenu);
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) closeMenu();
    });
    if (menuExport) menuExport.addEventListener('click', () => {
        exportConversation();
        closeMenu();
    });
    if (menuNew) menuNew.addEventListener('click', () => {
        newConversation();
        closeMenu();
    });
    
    // Auto-resize textarea
    userInput.addEventListener('input', autoResizeTextarea);
}

function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
}

function addWelcomeMessage() {
    const welcomeText = `Welcome to VERITAS — Understand & Explore.

At VERITAS, we believe that understanding comes before judgment. This is a space to explore contested beliefs, examine different perspectives, and think more clearly together.

What question or belief would you like to explore?`;
    
    addMessage('assistant', welcomeText);
}

async function sendMessage() {
    const content = userInput.value.trim();
    if (!content || isLoading) return;
    
    // Add user message to UI
    addMessage('user', content);
    messages.push({ role: 'user', content });
    
    // Clear input
    userInput.value = '';
    autoResizeTextarea();
    
    // Disable send while loading
    isLoading = true;
    sendBtn.disabled = true;
    
    // Show typing indicator
    const typingId = showTyping();
    
    try {
        const response = await fetch(`${API_BASE}/conversation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversation_id: conversationId,
                messages: messages,
                mode: modeSelect.value,
                voice: 'default'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update conversation ID
        conversationId = data.conversation_id;
        
        // Remove typing indicator and add response
        removeTyping(typingId);
        addMessage('assistant', data.response);
        messages.push({ role: 'assistant', content: data.response });
        
        // Auto-save
        saveToStorage();
        
    } catch (error) {
        removeTyping(typingId);
        addMessage('system', 'Something went wrong. Please try again.');
        console.error('Send error:', error);
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function addMessage(role, content) {
    const bubble = document.createElement('div');
    bubble.className = `message ${role}`;
    bubble.innerHTML = formatMessage(content);
    chatContainer.appendChild(bubble);
    scrollToBottom();
}

function formatMessage(content) {
    // Convert line breaks to <p> tags for better formatting
    const paragraphs = content.split('\n\n');
    
    if (paragraphs.length > 1) {
        return paragraphs
            .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
            .join('');
    }
    
    // Single paragraph - just escape and handle line breaks
    return escapeHtml(content)
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTyping() {
    const id = 'typing-' + Date.now();
    const bubble = document.createElement('div');
    bubble.id = id;
    bubble.className = 'message assistant typing';
    bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatContainer.appendChild(bubble);
    scrollToBottom();
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleModeChange() {
    const mode = modeSelect.value;
    
    // Update banner
    modeBanner.className = `mode-banner ${mode}`;
    
    const modeConfig = {
        standard: { icon: '💬', text: 'Understand & Explore' },
        armor: { icon: '🛡️', text: 'Armor Mode' },
        mirror: { icon: '🪞', text: 'The Mirror' }
    };
    
    const config = modeConfig[mode] || modeConfig.standard;
    modeBanner.innerHTML = `
        <span class="mode-icon">${config.icon}</span>
        <span class="mode-text">${config.text}</span>
    `;
    
    // Save preference
    saveToStorage();
}

function saveToStorage() {
    const state = {
        conversationId,
        messages,
        mode: modeSelect.value,
        timestamp: new Date().toISOString()
    };
    try {
        localStorage.setItem('veritas_conversation', JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem('veritas_conversation');
        if (saved) {
            const state = JSON.parse(saved);
            conversationId = state.conversationId;
            messages = state.messages || [];
            
            if (state.mode && modeSelect) {
                modeSelect.value = state.mode;
                handleModeChange();
            }
            
            // Replay messages to UI (skip the first welcome if we have messages)
            messages.forEach(m => {
                addMessage(m.role, m.content);
            });
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
    }
}

function newConversation() {
    if (messages.length > 1) {
        if (!confirm('Start a new conversation? The current conversation will be cleared.')) {
            return;
        }
    }
    
    conversationId = null;
    messages = [];
    chatContainer.innerHTML = '';
    
    try {
        localStorage.removeItem('veritas_conversation');
    } catch (e) {
        console.warn('Could not clear localStorage:', e);
    }
    
    // Reset mode to standard
    modeSelect.value = 'standard';
    handleModeChange();
    
    addWelcomeMessage();
    userInput.focus();
}

function exportConversation() {
    if (messages.length === 0) {
        alert('No conversation to export.');
        return;
    }
    
    const modeLabels = {
        standard: 'Understand & Explore',
        armor: 'Armor Mode',
        mirror: 'The Mirror'
    };
    
    const header = `# VERITAS Conversation Export

**Date:** ${new Date().toLocaleString()}
**Mode:** ${modeLabels[modeSelect.value] || 'Standard'}
**Conversation ID:** ${conversationId || 'N/A'}

---

`;
    
    const content = messages.map(m => {
        const role = m.role === 'user' ? '**You:**' : '**VERITAS:**';
        return `${role}\n\n${m.content}\n`;
    }).join('\n---\n\n');
    
    const footer = `
---

*Exported from VERITAS — veritastruth.net*
*"Understanding before judgment."*
`;
    
    const fullContent = header + content + footer;
    
    // Create and download file
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-conversation-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Mobile menu functions
function openMenu() {
    if (menuOverlay) {
        menuOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeMenu() {
    if (menuOverlay) {
        menuOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Handle visibility change (save on tab switch/close)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveToStorage();
    }
});

// Save before page unload
window.addEventListener('beforeunload', () => {
    saveToStorage();
});
