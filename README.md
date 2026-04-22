# PEOPLE-WEB (Static Deployment)

This repository contains the **static deployment** for the People platform website and admin panel.

## What’s inside

- **Main site**: marketing/landing pages (People App–focused)
  - `index.html`, `about.html`, `services.html`, `contact.html`, `terms.html`, `privacy.html`, `refund.html`
  - APK download: `People-version-9.apk` (linked from the homepage)
- **Admin panel**: pre-built React SPA hosted under `/admin`
  - Routes work under subpath (`/admin/login`, `/admin/dashboard`, etc.)
  - Includes:
    - user details modal improvements
    - `/debug` tool for admin/backend diagnostics
    - Analyze tab (UI) wired to metrics endpoint (requires backend route)
- **Debug page**: static diagnostics under `/debug`

## Deployment

Upload the contents of this repository to your static hosting (Apache recommended).

Key paths:
- `/` → main site
- `/admin/login` → admin login
- `/debug` → debug tool

## Notes

- The admin panel calls the backend API configured in the frontend bundle (with optional localStorage overrides).
- Metrics endpoint `GET /api/admin/metrics/summary` must exist on the backend (or be proxied) for Analyze to show data.

