# VERACITY™ v5.0 - Deployment Package

## File Structure

```
/                           (root - main directory)
├── veracity.html           (main app - VERITAS theme)
├── logo-square.png         (VERITAS logo - YOU MUST ADD THIS)
├── README.md               (this file)
├── modules/                (JavaScript modules)
│   ├── classifier.js       (v1.1.0 - track classification)
│   ├── factoids.js         (v1.0.0 - educational content)
│   ├── microdiscovery.js   (v1.0.0 - discovery system)
│   ├── contextual.js       (v1.0.0 - contextual guidance)
│   ├── animations.js       (v1.0.0 - UI animations)
│   └── export.js           (v1.1.0 - session export)
└── docs/                   (documentation)
    └── VERACITY_V5_ARCHITECTURE.html (v1.5.0)
```

## Required Assets (NOT INCLUDED - Add These)

You need to add these files to the root directory:
- `logo-square.png` - VERITAS LLC logo (displayed in bottom-right corner)

## Deployment to Vercel

1. Push this folder structure to your GitHub repository
2. Connect the repo to Vercel
3. Access at: `yourdomain.com/veracity.html`
4. Link from your hero page "Try the Live Assessment" button

## Features

- **VERITAS Color Theme** - Blue/gold/purple/teal palette matching veritastruth.net
- **Geolocation Weather** - Automatically detects location and shows current weather
- **Responsive Design** - Adapts to desktop, tablet, and phone screens
- **Three-Track Classification** - Assess (A), Interview (B), Navigate (C)
- **Session Export** - Markdown, Text, and JSON formats
- **LCARS-inspired UI** - Star Trek aesthetic with functional controls

## Browser Requirements

- Modern browser with JavaScript enabled
- Geolocation permission (optional, falls back to IP-based location)

## Version

VERITAS v5.0 | VERACITY™ Clarity Companion
Built with 🖖 in Wisconsin

---
© 2025 VERITAS LLC - Prairie du Sac, WI
