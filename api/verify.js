
Skip to content
Navigation Menu
Rauelsky
Veritastruth.net

    Code
    Issues
    Pull requests
    Actions
    Projects
    Wiki
    Security 2
    Insights
    Settings

    Veritastruth.net/api

/
in
main

Indent mode
Indent size
Line wrap mode
Editing verify_enhanced.js file contents
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
const Anthropic = require('@anthropic-ai/sdk');

// ============================================
// RATE LIMITING (5 free per day per IP)
// ============================================
const rateLimitMap = new Map();
const FREE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

function getRateLimitKey(req) {
    var ip = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
    return 'rate:' + ip;
}

function checkRateLimit(key) {
    var now = Date.now();
    var record = rateLimitMap.get(key);
    if (!record || (now - record.windowStart) > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: FREE_LIMIT - 1 };
    }
    if (record.count >= FREE_LIMIT) {
        return { allowed: false, remaining: 0, resetAt: new Date(record.windowStart + RATE_LIMIT_WINDOW).toISOString() };
    }
    record.count++;
    return { allowed: true, remaining: FREE_LIMIT - record.count };
}

// ============================================
// PROMPT BUILDER - THE UNCHAINED SECOND PHILOSOPHER
// ============================================
function buildPrompt(question, articleText, track, claimType, initialAssessment) {
    var now = new Date();
    var currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 

Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
 
Editing Veritastruth.net/api/verify_enhanced.js at main · Rauelsky/Veritastruth.net
