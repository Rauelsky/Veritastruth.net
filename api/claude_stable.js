/**
 * Vercel Serverless Function: Claude API Proxy
 * 
 * Purpose: Securely call Anthropic Claude API using VERITAS_DEV environment variable
 * Route: /api/claude
 * 
 * Environment Variables Required:
 * - VERITAS_DEV: Anthropic API key (set in Vercel dashboard)
 */

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variable
    const API_KEY = process.env.VERITAS_DEV;
    
    if (!API_KEY) {
        console.error('VERITAS_DEV environment variable not configured');
        return res.status(500).json({ 
            error: 'API key not configured',
            fallback: true 
        });
    }

    try {
        const { prompt, model, max_tokens, temperature } = req.body;

        // Validate required fields
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Call Anthropic API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model || 'claude-sonnet-4-20250514',
                max_tokens: max_tokens || 600,
                temperature: temperature || 0.7,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: 'Anthropic API error',
                details: errorText,
                fallback: true
            });
        }

        const data = await response.json();
        
        // Return the Anthropic response
        return res.status(200).json(data);

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            fallback: true
        });
    }
}
