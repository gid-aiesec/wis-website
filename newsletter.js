(function () {
  const runtimeConfig = window.APP_CONFIG || {};

  const NEWSLETTER_ENDPOINT = runtimeConfig.newsletterEndpoint || "";
  const NEWSLETTER_TAB = runtimeConfig.newsletterTab || "Newsletter";
  const NEWSLETTER_FORM_URL = runtimeConfig.newsletterFormUrl || "";
  const NEWSLETTER_FORM_FIRST_NAME_FIELD = runtimeConfig.newsletterFormFirstNameField || "";
  const NEWSLETTER_FORM_LAST_NAME_FIELD = runtimeConfig.newsletterFormLastNameField || "";
  const NEWSLETTER_FORM_COUNTRY_FIELD = runtimeConfig.newsletterFormCountryField || "";
  const NEWSLETTER_FORM_EMAIL_FIELD = runtimeConfig.newsletterFormEmailField || "";

  const newsletterButtonEl = document.querySelector("[data-newsletter-subscribe]");

  if (!newsletterButtonEl) {
    return;
  }

  ensureNewsletterUi();

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

  if (
    !newsletterModalEl ||
    !newsletterFormEl ||
    !newsletterFirstNameEl ||
    !newsletterLastNameEl ||
    !newsletterCountryEl ||
    !newsletterEmailEl
  ) {
    return;
  }

  let newsletterSubmitting = false;
  let newsletterSuccessTimer = null;

  function ensureNewsletterUi() {
    if (!document.getElementById("newsletter-modal")) {
      const modal = document.createElement("div");
      modal.className = "newsletter-modal";
      modal.id = "newsletter-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-hidden", "true");
      modal.setAttribute("aria-labelledby", "newsletter-title");
      modal.innerHTML =
        '<div class="newsletter-backdrop" data-close-newsletter></div>' +
        '<div class="newsletter-panel" role="document">' +
        '  <div class="newsletter-header">' +
        '    <h3 id="newsletter-title">Subscribe to our newsletter</h3>' +
        '    <p>Get updates on Women in STEM events, opportunities, and stories.</p>' +
        "  </div>" +
        '  <form class="newsletter-form" id="newsletter-form" novalidate>' +
        '    <label class="newsletter-label" for="newsletter-first-name">First name</label>' +
        '    <input class="newsletter-input" id="newsletter-first-name" name="firstName" type="text" autocomplete="given-name" placeholder="First name" required />' +
        '    <label class="newsletter-label" for="newsletter-last-name">Last name</label>' +
        '    <input class="newsletter-input" id="newsletter-last-name" name="lastName" type="text" autocomplete="family-name" placeholder="Last name" required />' +
        '    <label class="newsletter-label" for="newsletter-country">Country</label>' +
        '    <input class="newsletter-input" id="newsletter-country" name="country" type="text" autocomplete="country-name" placeholder="Country" required />' +
        '    <label class="newsletter-label" for="newsletter-email">Email address</label>' +
        '    <input class="newsletter-input" id="newsletter-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required />' +
        '    <p class="newsletter-status" id="newsletter-status" aria-live="polite"></p>' +
        '    <div class="newsletter-actions">' +
        '      <button class="cta-button" id="newsletter-submit" type="submit">Subscribe</button>' +
        '      <button class="venue-close" type="button" data-close-newsletter>Close</button>' +
        "    </div>" +
        "  </form>" +
        "</div>";
      document.body.appendChild(modal);
    }

    if (!document.getElementById("newsletter-success")) {
      const success = document.createElement("div");
      success.className = "newsletter-success";
      success.id = "newsletter-success";
      success.setAttribute("role", "status");
      success.setAttribute("aria-live", "polite");
      success.setAttribute("aria-hidden", "true");
      success.innerHTML =
        '<div class="newsletter-success-card">' +
        '  <p class="newsletter-success-title">Subscribed successfully</p>' +
        '  <p class="newsletter-success-copy">Thanks for joining the newsletter.</p>' +
        '  <button class="cta-button" type="button" id="newsletter-success-close">Great</button>' +
        "</div>";
      document.body.appendChild(success);
    }
  }

  function isValidEmail(value) {
    if (!value) {
      return false;
    }
    const candidate = String(value).trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate);
  }

  function setNewsletterStatus(message, type) {
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
    newsletterModalEl.classList.add("is-open");
    newsletterModalEl.setAttribute("aria-hidden", "false");
    setNewsletterStatus("");
    window.setTimeout(function () {
      newsletterFirstNameEl.focus();
    }, 0);
  }

  function closeNewsletterModal() {
    newsletterModalEl.classList.remove("is-open");
    newsletterModalEl.setAttribute("aria-hidden", "true");
  }

  function closeNewsletterSuccessPopup() {
    if (!newsletterSuccessEl) {
      return;
    }

    newsletterSuccessEl.classList.remove("is-open");
    newsletterSuccessEl.setAttribute("aria-hidden", "true");
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

    newsletterSuccessTimer = window.setTimeout(function () {
      closeNewsletterSuccessPopup();
    }, 1800);
  }

  function submitGoogleForm(formUrl, fields) {
    return new Promise(function (resolve) {
      const frameName = "newsletter-submit-" + Date.now();
      const iframe = document.createElement("iframe");
      iframe.name = frameName;
      iframe.style.display = "none";

      const form = document.createElement("form");
      form.method = "POST";
      form.action = formUrl;
      form.target = frameName;
      form.style.display = "none";

      Object.entries(fields).forEach(function (entry) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = entry[0];
        input.value = entry[1];
        form.appendChild(input);
      });

      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();

      window.setTimeout(function () {
        form.remove();
        iframe.remove();
        resolve();
      }, 900);
    });
  }

  async function submitNewsletterEmail(firstName, lastName, country, email) {
    const payload = {
      firstName: firstName,
      lastName: lastName,
      country: country,
      email: email,
      tab: NEWSLETTER_TAB,
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
          // Fall through to next request shape.
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
      const formPayload = {};
      formPayload[NEWSLETTER_FORM_FIRST_NAME_FIELD] = firstName;
      formPayload[NEWSLETTER_FORM_LAST_NAME_FIELD] = lastName;
      formPayload[NEWSLETTER_FORM_COUNTRY_FIELD] = country;
      formPayload[NEWSLETTER_FORM_EMAIL_FIELD] = email;
      await submitGoogleForm(NEWSLETTER_FORM_URL, formPayload);
      return;
    }

    throw new Error("Newsletter endpoint is not configured.");
  }

  newsletterButtonEl.addEventListener("click", openNewsletterModal);

  newsletterCloseEls.forEach(function (button) {
    button.addEventListener("click", closeNewsletterModal);
  });

  if (newsletterSuccessCloseEl) {
    newsletterSuccessCloseEl.addEventListener("click", closeNewsletterSuccessPopup);
  }

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNewsletterModal();
      closeNewsletterSuccessPopup();
    }
  });

  newsletterFormEl.addEventListener("submit", async function (event) {
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
      setNewsletterStatus("Please enter your country.", "is-error");
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
      window.setTimeout(function () {
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
})();
