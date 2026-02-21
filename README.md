# Atlas Cards

Static site that detects the visitor's country and renders cards from Google Sheets.

## Configure Google Sheets

Publish the Google Sheet to the web (File -> Share -> Publish to web) so CSV
export works without an API key.

Cards tab columns (header row required):

- title
- subtitle
- country (ISO-2 like US, AE, SE, or ALL)
- tag
- link

Hero tab columns:

- Column B: desktop image URL
- Column C: mobile image URL
- Column D: active flag (Y to use, N to ignore)

Partners tab columns:

- Column A: Name
- Column B: Desktop Logo
- Column C: Mobile Logo
- Column D: Active (Y to show)

Copy .env.example to .env and fill in:

- SHEET_ID (or SHEET_URL)
- SHEET_MODE (csv or api)
- CARDS_TAB, HERO_TAB, COUNTRIES_TAB, VENUES_TAB, COUNTRY_PICS_TAB, TESTIMONIALS_TAB, PARTNERS_TAB
- HERO_DESKTOP_COL, HERO_MOBILE_COL, HERO_ACTIVE_COL, HERO_ROTATION_MS
- GEO_ENDPOINT, REGISTER_URL
- SHEET_API_KEY (only required for api mode)

Generate app-config.js from .env (single source of truth):

- ./.venv/bin/python scripts/build-config.py

If no configuration is provided, the UI falls back to sample cards.

## Run locally

Use any static file server. For example:

- python -m http.server 5173

Then open http://localhost:5173.
