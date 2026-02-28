from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
OUTPUT_PATH = ROOT / "app-config.js"

def read_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        env[key.strip()] = value.strip().strip("\"").strip("'")
    return env


def extract_sheet_id(sheet_url: str) -> str:
    marker = "/d/"
    if marker not in sheet_url:
        return sheet_url
    remainder = sheet_url.split(marker, 1)[1]
    return remainder.split("/", 1)[0]


def main() -> None:
    env = read_env(ENV_PATH)
    sheet_id = env.get("SHEET_ID", "")
    sheet_url = env.get("SHEET_URL", "")
    if not sheet_id and sheet_url:
        sheet_id = extract_sheet_id(sheet_url)

    sheet_range = env.get("SHEET_RANGE", "Sheet1!A:E")
    sheet_mode = env.get("SHEET_MODE", "csv")
    api_key = env.get("SHEET_API_KEY", "")
    cards_tab = env.get("CARDS_TAB", "Cards")
    hero_tab = env.get("HERO_TAB", "Hero")
    countries_tab = env.get("COUNTRIES_TAB", "Countries")
    venues_tab = env.get("VENUES_TAB", "Venues")
    country_pics_tab = env.get("COUNTRY_PICS_TAB", "Country Pics")
    testimonials_tab = env.get("TESTIMONIALS_TAB", "Testimonials")
    partners_tab = env.get("PARTNERS_TAB", "Partners")
    newsletter_tab = env.get("NEWSLETTER_TAB", "Newsletter")
    hero_desktop_col = env.get("HERO_DESKTOP_COL", "2")
    hero_mobile_col = env.get("HERO_MOBILE_COL", "3")
    hero_active_col = env.get("HERO_ACTIVE_COL", "4")
    hero_rotation_ms = env.get("HERO_ROTATION_MS", "7000")
    geo_endpoint = env.get("GEO_ENDPOINT", "https://ipapi.co/json/")
    register_url = env.get(
        "REGISTER_URL",
        "https://docs.google.com/forms/d/e/1FAIpQLSectYAdjAU05va9eshykh6h8LgGKeG7d-Hm190bpSbz3l7EJQ/viewform",
    )
    newsletter_endpoint = env.get("NEWSLETTER_ENDPOINT", "")
    newsletter_form_url = env.get("NEWSLETTER_FORM_URL", "")
    newsletter_form_first_name_field = env.get("NEWSLETTER_FORM_FIRST_NAME_FIELD", "")
    newsletter_form_last_name_field = env.get("NEWSLETTER_FORM_LAST_NAME_FIELD", "")
    newsletter_form_country_field = env.get("NEWSLETTER_FORM_COUNTRY_FIELD", "")
    newsletter_form_email_field = env.get("NEWSLETTER_FORM_EMAIL_FIELD", "")

    output = (
        "window.APP_CONFIG = {\n"
        f"  sheetId: \"{sheet_id}\",\n"
        f"  sheetUrl: \"{sheet_url}\",\n"
        f"  sheetMode: \"{sheet_mode}\",\n"
        f"  range: \"{sheet_range}\",\n"
        f"  apiKey: \"{api_key}\",\n"
        f"  cardsTab: \"{cards_tab}\",\n"
        f"  heroTab: \"{hero_tab}\",\n"
        f"  countriesTab: \"{countries_tab}\",\n"
        f"  venuesTab: \"{venues_tab}\",\n"
        f"  countryPicsTab: \"{country_pics_tab}\",\n"
        f"  testimonialsTab: \"{testimonials_tab}\",\n"
        f"  partnersTab: \"{partners_tab}\",\n"
        f"  newsletterTab: \"{newsletter_tab}\",\n"
        f"  heroDesktopCol: \"{hero_desktop_col}\",\n"
        f"  heroMobileCol: \"{hero_mobile_col}\",\n"
        f"  heroActiveCol: \"{hero_active_col}\",\n"
        f"  heroRotationMs: \"{hero_rotation_ms}\",\n"
        f"  geoEndpoint: \"{geo_endpoint}\",\n"
        f"  registerUrl: \"{register_url}\",\n"
        f"  newsletterEndpoint: \"{newsletter_endpoint}\",\n"
        f"  newsletterFormUrl: \"{newsletter_form_url}\",\n"
        f"  newsletterFormFirstNameField: \"{newsletter_form_first_name_field}\",\n"
        f"  newsletterFormLastNameField: \"{newsletter_form_last_name_field}\",\n"
        f"  newsletterFormCountryField: \"{newsletter_form_country_field}\",\n"
        f"  newsletterFormEmailField: \"{newsletter_form_email_field}\",\n"
        "};\n"
    )
    OUTPUT_PATH.write_text(output, encoding="utf-8")


if __name__ == "__main__":
    main()
