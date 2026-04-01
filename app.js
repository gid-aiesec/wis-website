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

const SHEET_CONFIG = {
  sheetId: runtimeConfig.sheetId || extractSheetId(runtimeConfig.sheetUrl || ""),
  sheetMode: runtimeConfig.sheetMode || "csv",
  apiKey: runtimeConfig.apiKey || "",
  heroTab: runtimeConfig.heroTab || "Hero",
  featuredEventsTab: runtimeConfig.featuredEventsTab || "FeaturedEvents",
  countriesTab: runtimeConfig.countriesTab || "Countries",
  venuesTab: runtimeConfig.venuesTab || "Venues",
  countryPicsTab: runtimeConfig.countryPicsTab || "Country Pics",
  testimonialsTab: runtimeConfig.testimonialsTab || "Testimonials",
  partnersTab: runtimeConfig.partnersTab || "Partners",
  newsletterTab: runtimeConfig.newsletterTab || "Newsletter",
  heroDesktopCol: Number.parseInt(runtimeConfig.heroDesktopCol ?? "2", 10),
  heroMobileCol: Number.parseInt(runtimeConfig.heroMobileCol ?? "3", 10),
  heroActiveCol: Number.parseInt(runtimeConfig.heroActiveCol ?? "4", 10),
  heroRotationMs: Number.parseInt(runtimeConfig.heroRotationMs ?? "7000", 10),
};
const GEO_CONFIG = {
  endpoint: runtimeConfig.geoEndpoint || "https://ipapi.co/json/",
};
const REGISTER_URL =
  runtimeConfig.registerUrl ||
  "https://docs.google.com/forms/d/e/1FAIpQLSectYAdjAU05va9eshykh6h8LgGKeG7d-Hm190bpSbz3l7EJQ/viewform";
const NEWSLETTER_ENDPOINT = runtimeConfig.newsletterEndpoint || "";
const NEWSLETTER_FORM_URL = runtimeConfig.newsletterFormUrl || "";
const NEWSLETTER_FORM_FIRST_NAME_FIELD = runtimeConfig.newsletterFormFirstNameField || "";
const NEWSLETTER_FORM_LAST_NAME_FIELD = runtimeConfig.newsletterFormLastNameField || "";
const NEWSLETTER_FORM_COUNTRY_FIELD = runtimeConfig.newsletterFormCountryField || "";
const NEWSLETTER_FORM_EMAIL_FIELD = runtimeConfig.newsletterFormEmailField || "";
const HERO_IMAGE_DIRS = {
  desktop: "images/Hero/Desktop/",
  mobile: "images/Hero/Mobile/",
};
const heroVisualEl = document.getElementById("hero-visual");
const heroImageEl = document.getElementById("hero-image");
const heroSourceEl = document.getElementById("hero-source");
const featuredEventsSectionEl = document.getElementById("events");
const featuredEventsGridEl = document.getElementById("featured-events-grid");
const countryPrimaryGridEl = document.getElementById("country-grid-primary");
const countryAllGridEl = document.getElementById("country-grid-all");
const countryMoreEl = document.getElementById("country-more");
const countryPicsTitleEl = document.getElementById("country-pics-title");
const countryPicsGridEl = document.getElementById("country-pics-grid");
const testimonialsSectionEl = document.getElementById("testimonials-section");
const testimonialTrackEl = document.getElementById("testimonial-track");
const testimonialDotsEl = document.getElementById("testimonial-dots");
const testimonialPrevEl = document.querySelector("[data-carousel-prev]");
const testimonialNextEl = document.querySelector("[data-carousel-next]");
const partnersSectionEl = document.getElementById("partners-section");
const partnersGridEl = document.getElementById("partners-grid");
const impactSectionEl = document.querySelector(".impact-section");
const impactValueEls = Array.from(document.querySelectorAll(".impact-value"));
const venueModalEl = document.getElementById("venue-modal");
const venueTitleEl = document.getElementById("venue-title");
const venueListEl = document.getElementById("venue-list");
const newsletterButtonEl = document.querySelector("[data-newsletter-subscribe]");
const newsletterModalEl = document.getElementById("newsletter-modal");
const newsletterFormEl = document.getElementById("newsletter-form");
const newsletterFirstNameEl = document.getElementById("newsletter-first-name");
const newsletterLastNameEl = document.getElementById("newsletter-last-name");
const newsletterCountryEl = document.getElementById("newsletter-country");
const newsletterEmailEl = document.getElementById("newsletter-email");
const newsletterStatusEl = document.getElementById("newsletter-status");
const newsletterSubmitEl = document.getElementById("newsletter-submit");
const newsletterCloseEls = document.querySelectorAll("[data-close-newsletter]");
const newsletterSuccessEl = document.getElementById("newsletter-success");
const newsletterSuccessCloseEl = document.getElementById("newsletter-success-close");
const venueCloseEls = document.querySelectorAll("[data-close-modal]");
const registerLinkEls = document.querySelectorAll("[data-register-link]");
const siteNavEl = document.querySelector(".site-nav");
const navToggleEl = document.querySelector("[data-nav-toggle]");
const navMenuEl = document.querySelector("[data-nav-menu]");
let venueEntries = [];
let testimonialAutoTimer = null;
let newsletterSubmitting = false;
let newsletterSuccessTimer = null;

function isValidEmail(value) {
  if (!value) {
    return false;
  }
  const candidate = String(value).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate);
}

