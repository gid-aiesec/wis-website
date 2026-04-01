const runtimeConfig = window.APP_CONFIG || {};

function extractSheetId(sheetUrl) {
  if (!sheetUrl) {
    return "";
  }
  const marker = "/d/";
  if (!sheetUrl.includes(marker)) {
    return sheetUrl;
  }
  const remainder = sheetUrl.split(marker)[1];
  return remainder.split("/")[0];
}

const EVENTS_CONFIG = {
  sheetId: runtimeConfig.sheetId || extractSheetId(runtimeConfig.sheetUrl || ""),
  previousEventsTab: runtimeConfig.previousEventsTab || "PreviousEvents",
  upcomingEventsTab: runtimeConfig.upcomingEventsTab || "UpcomingEvents",
};

const previousEventsGridEl = document.getElementById("previous-events-grid");
const upcomingEventsGridEl = document.getElementById("upcoming-events-grid");
const siteNavEl = document.querySelector(".site-nav");
const navToggleEl = document.querySelector("[data-nav-toggle]");
const navMenuEl = document.querySelector("[data-nav-menu]");

function setupMobileNav() {
  if (!siteNavEl || !navToggleEl || !navMenuEl) {
    return;
  }

  const closeMenu = () => {
    siteNavEl.classList.remove("is-open");
    navToggleEl.setAttribute("aria-expanded", "false");
  };

  navToggleEl.addEventListener("click", () => {
    const isOpen = siteNavEl.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
      return;
    }
    siteNavEl.classList.add("is-open");
    navToggleEl.setAttribute("aria-expanded", "true");
  });

  for (const link of navMenuEl.querySelectorAll("a")) {
    link.addEventListener("click", closeMenu);
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

function buildCsvUrl(sheetId, tabName) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

async function fetchCsvRows(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("CSV fetch failed");
  }
  const text = await response.text();
  return parseCsv(text);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(current);
      current = "";
      continue;
    }

    if (char === "\n") {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }

  return rows.filter((item) => item.some((cell) => String(cell || "").trim().length));
}

function parsePreviousEvents(rows) {
  if (!rows.length) {
    return [];
  }

  return rows
    .slice(1)
    .map((row) => ({
      imageUrl: convertDriveUrl((row[0] || "").trim()),
      title: (row[1] || "").trim(),
      location: (row[2] || "").trim(),
    }))
    .filter((item) => item.imageUrl || item.title || item.location);
}

function convertDriveUrl(url) {
  if (!url) {
    return "";
  }

  const patterns = [/\/d\/([a-zA-Z0-9-_]+)/, /[?&]id=([a-zA-Z0-9-_]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const driveUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
      return `https://images.weserv.nl/?url=${encodeURIComponent(driveUrl)}`;
    }
  }

  return url;
}

function parseUpcomingEvents(rows) {
  if (!rows.length) {
    return [];
  }

  return rows.slice(1).map((row) => ({
    title: (row[0] || "").trim(),
    date: (row[1] || "").trim(),
    location: (row[2] || "").trim(),
  })).filter((item) => item.title || item.date || item.location);
}

function renderEmptyMessage(targetEl, message) {
  if (!targetEl) {
    return;
  }
  const empty = document.createElement("p");
  empty.className = "events-empty";
  empty.textContent = message;
  targetEl.appendChild(empty);
}

function renderPreviousEvents(entries) {
  if (!previousEventsGridEl) {
    return;
  }

  previousEventsGridEl.innerHTML = "";
  if (!entries.length) {
    renderEmptyMessage(previousEventsGridEl, "Previous events will appear here soon.");
    return;
  }

  for (const entry of entries) {
    const card = document.createElement("article");
    card.className = "event-card event-card-previous";

    if (entry.imageUrl) {
      const image = document.createElement("img");
      image.className = "event-card-image";
      image.src = entry.imageUrl;
      image.alt = entry.title ? `${entry.title} event` : "Previous event";
      image.loading = "lazy";
      card.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "event-card-body";

    const title = document.createElement("h3");
    title.className = "event-card-title";
    title.textContent = entry.title || "Untitled event";
    body.appendChild(title);

    const location = document.createElement("p");
    location.className = "event-card-meta";
    location.textContent = entry.location || "Location TBA";
    body.appendChild(location);

    card.appendChild(body);
    previousEventsGridEl.appendChild(card);
  }
}

function renderUpcomingEvents(entries) {
  if (!upcomingEventsGridEl) {
    return;
  }

  upcomingEventsGridEl.innerHTML = "";
  if (!entries.length) {
    renderEmptyMessage(upcomingEventsGridEl, "Upcoming events will be announced soon.");
    return;
  }

  for (const entry of entries) {
    const card = document.createElement("article");
    card.className = "event-card event-card-upcoming";

    const body = document.createElement("div");
    body.className = "event-card-body";

    const title = document.createElement("h3");
    title.className = "event-card-title";
    title.textContent = entry.title || "Upcoming event";

    const date = createEventMetaRow("📅", entry.date || "TBA");
    const location = createEventMetaRow("📍", entry.location || "TBA");

    body.appendChild(title);
    body.appendChild(date);
    body.appendChild(location);
    card.appendChild(body);
    upcomingEventsGridEl.appendChild(card);
  }
}

function createEventMetaRow(icon, value) {
  const row = document.createElement("p");
  row.className = "event-card-meta event-card-meta-row";

  const iconEl = document.createElement("span");
  iconEl.className = "event-meta-icon";
  iconEl.textContent = icon;
  iconEl.setAttribute("aria-hidden", "true");

  const textEl = document.createElement("span");
  textEl.className = "event-meta-text";
  textEl.textContent = value;

  row.appendChild(iconEl);
  row.appendChild(textEl);
  return row;
}

async function initEventsPage() {
  setupMobileNav();

  if (!EVENTS_CONFIG.sheetId) {
    renderEmptyMessage(previousEventsGridEl, "Missing Google Sheet configuration.");
    renderEmptyMessage(upcomingEventsGridEl, "Missing Google Sheet configuration.");
    return;
  }

  const [previousRows, upcomingRows] = await Promise.all([
    fetchCsvRows(buildCsvUrl(EVENTS_CONFIG.sheetId, EVENTS_CONFIG.previousEventsTab)).catch(() => []),
    fetchCsvRows(buildCsvUrl(EVENTS_CONFIG.sheetId, EVENTS_CONFIG.upcomingEventsTab)).catch(() => []),
  ]);

  renderPreviousEvents(parsePreviousEvents(previousRows));
  renderUpcomingEvents(parseUpcomingEvents(upcomingRows));
}

initEventsPage();
