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
    partners_tab = env.get("PARTNERS_TAB", "Partners")
    hero_desktop_col = env.get("HERO_DESKTOP_COL", "2")
    hero_mobile_col = env.get("HERO_MOBILE_COL", "3")
    hero_active_col = env.get("HERO_ACTIVE_COL", "4")

    output = (
        "window.APP_CONFIG = {\n"
        f"  sheetId: \"{sheet_id}\",\n"
        f"  sheetUrl: \"{sheet_url}\",\n"
        f"  sheetMode: \"{sheet_mode}\",\n"
        f"  range: \"{sheet_range}\",\n"
        f"  apiKey: \"{api_key}\",\n"
        f"  cardsTab: \"{cards_tab}\",\n"
        f"  heroTab: \"{hero_tab}\",\n"
        f"  partnersTab: \"{partners_tab}\",\n"
        f"  heroDesktopCol: \"{hero_desktop_col}\",\n"
        f"  heroMobileCol: \"{hero_mobile_col}\",\n"
        f"  heroActiveCol: \"{hero_active_col}\",\n"
        "};\n"
    )
    OUTPUT_PATH.write_text(output, encoding="utf-8")


if __name__ == "__main__":
    main()