async function submitNewsletterEmail(firstName, lastName, country, email) {
  const payload = {
    firstName,
    lastName,
    country,
    email,
    tab: SHEET_CONFIG.newsletterTab,
    submittedAt: new Date().toISOString(),
  };

  if (NEWSLETTER_ENDPOINT) {
    const jsonBody = JSON.stringify(payload);
    const formBody = new URLSearchParams(payload).toString();
    const attempts = [
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonBody,
      },
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: formBody,
      },
    ];

    let lastError = new Error("Newsletter signup failed.");

    for (const requestInit of attempts) {
      try {
        const response = await fetch(NEWSLETTER_ENDPOINT, requestInit);
        if (!response.ok) {
          throw new Error("Newsletter signup failed.");
        }

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const result = await response.json();
          if (result && result.ok === false) {
            throw new Error(result.error || "Newsletter signup failed.");
          }
        }

        return;
      } catch (error) {
        lastError = error;
      }
    }

    await submitGoogleForm(NEWSLETTER_ENDPOINT, payload);
    return;
  }

  if (
    NEWSLETTER_FORM_URL &&
    NEWSLETTER_FORM_FIRST_NAME_FIELD &&
    NEWSLETTER_FORM_LAST_NAME_FIELD &&
    NEWSLETTER_FORM_COUNTRY_FIELD &&
    NEWSLETTER_FORM_EMAIL_FIELD
  ) {
    const formPayload = {
      [NEWSLETTER_FORM_FIRST_NAME_FIELD]: firstName,
      [NEWSLETTER_FORM_LAST_NAME_FIELD]: lastName,
      [NEWSLETTER_FORM_COUNTRY_FIELD]: country,
      [NEWSLETTER_FORM_EMAIL_FIELD]: email,
    };

    await submitGoogleForm(NEWSLETTER_FORM_URL, formPayload);
    return;
  }

  throw new Error("Newsletter endpoint is not configured.");
}

