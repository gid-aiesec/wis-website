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
- Local files from:
   - `images/Hero/Desktop/`
   - `images/Hero/Mobile/`
- Use matching filenames in both folders (example: `1.jpeg`, `2.jpeg`).

**Partners** — sponsor logos
- Column A: Name
- Column B: Logo URL
- Column C: Website URL
- Column D: Active (Y/N)

**Countries** — registration by country
- Column A: Country name
- Column B: City count
- Column C: Date

**PreviousEvents** — past event cards
- Column A: Image URL
- Column B: Title
- Column C: Location

**UpcomingEvents** — upcoming event list
- Column A: Title
- Column B: Date
- Column C: Location

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

**Newsletter** — subscriber emails
- Column A: Email
- Column B: Submitted timestamp (optional, if your endpoint writes it)

**Collaborate** — partner inquiries
- Column A: First Name
- Column B: Last Name
- Column C: Company/Institution
- Column D: Email
- Column E: Subject
- Column F: Message
- Column G: Submitted timestamp

## Newsletter Subscribe Setup

The `Subscribe to Newsletter` button asks for an email and sends it using one of the modes below.

1. In `.env`, keep:
   - `NEWSLETTER_TAB=Newsletter`
   - `COLLABORATE_TAB=Collaborate`
2. Choose one sending mode:

   **Option A — Apps Script / webhook endpoint**
   - `NEWSLETTER_ENDPOINT=<your-webhook-or-apps-script-url>`
   - `COLLABORATE_ENDPOINT=<your-webhook-or-apps-script-url>`

   **Option B — Google Form direct submit**
   - `NEWSLETTER_FORM_URL=https://docs.google.com/forms/d/e/<FORM_ID>/formResponse`
   - `NEWSLETTER_FORM_EMAIL_FIELD=entry.123456789`

   To get `entry.123456789`: open your Google Form, inspect the email input `name` attribute.
2. Rebuild config:
   - `python scripts/build-config.py`

`NEWSLETTER_ENDPOINT` should append the incoming email into the `Newsletter` tab in your Google Sheet.
If using Google Form mode, connect the Form responses to your sheet.


Then rebuild: `python scripts/build-config.py`
