# Atlas Cards

Static site that detects the visitor's country and renders cards from Google Sheets.

## Setup

1. **Get your Google Sheet URL** (must be published to web: File → Share → Publish to web).
2. **Edit `.env`** and add your sheet:
   ```
   SHEET_URL=https://docs.google.com/spreadsheets/d/<your-sheet-id>/edit?usp=sharing
   ```
3. **Generate config**:
   ```
   python scripts/build-config.py
   ```
4. **Run local server**:
   ```
   python -m http.server 5500
   ```
5. **Open browser**: http://localhost:5500

Hard refresh (Cmd+Shift+R) to see config changes.

## Google Sheet Tabs & Columns (Required)

**Hero** — rotating banner images
- Column B: Desktop image URL
- Column C: Mobile image URL
- Column D: Active (Y/N)

**Partners** — sponsor logos
- Column A: Name
- Column B: Desktop logo URL
- Column C: Mobile logo URL
- Column D: Active (Y/N)

**Countries** — registration by country
- Column A: Country name
- Column B: City count
- Column C: Date

**Venues** — event venue details
- Column A: Country
- Column B: City
- Column C: Venue name
- Column D: Date

**Country Pics** — user-submitted photos
- Column A: Country
- Column B: Image URL
- Column C: Active (Y/N)

**Testimonials** — impact stories
- Column A: Desktop media URL (image or YouTube link)
- Column B: Mobile media URL
- Column C: Quote/story text
- Column D: Author name
- Column E: Active (Y/N)

## Optional Configuration

Add these to `.env` if you need to override defaults:

```
SHEET_API_KEY=              # For Google Sheets API mode (leave blank for CSV)
HERO_ROTATION_MS=7000       # Milliseconds between hero image rotations
REGISTER_URL=               # Custom registration form URL
GEO_ENDPOINT=               # Custom geolocation service endpoint
HERO_TAB=Hero
COUNTRIES_TAB=Countries
VENUES_TAB=Venues
COUNTRY_PICS_TAB=Country Pics
TESTIMONIALS_TAB=Testimonials
PARTNERS_TAB=Partners
HERO_DESKTOP_COL=2
HERO_MOBILE_COL=3
HERO_ACTIVE_COL=4
```

Then rebuild: `python scripts/build-config.py`