function submitGoogleForm(formUrl, fields) {
  return new Promise((resolve) => {
    const frameName = `newsletter-submit-${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = frameName;
    iframe.style.display = "none";

    const form = document.createElement("form");
    form.method = "POST";
    form.action = formUrl;
    form.target = frameName;
    form.style.display = "none";

    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();

    window.setTimeout(() => {
      form.remove();
      iframe.remove();
      resolve();
    }, 900);
  });
}

function setNewsletterStatus(message, type = "") {
  if (!newsletterStatusEl) {
    return;
  }

  newsletterStatusEl.textContent = message;
  newsletterStatusEl.classList.remove("is-success", "is-error");
  if (type) {
    newsletterStatusEl.classList.add(type);
  }
}

function openNewsletterModal() {
  if (!newsletterModalEl) {
    return;
  }

  newsletterModalEl.classList.add("is-open");
  newsletterModalEl.setAttribute("aria-hidden", "false");
  setNewsletterStatus("");
  window.setTimeout(() => {
    newsletterFirstNameEl?.focus();
  }, 0);
}

function closeNewsletterModal() {
  if (!newsletterModalEl) {
    return;
  }

  newsletterModalEl.classList.remove("is-open");
  newsletterModalEl.setAttribute("aria-hidden", "true");
}

function showNewsletterSuccessPopup() {
  if (!newsletterSuccessEl) {
    return;
  }

  newsletterSuccessEl.classList.add("is-open");
  newsletterSuccessEl.setAttribute("aria-hidden", "false");

  if (newsletterSuccessTimer) {
    window.clearTimeout(newsletterSuccessTimer);
  }

  newsletterSuccessTimer = window.setTimeout(() => {
    closeNewsletterSuccessPopup();
  }, 1800);
}

function closeNewsletterSuccessPopup() {
  if (!newsletterSuccessEl) {
    return;
  }

  newsletterSuccessEl.classList.remove("is-open");
  newsletterSuccessEl.setAttribute("aria-hidden", "true");
}

function setupNewsletterSubscribe() {
  if (
    !newsletterButtonEl ||
    !newsletterModalEl ||
    !newsletterFormEl ||
    !newsletterFirstNameEl ||
    !newsletterLastNameEl ||
    !newsletterCountryEl ||
    !newsletterEmailEl
  ) {
    return;
  }

  newsletterButtonEl.addEventListener("click", openNewsletterModal);

  for (const button of newsletterCloseEls) {
    button.addEventListener("click", closeNewsletterModal);
  }

  if (newsletterSuccessCloseEl) {
    newsletterSuccessCloseEl.addEventListener("click", closeNewsletterSuccessPopup);
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNewsletterModal();
      closeNewsletterSuccessPopup();
    }
  });

  newsletterFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (newsletterSubmitting) {
      return;
    }

    const firstName = newsletterFirstNameEl.value.trim();
    const lastName = newsletterLastNameEl.value.trim();
    const country = newsletterCountryEl.value.trim();
    const email = newsletterEmailEl.value.trim();

    if (!firstName || !lastName) {
      setNewsletterStatus("Please enter your first and last name.", "is-error");
      if (!firstName) {
        newsletterFirstNameEl.focus();
      } else {
        newsletterLastNameEl.focus();
      }
      return;
    }

    if (!country) {
      setNewsletterStatus("Please select your country.", "is-error");
      newsletterCountryEl.focus();
      return;
    }

    if (!isValidEmail(email)) {
      setNewsletterStatus("Please enter a valid email address.", "is-error");
      newsletterEmailEl.focus();
      return;
    }

    if (
      !NEWSLETTER_ENDPOINT &&
      !(
        NEWSLETTER_FORM_URL &&
        NEWSLETTER_FORM_FIRST_NAME_FIELD &&
        NEWSLETTER_FORM_LAST_NAME_FIELD &&
        NEWSLETTER_FORM_COUNTRY_FIELD &&
        NEWSLETTER_FORM_EMAIL_FIELD
      )
    ) {
      setNewsletterStatus(
        "Subscription is not configured yet. Add endpoint or all Google Form field settings.",
        "is-error"
      );
      return;
    }

    newsletterSubmitting = true;
    if (newsletterSubmitEl) {
      newsletterSubmitEl.disabled = true;
      newsletterSubmitEl.textContent = "Subscribing...";
    }
    setNewsletterStatus("Confirming your subscription...");

    try {
      await submitNewsletterEmail(firstName, lastName, country, email);
      setNewsletterStatus("Thanks! You are subscribed to the newsletter.", "is-success");
      showNewsletterSuccessPopup();
      newsletterFormEl.reset();
      window.setTimeout(() => {
        closeNewsletterModal();
      }, 900);
    } catch (error) {
      setNewsletterStatus("Unable to subscribe right now. Please try again later.", "is-error");
    } finally {
      newsletterSubmitting = false;
      if (newsletterSubmitEl) {
        newsletterSubmitEl.disabled = false;
        newsletterSubmitEl.textContent = "Subscribe";
      }
    }
  });
}

function applyRegisterLinks() {
  if (!REGISTER_URL || !registerLinkEls.length) {
    return;
  }
  for (const link of registerLinkEls) {
    link.href = REGISTER_URL;
  }
}

function setupMobileNav() {
  if (!siteNavEl || !navToggleEl || !navMenuEl) {
    return;
  }

  const closeMenu = () => {
    siteNavEl.classList.remove("is-open");
    navToggleEl.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    siteNavEl.classList.add("is-open");
    navToggleEl.setAttribute("aria-expanded", "true");
  };

  navToggleEl.addEventListener("click", () => {
    const isOpen = siteNavEl.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
      return;
    }
    openMenu();
  });

  for (const link of navMenuEl.querySelectorAll("a")) {
    link.addEventListener("click", () => {
      closeMenu();
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!siteNavEl.classList.contains("is-open")) {
      return;
    }
    if (siteNavEl.contains(event.target)) {
      return;
    }
    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) {
      closeMenu();
    }
  });
}

async function fetchHeroContent() {
  return fetchLocalHeroContent();
}

async function fetchLocalHeroContent() {
  const res = await fetch("/Images/hero-manifest.json", { cache: "no-store" });
  const manifest = await res.json();

  return manifest.desktop.map((name) => ({
    desktop: `/Images/Hero/Desktop/${name}`,
    mobile: `/Images/Hero/Mobile/${name}`,
  }));
}

function buildLocalImageUrl(directoryPath, fileName) {
  return `${directoryPath}${encodeURIComponent(fileName)}`;
}

async function fetchCountriesContent() {
  const { sheetId, sheetMode } = SHEET_CONFIG;
  if (!sheetId) {
    return [];
  }

  if (sheetMode === "api") {
    return fetchCountriesApiContent();
  }

  return fetchCountriesCsvContent();
}

async function fetchFeaturedEventsContent() {
  const { sheetId, sheetMode } = SHEET_CONFIG;
  if (!sheetId) {
    return [];
  }

  if (sheetMode === "api") {
    return fetchFeaturedEventsApiContent();
  }

  return fetchFeaturedEventsCsvContent();
}

async function fetchVenuesContent() {
  const { sheetId, sheetMode } = SHEET_CONFIG;
  if (!sheetId) {
    return [];
  }

  if (sheetMode === "api") {
    return fetchVenuesApiContent();
  }

  return fetchVenuesCsvContent();
}

async function fetchCountryPicsContent() {
  const { sheetId, sheetMode } = SHEET_CONFIG;
  if (!sheetId) {
    return [];
  }

  if (sheetMode === "api") {
    return fetchCountryPicsApiContent();
  }

  return fetchCountryPicsCsvContent();
}

async function fetchTestimonialsContent() {
  const { sheetId, sheetMode } = SHEET_CONFIG;
  if (!sheetId) {
    return [];
  }

  if (sheetMode === "api") {
    return fetchTestimonialsApiContent();
  }

  return fetchTestimonialsCsvContent();
}

async function fetchPartnersContent() {
  const { sheetId, sheetMode } = SHEET_CONFIG;
  if (!sheetId) {
    return [];
  }

  if (sheetMode === "api") {
    return fetchPartnersApiContent();
  }

  return fetchPartnersCsvContent();
}

async function fetchSheetCsvContent() {
  const { sheetId, heroTab } = SHEET_CONFIG;
  try {
    const heroRows = await fetchCsvRows(buildCsvUrl(sheetId, heroTab));
    return parseHeroValues(heroRows);
  } catch (error) {
    return [];
  }
}

async function fetchCountriesCsvContent() {
  const { sheetId, countriesTab } = SHEET_CONFIG;
  try {
    const rows = await fetchCsvRows(buildCsvUrl(sheetId, countriesTab));
    return parseCountriesValues(rows);
  } catch (error) {
    return [];
  }
}

async function fetchFeaturedEventsCsvContent() {
  const { sheetId, featuredEventsTab } = SHEET_CONFIG;
  try {
    const rows = await fetchCsvRows(buildCsvUrl(sheetId, featuredEventsTab));
    return parseFeaturedEventsValues(rows);
  } catch (error) {
    return [];
  }
}

async function fetchVenuesCsvContent() {
  const { sheetId, venuesTab } = SHEET_CONFIG;
  try {
    const rows = await fetchCsvRows(buildCsvUrl(sheetId, venuesTab));
    return parseVenuesValues(rows);
  } catch (error) {
    return [];
  }
}

async function fetchCountryPicsCsvContent() {
  const { sheetId, countryPicsTab } = SHEET_CONFIG;
  try {
    const rows = await fetchCsvRows(buildCsvUrl(sheetId, countryPicsTab));
    return parseCountryPicsValues(rows);
  } catch (error) {
    return [];
  }
}

async function fetchTestimonialsCsvContent() {
  const { sheetId, testimonialsTab } = SHEET_CONFIG;
  try {
    const rows = await fetchCsvRows(buildCsvUrl(sheetId, testimonialsTab));
    return parseTestimonialsValues(rows);
  } catch (error) {
    return [];
  }
}

async function fetchPartnersCsvContent() {
  const { sheetId, partnersTab } = SHEET_CONFIG;
  try {
    const rows = await fetchCsvRows(buildCsvUrl(sheetId, partnersTab));
    return parsePartnersValues(rows);
  } catch (error) {
    return [];
  }
}

async function fetchSheetApiContent() {
  const { sheetId, apiKey, heroTab } = SHEET_CONFIG;
  if (!apiKey) {
    return [];
  }

  const heroRange = `${heroTab}!A:Z`;
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    heroRange
  )}?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Sheet fetch failed");
    }
    const data = await response.json();
    return parseHeroValues(data.values || []);
  } catch (error) {
    return [];
  }
}

async function fetchCountriesApiContent() {
  const { sheetId, apiKey, countriesTab } = SHEET_CONFIG;
  if (!apiKey) {
    return [];
  }

  const range = `${countriesTab}!A:C`;
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Sheet fetch failed");
    }
    const data = await response.json();
    return parseCountriesValues(data.values || []);
  } catch (error) {
    return [];
  }
}

async function fetchFeaturedEventsApiContent() {
  const { sheetId, apiKey, featuredEventsTab } = SHEET_CONFIG;
  if (!apiKey) {
    return [];
  }

  const range = `${featuredEventsTab}!A:C`;
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Sheet fetch failed");
    }
    const data = await response.json();
    return parseFeaturedEventsValues(data.values || []);
  } catch (error) {
    return [];
  }
}

async function fetchVenuesApiContent() {
  const { sheetId, apiKey, venuesTab } = SHEET_CONFIG;
  if (!apiKey) {
    return [];
  }

  const range = `${venuesTab}!A:D`;
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Sheet fetch failed");
    }
    const data = await response.json();
    return parseVenuesValues(data.values || []);
  } catch (error) {
    return [];
  }
}

async function fetchCountryPicsApiContent() {
  const { sheetId, apiKey, countryPicsTab } = SHEET_CONFIG;
  if (!apiKey) {
    return [];
  }

  const range = `${countryPicsTab}!A:C`;
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Sheet fetch failed");
    }
    const data = await response.json();
    return parseCountryPicsValues(data.values || []);
  } catch (error) {
    return [];
  }
}

async function fetchTestimonialsApiContent() {
  const { sheetId, apiKey, testimonialsTab } = SHEET_CONFIG;
  if (!apiKey) {
    return [];
  }

  const range = `${testimonialsTab}!A:C`;
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Sheet fetch failed");
    }
    const data = await response.json();
    return parseTestimonialsValues(data.values || []);
  } catch (error) {
    return [];
  }
}

async function fetchPartnersApiContent() {
  const { sheetId, apiKey, partnersTab } = SHEET_CONFIG;
  if (!apiKey) {
    return [];
  }

  const range = `${partnersTab}!A:D`;
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Sheet fetch failed");
    }
    const data = await response.json();
    return parsePartnersValues(data.values || []);
  } catch (error) {
    return [];
  }
}

function buildCsvUrl(sheetId, tabName) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    tabName
  )}`;
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

  return rows.filter((item) => item.some((cell) => cell.trim().length));
}

function parseHeroValues(values) {
  if (!values.length) {
    return [];
  }

  const desktopIndex = Math.max(SHEET_CONFIG.heroDesktopCol - 1, 0);
  const mobileIndex = Math.max(SHEET_CONFIG.heroMobileCol - 1, 0);
  const activeIndex = Math.max(SHEET_CONFIG.heroActiveCol - 1, 0);

  const heroes = [];

  for (const row of values.slice(1, 3)) {
    const active = (row[activeIndex] || "").trim();
    if (!isActiveRow(active)) {
      continue;
    }
    const desktop = (row[desktopIndex] || "").trim();
    const mobile = (row[mobileIndex] || "").trim();
    if (!desktop && !mobile) {
      continue;
    }
    heroes.push({
      desktop: convertDriveUrl(desktop),
      mobile: convertDriveUrl(mobile),
    });
  }

  return heroes;
}

function parseCountriesValues(values) {
  if (!values.length) {
    return [];
  }

  const entries = [];

  for (const row of values.slice(1)) {
    const country = (row[0] || "").trim();
    const cityCount = (row[1] || "").trim();
    const date = (row[2] || "").trim();

    if (!country) {
      continue;
    }

    entries.push({
      country,
      cityCount,
      date,
    });
  }

  return entries;
}

function parseFeaturedEventsValues(values) {
  if (!values.length) {
    return [];
  }

  const entries = [];

  for (const row of values.slice(1)) {
    const title = (row[0] || "").trim();
    const subText = (row[1] || "").trim();
    const imageUrl = (row[2] || "").trim();

    if (!title && !subText && !imageUrl) {
      continue;
    }

    entries.push({
      title,
      subText,
      imageUrl: convertDriveUrl(imageUrl),
    });
  }

  return entries;
}

function parseVenuesValues(values) {
  if (!values.length) {
    return [];
  }

  const entries = [];

  for (const row of values.slice(1)) {
    const country = (row[0] || "").trim();
    const city = (row[1] || "").trim();
    const venue = (row[2] || "").trim();
    const date = (row[3] || "").trim();

    if (!country) {
      continue;
    }

    entries.push({
      country,
      city,
      venue,
      date,
    });
  }

  return entries;
}

function parseCountryPicsValues(values) {
  if (!values.length) {
    return [];
  }

  const entries = [];

  for (const row of values.slice(1)) {
    const country = (row[0] || "").trim();
    const imageUrl = (row[1] || "").trim();
    const active = (row[2] || "").trim();

    if (!country || !imageUrl || !isActiveRow(active)) {
      continue;
    }

    entries.push({
      country,
      imageUrl: convertDriveUrl(imageUrl),
    });
  }

  return entries;
}

function parseTestimonialsValues(values) {
  if (!values.length) {
    return [];
  }

  const entries = [];

  for (const row of values.slice(1)) {
    const videoUrl = (row[0] || "").trim();
    const title = (row[1] || "").trim();
    const active = (row[2] || "").trim();

    if (!videoUrl || !isActiveRow(active)) {
      continue;
    }

    entries.push({
      videoUrl,
      title,
    });
  }

  return entries;
}

function parsePartnersValues(values) {
  if (!values.length) {
    return [];
  }

  const entries = [];

  for (const row of values.slice(1)) {
    const name = (row[0] || "").trim();
    const logo = (row[1] || "").trim();
    const website = (row[2] || "").trim();
    const active = (row[3] || "").trim();

    if (!name || !logo || !isActiveRow(active)) {
      continue;
    }

    entries.push({
      name,
      logoUrl: convertDriveUrl(logo),
      websiteUrl: normalizeWebsiteUrl(website),
    });
  }

  return entries;
}

function normalizeWebsiteUrl(url) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
}

async function detectVisitorCountry() {
  const fallbackEndpoints = ["https://ipwho.is/"];
  const endpoints = [GEO_CONFIG.endpoint, ...fallbackEndpoints].filter(Boolean);

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      const country = pickCountryName(data);
      if (country) {
        return country;
      }
    } catch (error) {
      // Try the next provider.
    }
  }

  return "";
}

