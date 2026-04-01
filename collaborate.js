const runtimeConfig = window.APP_CONFIG || {};

const COLLABORATE_CONFIG = {
  endpoint: runtimeConfig.collaborateEndpoint || runtimeConfig.newsletterEndpoint || "",
  tab: runtimeConfig.collaborateTab || "Collaborate",
};

const siteNavEl = document.querySelector(".site-nav");
const navToggleEl = document.querySelector("[data-nav-toggle]");
const navMenuEl = document.querySelector("[data-nav-menu]");

const formEl = document.getElementById("collaborate-form");
const firstNameEl = document.getElementById("collab-first-name");
const lastNameEl = document.getElementById("collab-last-name");
const companyEl = document.getElementById("collab-company");
const emailEl = document.getElementById("collab-email");
const subjectEl = document.getElementById("collab-subject");
const messageEl = document.getElementById("collab-message");
const submitEl = document.getElementById("collaborate-submit");
const statusEl = document.getElementById("collaborate-status");
const successEl = document.getElementById("collaborate-success");
const successCloseEl = document.getElementById("collaborate-success-close");

let isSubmitting = false;
let successTimer = null;

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

function isValidEmail(value) {
  const candidate = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate);
}

function setStatus(message, type = "") {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
  statusEl.classList.remove("is-success", "is-error");
  if (type) {
    statusEl.classList.add(type);
  }
}

async function submitCollaboration(payload) {
  if (!COLLABORATE_CONFIG.endpoint) {
    throw new Error("Collaborate endpoint is not configured.");
  }

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

  let sawScriptError = false;
  let lastScriptErrorMessage = "";

  for (const requestInit of attempts) {
    try {
      const response = await fetch(COLLABORATE_CONFIG.endpoint, requestInit);
      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const result = await response.json();
        if (result && result.ok === false) {
          sawScriptError = true;
          lastScriptErrorMessage = String(result.error || "Script rejected the request.");
          continue;
        }
      }

      return;
    } catch (error) {
      // Try next request shape.
    }
  }

  if (sawScriptError) {
    throw new Error(lastScriptErrorMessage || "Script rejected the request.");
  }

  await submitWithHiddenForm(COLLABORATE_CONFIG.endpoint, payload);
}

function submitWithHiddenForm(endpoint, fields) {
  return new Promise((resolve) => {
    const frameName = `collaborate-submit-${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = frameName;
    iframe.style.display = "none";

    const form = document.createElement("form");
    form.method = "POST";
    form.action = endpoint;
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
    }, 1000);
  });
}

function openSuccessPopup() {
  if (!successEl) {
    return;
  }

  successEl.classList.add("is-open");
  successEl.setAttribute("aria-hidden", "false");

  if (successTimer) {
    window.clearTimeout(successTimer);
  }
  successTimer = window.setTimeout(() => {
    closeSuccessPopup();
  }, 2200);
}

function closeSuccessPopup() {
  if (!successEl) {
    return;
  }

  successEl.classList.remove("is-open");
  successEl.setAttribute("aria-hidden", "true");
}

function setupCollaborateForm() {
  if (!formEl || !firstNameEl || !lastNameEl || !companyEl || !emailEl || !subjectEl || !messageEl) {
    return;
  }

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const firstName = firstNameEl.value.trim();
    const lastName = lastNameEl.value.trim();
    const company = companyEl.value.trim();
    const email = emailEl.value.trim();
    const subject = subjectEl.value.trim();
    const message = messageEl.value.trim();

    if (!firstName || !lastName || !company || !subject || !message) {
      setStatus("Please complete all required fields.", "is-error");
      return;
    }

    if (!isValidEmail(email)) {
      setStatus("Please enter a valid email address.", "is-error");
      emailEl.focus();
      return;
    }

    isSubmitting = true;
    if (submitEl) {
      submitEl.disabled = true;
      submitEl.textContent = "Submitting...";
    }
    setStatus("Sending your message...");

    const payload = {
      mode: "collaborate",
      tab: COLLABORATE_CONFIG.tab,
      firstName,
      lastName,
      company,
      email,
      subject,
      message,
      submittedAt: new Date().toISOString(),
    };

    try {
      await submitCollaboration(payload);
      setStatus("Thank you. We received your message and will get back to you soon.", "is-success");
      formEl.reset();
      openSuccessPopup();
    } catch (error) {
      const messageText =
        error && typeof error.message === "string" && error.message
          ? error.message
          : "Could not submit right now. Please try again shortly.";
      setStatus(messageText, "is-error");
    } finally {
      isSubmitting = false;
      if (submitEl) {
        submitEl.disabled = false;
        submitEl.textContent = "Submit";
      }
    }
  });

  if (successCloseEl) {
    successCloseEl.addEventListener("click", closeSuccessPopup);
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSuccessPopup();
    }
  });
}

setupMobileNav();
setupCollaborateForm();
