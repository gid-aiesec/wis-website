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
  countriesTab: runtimeConfig.countriesTab || "Countries",
  venuesTab: runtimeConfig.venuesTab || "Venues",
  countryPicsTab: runtimeConfig.countryPicsTab || "Country Pics",
  testimonialsTab: runtimeConfig.testimonialsTab || "Testimonials",
  partnersTab: runtimeConfig.partnersTab || "Partners",
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
const heroVisualEl = document.getElementById("hero-visual");
const heroImageEl = document.getElementById("hero-image");
const heroSourceEl = document.getElementById("hero-source");
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
const venueModalEl = document.getElementById("venue-modal");
const venueTitleEl = document.getElementById("venue-title");
const venueListEl = document.getElementById("venue-list");
const venueCloseEls = document.querySelectorAll("[data-close-modal]");
const registerLinkEls = document.querySelectorAll("[data-register-link]");
let venueEntries = [];
let testimonialAutoTimer = null;

function applyRegisterLinks() {
  if (!REGISTER_URL || !registerLinkEls.length) {
    return;
  }
  for (const link of registerLinkEls) {
    link.href = REGISTER_URL;
  }
}

async function fetchHeroContent() {
  const { sheetId, sheetMode } = SHEET_CONFIG;
  if (!sheetId) {
    return [];
  }

  if (sheetMode === "api") {
    return fetchSheetApiContent();
  }

  return fetchSheetCsvContent();
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

  const range = `${testimonialsTab}!A:E`;
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

  for (const row of values.slice(1)) {
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
    const desktopUrl = (row[0] || "").trim();
    const mobileUrl = (row[1] || "").trim();
    const mainText = (row[2] || "").trim();
    const subText = (row[3] || "").trim();
    const active = (row[4] || "").trim();

    if ((!desktopUrl && !mobileUrl) || !mainText || !isActiveRow(active)) {
      continue;
    }

    entries.push({
      desktopUrl,
      mobileUrl,
      mainText,
      subText,
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
    const desktopLogo = (row[1] || "").trim();
    const mobileLogo = (row[2] || "").trim();
    const active = (row[3] || "").trim();

    if (!name || (!desktopLogo && !mobileLogo) || !isActiveRow(active)) {
      continue;
    }

    entries.push({
      name,
      desktopLogo: convertDriveUrl(desktopLogo),
      mobileLogo: convertDriveUrl(mobileLogo),
    });
  }

  return entries;
}

async function detectVisitorCountry() {
  if (!GEO_CONFIG.endpoint) {
    return "";
  }

  try {
    const response = await fetch(GEO_CONFIG.endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Geo lookup failed");
    }
    const data = await response.json();
    return pickCountryName(data);
  } catch (error) {
    return "";
  }
}

function pickCountryName(data) {
  if (!data || typeof data !== "object") {
    return "";
  }
  return String(data.country_name || data.countryName || data.country || "").trim();
}

function normalizeCountryName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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

  const cacheBuster = appendCacheBuster(selected);

  console.log("Selected image URL:", selected);

  if (heroSourceEl) {
    const sourceUrl = appendCacheBuster(mobile || desktop || "");
    heroSourceEl.srcset = sourceUrl;
  }

  if (heroImageEl) {
    heroImageEl.src = cacheBuster;
    console.log("Set img src to:", cacheBuster);
  }
}

function appendCacheBuster(url) {
  if (!url) {
    return "";
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
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

  const normalizedCountry = normalizeCountryName(detectedCountry);
  if (!normalizedCountry) {
    renderCountryGrid(countryPrimaryGridEl, countries);
    return;
  }

  const primary = countries.filter(
    (entry) => normalizeCountryName(entry.country) === normalizedCountry
  );
  const remaining = countries.filter(
    (entry) => normalizeCountryName(entry.country) !== normalizedCountry
  );

  if (!primary.length) {
    renderCountryGrid(countryPrimaryGridEl, countries);
    return;
  }

  renderCountryGrid(countryPrimaryGridEl, primary);

  if (countryMoreEl && countryAllGridEl && remaining.length) {
    renderCountryGrid(countryAllGridEl, remaining);
    countryMoreEl.hidden = false;
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
    const safeCountry = detectedCountry || "your country";
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

    const headline = document.createElement("h3");
    headline.textContent = entry.mainText;

    const sub = document.createElement("p");
    sub.textContent = entry.subText || "";

    copy.appendChild(headline);
    if (entry.subText) {
      copy.appendChild(sub);
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

  for (const entry of entries) {
    const card = document.createElement("article");
    card.className = "partner-card";
    card.setAttribute("aria-label", entry.name);

    const logoPicture = createPartnerLogoPicture(entry);
    logoPicture.classList.add("partner-logo");

    card.appendChild(logoPicture);
    partnersGridEl.appendChild(card);
  }
}

function createPartnerLogoPicture(entry) {
  const picture = document.createElement("picture");
  const source = document.createElement("source");
  source.media = "(max-width: 720px)";
  source.srcset = entry.mobileLogo || entry.desktopLogo || "";

  const image = document.createElement("img");
  image.src = entry.desktopLogo || entry.mobileLogo || "";
  image.alt = `${entry.name} logo`;
  image.loading = "lazy";

  picture.appendChild(source);
  picture.appendChild(image);
  return picture;
}

function createTestimonialMedia(entry) {
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const selectedUrl = isMobile ? entry.mobileUrl || entry.desktopUrl : entry.desktopUrl || entry.mobileUrl;
  
  if (isYouTubeUrl(selectedUrl)) {
    const iframe = document.createElement("iframe");
    iframe.src = convertToYouTubeEmbed(selectedUrl);
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    return iframe;
  }

  const image = document.createElement("img");
  image.src = convertDriveUrl(selectedUrl);
  image.alt = "Testimonial media";
  image.loading = "lazy";
  return image;
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

  const getItemsPerView = () => (window.matchMedia("(min-width: 900px)").matches ? 2 : 1);

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

async function init() {
  console.log("Initializing...");
  applyRegisterLinks();
  const heroes = await fetchHeroContent();
  console.log("Fetched heroes:", heroes);
  startHeroRotation(heroes);

  const [countries, venues, countryPics, testimonials, partners] = await Promise.all([
    fetchCountriesContent(),
    fetchVenuesContent(),
    fetchCountryPicsContent(),
    fetchTestimonialsContent(),
    fetchPartnersContent(),
  ]);
  venueEntries = venues;
  setupVenueModal();
  const detectedCountry = await detectVisitorCountry();
  renderCountries(countries, detectedCountry);
  renderCountryPics(countryPics, detectedCountry);
  renderTestimonials(testimonials);
  renderPartners(partners);
}

init();