function pickCountryName(data) {
  if (!data || typeof data !== "object") {
    return "";
  }

  if (data.success === false) {
    return "";
  }

  return String(
    data.country_name || data.countryName || data.country || data.country_name_en || ""
  ).trim();
}

function normalizeCountryName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function toCanonicalCountryName(value) {
  const normalized = normalizeCountryName(value);
  const aliases = {
    lb: "lebanon",
    "republic of lebanon": "lebanon",
    "lebanese republic": "lebanon",
    usa: "united states",
    us: "united states",
    uae: "united arab emirates",
  };
  return aliases[normalized] || normalized;
}

function countryKeywords(value) {
  const canonical = toCanonicalCountryName(value);
  return canonical
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (item) => !["the", "republic", "state", "states", "territory", "territories"].includes(item)
    );
}

function countriesMatch(countryA, countryB) {
  const a = toCanonicalCountryName(countryA);
  const b = toCanonicalCountryName(countryB);
  if (!a || !b) {
    return false;
  }

  if (a === b) {
    return true;
  }

  if (a.includes(b) || b.includes(a)) {
    return true;
  }

  const keywordsA = countryKeywords(countryA);
  const keywordsB = countryKeywords(countryB);
  if (!keywordsA.length || !keywordsB.length) {
    return false;
  }

  return keywordsA.some((keyword) => keywordsB.includes(keyword));
}

function isActiveRow(value) {
  return /^(y|yes|true|1)$/i.test(value || "");
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

function renderHeroImage(hero) {
  if (!heroVisualEl) {
    console.log("hero-visual element not found");
    return;
  }

  if (!hero || (!hero.desktop && !hero.mobile)) {
    console.log("No hero data provided");
    heroVisualEl.classList.add("is-hidden");
    return;
  }

  console.log("Rendering hero:", hero);
  heroVisualEl.classList.remove("is-hidden");
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const desktop = hero.desktop || hero.mobile;
  const mobile = hero.mobile || hero.desktop;
  const selected = isMobile ? mobile : desktop;

  console.log("Selected image URL:", selected);

  if (heroSourceEl) {
    heroSourceEl.srcset = mobile || desktop || "";
  }

  if (heroImageEl) {
    heroImageEl.src = selected;
    console.log("Set img src to:", selected);
  }
}

function startHeroRotation(heroes) {
  if (!heroes.length) {
    renderHeroImage(null);
    return;
  }

  let index = 0;
  renderHeroImage(heroes[index]);
  console.log("Starting rotation with", heroes.length, "images");

  window.setInterval(() => {
    index = (index + 1) % heroes.length;
    console.log("Rotating to index:", index, "Image:", heroes[index]);
    renderHeroImage(heroes[index]);
  }, SHEET_CONFIG.heroRotationMs);
}

function renderCountries(countries, detectedCountry) {
  if (!countryPrimaryGridEl) {
    return;
  }

  countryPrimaryGridEl.innerHTML = "";
  if (countryAllGridEl) {
    countryAllGridEl.innerHTML = "";
  }

  if (countryMoreEl) {
    countryMoreEl.hidden = true;
  }

  if (!countries.length) {
    renderEmptyMessage(countryPrimaryGridEl, "No registration data available right now.");
    return;
  }

  const primary = detectedCountry
    ? countries.filter((entry) => countriesMatch(entry.country, detectedCountry))
    : [];

  // Always keep primary area reserved for the detected country only.
  if (primary.length) {
    const remaining = countries.filter(
      (entry) => !countriesMatch(entry.country, detectedCountry)
    );

    renderCountryGrid(countryPrimaryGridEl, primary);

    if (countryMoreEl && countryAllGridEl && remaining.length) {
      renderCountryGrid(countryAllGridEl, remaining);
      countryMoreEl.hidden = false;
    }
    return;
  }

  renderEmptyMessage(
    countryPrimaryGridEl,
    "We could not match your country yet. Open View all countries to find your registration details."
  );

  if (countryMoreEl && countryAllGridEl) {
    renderCountryGrid(countryAllGridEl, countries);
    countryMoreEl.hidden = false;
  }
}

function renderFeaturedEvents(entries) {
  if (!featuredEventsSectionEl || !featuredEventsGridEl) {
    return;
  }

  featuredEventsGridEl.innerHTML = "";
  featuredEventsSectionEl.hidden = false;

  if (!entries.length) {
    renderEmptyMessage(featuredEventsGridEl, "Featured events will be announced soon.");
    return;
  }

  for (const entry of entries) {
    const card = document.createElement("article");
    card.className = "featured-event-card";

    if (entry.imageUrl) {
      const image = document.createElement("img");
      image.className = "featured-event-image";
      image.src = entry.imageUrl;
      image.alt = entry.title ? `${entry.title} event image` : "Featured event image";
      image.loading = "lazy";
      card.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "featured-event-body";

    if (entry.title) {
      const title = document.createElement("h3");
      title.className = "featured-event-title";
      title.textContent = entry.title;
      body.appendChild(title);
    }

    if (entry.subText) {
      const subText = document.createElement("p");
      subText.className = "featured-event-subtext";
      subText.textContent = entry.subText;
      body.appendChild(subText);
    }

    card.appendChild(body);
    featuredEventsGridEl.appendChild(card);
  }
}

function renderCountryGrid(targetEl, entries) {
  for (const entry of entries) {
    targetEl.appendChild(createCountryCard(entry));
  }
}

function renderCountryPics(entries, detectedCountry) {
  if (!countryPicsGridEl) {
    return;
  }

  countryPicsGridEl.innerHTML = "";

  if (countryPicsTitleEl) {
    const safeCountry = detectedCountry || "around the world";
    countryPicsTitleEl.textContent = `Pictures from ${safeCountry}`;
  }

  if (!entries.length) {
    renderEmptyMessage(countryPicsGridEl, "No photos available yet.");
    return;
  }

  const normalizedCountry = normalizeCountryName(detectedCountry);
  const matches = entries.filter(
    (entry) => normalizeCountryName(entry.country) === normalizedCountry
  );
  const fallback = entries.filter(
    (entry) => normalizeCountryName(entry.country) === "other"
  );
  const selected = matches.length ? matches : fallback;

  if (countryPicsTitleEl) {
    if (matches.length && detectedCountry) {
      countryPicsTitleEl.textContent = `Pictures from ${detectedCountry}`;
    } else if (!matches.length && fallback.length) {
      countryPicsTitleEl.textContent = "Pictures from Other";
    }
  }

  if (!selected.length) {
    renderEmptyMessage(countryPicsGridEl, "No photos available yet.");
    return;
  }

  for (const entry of selected) {
    const card = document.createElement("div");
    card.className = "country-pic-card";

    const image = document.createElement("img");
    image.src = entry.imageUrl;
    image.alt = entry.country ? `${entry.country} photo` : "Country photo";
    image.loading = "lazy";

    card.appendChild(image);
    countryPicsGridEl.appendChild(card);
  }
}

function renderTestimonials(entries) {
  if (!testimonialsSectionEl || !testimonialTrackEl) {
    return;
  }

  testimonialTrackEl.innerHTML = "";

  const limited = entries.slice(0, 12);
  if (!limited.length) {
    testimonialsSectionEl.hidden = true;
    return;
  }

  testimonialsSectionEl.hidden = false;

  for (const entry of limited) {
    const card = document.createElement("article");
    card.className = "testimonial-card";

    const media = createTestimonialMedia(entry);
    media.classList.add("testimonial-media");

    const copy = document.createElement("div");
    copy.className = "testimonial-copy";

    if (entry.title) {
      const headline = document.createElement("h3");
      headline.textContent = entry.title;
      copy.appendChild(headline);
    }

    card.appendChild(media);
    card.appendChild(copy);
    testimonialTrackEl.appendChild(card);
  }

  setupTestimonialsCarousel();
}

function renderPartners(entries) {
  if (!partnersSectionEl || !partnersGridEl) {
    return;
  }

  partnersGridEl.innerHTML = "";
  partnersSectionEl.hidden = false;

  if (!entries.length) {
    renderEmptyMessage(partnersGridEl, "Partner logos will be updated soon.");
    return;
  }

  const minVisibleCards = 6;
  const repeatedEntries = [];
  const repeatRounds = Math.max(1, Math.ceil(minVisibleCards / entries.length));
  for (let i = 0; i < repeatRounds; i += 1) {
    repeatedEntries.push(...entries);
  }

  const loopEntries = [...repeatedEntries, ...repeatedEntries];
  const track = document.createElement("div");
  track.className = "partners-marquee-track";

  for (const entry of loopEntries) {
    const wrapper = entry.websiteUrl ? document.createElement("a") : document.createElement("div");
    wrapper.className = "partner-marquee-item";

    if (entry.websiteUrl) {
      wrapper.href = entry.websiteUrl;
      wrapper.target = "_blank";
      wrapper.rel = "noopener";
      wrapper.setAttribute("aria-label", `${entry.name} website`);
    }

    const image = document.createElement("img");
    image.className = "partner-marquee-logo";
    image.src = entry.logoUrl;
    image.alt = `${entry.name} logo`;
    image.loading = "lazy";

    wrapper.appendChild(image);
    track.appendChild(wrapper);
  }

  partnersGridEl.appendChild(track);
}

function createTestimonialMedia(entry) {
  const selectedUrl = entry.videoUrl || "";

  if (isYouTubeUrl(selectedUrl)) {
    const iframe = document.createElement("iframe");
    iframe.src = convertToYouTubeEmbed(selectedUrl);
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.title = entry.title || "Digital nugget video";
    return iframe;
  }

  const video = document.createElement("video");
  video.src = selectedUrl;
  video.controls = true;
  video.preload = "metadata";
  video.title = entry.title || "Digital nugget video";
  return video;
}

function isYouTubeUrl(url) {
  if (!url) {
    return false;
  }
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function convertToYouTubeEmbed(url) {
  if (!url) {
    return "";
  }

  let videoId = "";

  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split(/[?&]/)[0];
  } else if (url.includes("youtube.com/shorts/")) {
    videoId = url.split("youtube.com/shorts/")[1].split(/[?&]/)[0];
  } else if (url.includes("youtube.com/watch")) {
    const params = new URLSearchParams(url.split("?")[1] || "");
    videoId = params.get("v") || "";
  } else if (url.includes("youtube.com/embed/")) {
    return url;
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function setupTestimonialsCarousel() {
  if (!testimonialTrackEl || !testimonialPrevEl || !testimonialNextEl || !testimonialDotsEl) {
    return;
  }

  const cards = Array.from(testimonialTrackEl.children);
  if (!cards.length) {
    return;
  }

  let currentPage = 0;
  let totalPages = 1;

  const getGap = () => {
    const styles = window.getComputedStyle(testimonialTrackEl);
    const gapValue = styles.columnGap || styles.gap || "0";
    return Number.parseFloat(gapValue) || 0;
  };

  const getItemsPerView = () => 1;

  const getPageSpan = () => {
    const cardWidth = cards[0].getBoundingClientRect().width;
    return cardWidth + getGap();
  };

  const updateDots = () => {
    testimonialDotsEl.innerHTML = "";
    for (let i = 0; i < totalPages; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      if (i === currentPage) {
        dot.classList.add("is-active");
      }
      dot.addEventListener("click", () => {
        goToPage(i);
      });
      testimonialDotsEl.appendChild(dot);
    }
  };

  const goToPage = (page, behavior = "smooth") => {
    const perView = getItemsPerView();
    const pageSpan = getPageSpan() * perView;
    const clamped = (page + totalPages) % totalPages;
    currentPage = clamped;
    testimonialTrackEl.scrollTo({ left: clamped * pageSpan, behavior });
    updateDots();
  };

  const refreshCarousel = () => {
    const perView = getItemsPerView();
    totalPages = Math.ceil(cards.length / perView);
    currentPage = Math.min(currentPage, totalPages - 1);
    updateDots();
    goToPage(currentPage, "auto");
  };

  const handleScroll = () => {
    const perView = getItemsPerView();
    const pageSpan = getPageSpan() * perView;
    if (!pageSpan) {
      return;
    }
    const nextPage = Math.round(testimonialTrackEl.scrollLeft / pageSpan);
    if (nextPage !== currentPage) {
      currentPage = nextPage;
      updateDots();
    }
  };

  testimonialPrevEl.onclick = () => {
    goToPage(currentPage - 1);
  };

  testimonialNextEl.onclick = () => {
    goToPage(currentPage + 1);
  };

  testimonialTrackEl.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", refreshCarousel);

  if (testimonialAutoTimer) {
    window.clearInterval(testimonialAutoTimer);
  }
  testimonialAutoTimer = window.setInterval(() => {
    goToPage(currentPage + 1);
  }, 6500);

  refreshCarousel();
}

function renderEmptyMessage(targetEl, message) {
  const empty = document.createElement("p");
  empty.textContent = message;
  targetEl.appendChild(empty);
}

function createCountryCard(entry) {
  const card = document.createElement("article");
  card.className = "registration-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.dataset.country = entry.country;

  const header = document.createElement("div");
  header.className = "registration-card-header";

  const title = document.createElement("h3");
  title.textContent = entry.country;

  header.appendChild(title);

  const meta = document.createElement("p");
  const countLabel = entry.cityCount ? `${entry.cityCount} cities` : "Cities TBD";
  const dateLabel = entry.date ? entry.date : "Date TBD";
  meta.textContent = `${countLabel} • ${dateLabel}`;

  card.appendChild(header);
  card.appendChild(meta);

  card.addEventListener("click", () => {
    openVenueModal(entry.country);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openVenueModal(entry.country);
    }
  });

  return card;
}

function openVenueModal(country) {
  if (!venueModalEl || !venueTitleEl || !venueListEl) {
    return;
  }

  const normalized = normalizeCountryName(country);
  const matches = venueEntries.filter(
    (entry) => normalizeCountryName(entry.country) === normalized
  );

  venueTitleEl.textContent = country || "Venues";
  venueListEl.innerHTML = "";

  if (!matches.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "venue-item";
    emptyItem.textContent = "No venues available for this country yet.";
    venueListEl.appendChild(emptyItem);
  } else {
    for (const entry of matches) {
      const item = document.createElement("li");
      item.className = "venue-item";

      const cityLine = document.createElement("strong");
      cityLine.textContent = entry.city || "City TBD";

      const details = document.createElement("span");
      const venueLabel = entry.venue ? entry.venue : "Venue TBD";
      const dateLabel = entry.date ? entry.date : "Date TBD";
      details.textContent = `${venueLabel} • ${dateLabel}`;

      item.appendChild(cityLine);
      item.appendChild(details);
      venueListEl.appendChild(item);
    }
  }

  venueModalEl.classList.add("is-open");
  venueModalEl.setAttribute("aria-hidden", "false");
}

function closeVenueModal() {
  if (!venueModalEl) {
    return;
  }

  venueModalEl.classList.remove("is-open");
  venueModalEl.setAttribute("aria-hidden", "true");
}

function setupVenueModal() {
  if (!venueModalEl) {
    return;
  }

  for (const button of venueCloseEls) {
    button.addEventListener("click", closeVenueModal);
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeVenueModal();
    }
  });
}

function setupImpactCounters() {
  if (!impactSectionEl || !impactValueEls.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parsedValues = impactValueEls
    .map((el) => {
      const originalText = el.textContent ? el.textContent.trim() : "";
      const match = originalText.match(/^([\d,.]+)(.*)$/);
      if (!match) {
        return null;
      }

      const numericText = match[1].replace(/,/g, "");
      const target = Number.parseFloat(numericText);
      if (!Number.isFinite(target)) {
        return null;
      }

      const decimalPart = numericText.split(".")[1] || "";
      return {
        el,
        target,
        suffix: match[2] || "",
        decimals: decimalPart.length,
      };
    })
    .filter(Boolean);

  if (!parsedValues.length) {
    return;
  }

  const renderValue = (value, decimals) => {
    if (decimals > 0) {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return Math.round(value).toLocaleString();
  };

  const runAnimation = () => {
    const duration = 2200;
    const start = performance.now();

    for (const item of parsedValues) {
      item.el.classList.add("is-counting");
    }

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;

      for (const item of parsedValues) {
        const current = item.target * eased;
        item.el.textContent = `${renderValue(current, item.decimals)}${item.suffix}`;
      }

      if (progress < 1) {
        window.requestAnimationFrame(tick);
        return;
      }

      for (const item of parsedValues) {
        item.el.classList.remove("is-counting");
      }
    };

    window.requestAnimationFrame(tick);
  };

  const showFinalValues = () => {
    for (const item of parsedValues) {
      item.el.textContent = `${renderValue(item.target, item.decimals)}${item.suffix}`;
    }
  };

  if (prefersReducedMotion) {
    showFinalValues();
    return;
  }

  for (const item of parsedValues) {
    item.el.textContent = `${renderValue(0, item.decimals)}${item.suffix}`;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const hasVisible = entries.some((entry) => entry.isIntersecting);
      if (!hasVisible) {
        return;
      }

      runAnimation();
      observer.disconnect();
    },
    {
      threshold: 0.5,
      rootMargin: "0px",
    }
  );

  observer.observe(impactSectionEl);
}

async function init() {
  console.log("Initializing...");
  applyRegisterLinks();
  setupMobileNav();
  setupNewsletterSubscribe();
  setupImpactCounters();
  const heroes = await fetchHeroContent();
  console.log("Fetched heroes:", heroes);
  startHeroRotation(heroes);

  const [featuredEvents, countries, venues, countryPics, testimonials, partners] = await Promise.all([
    fetchFeaturedEventsContent(),
    fetchCountriesContent(),
    fetchVenuesContent(),
    fetchCountryPicsContent(),
    fetchTestimonialsContent(),
    fetchPartnersContent(),
  ]);
  venueEntries = venues;
  setupVenueModal();
  const detectedCountry = await detectVisitorCountry();
  renderFeaturedEvents(featuredEvents);
  renderCountries(countries, detectedCountry);
  renderCountryPics(countryPics, detectedCountry);
  renderTestimonials(testimonials);
  renderPartners(partners);
}

init();
