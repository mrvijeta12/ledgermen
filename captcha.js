//! reCAPTCHA helpers for dynamically loaded popups
function ensureGrecaptchaReady(callback) {
  if (typeof grecaptcha !== "undefined" && grecaptcha.render) {
    callback();
  } else {
    setTimeout(() => ensureGrecaptchaReady(callback), 100);
  }
}

function loadCaptcha(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  return grecaptcha.render(container, {
    sitekey: "6Lc2wR8sAAAAAGG_PgbYhMpCZkEGMS3PgW6KQGFd",
    theme: "light",
  });
}

//! 🌍 GLOBAL LOCATION HELPER
window.UserLocation = (function () {
  let cachedLocation = null;
  const LS_KEY_PROMPT = "locationPromptShown";
  const LS_KEY_LOCATION = "userLocation";
  const api_key = "bdc_8fdc5cb71c624f7daaf21248f7c336c7";

  // ✅ Get browser-based geolocation (with proper user gesture handling)
  async function getGeolocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation)
        return resolve({ location: null, countryCode: null });

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log("Lat:", latitude, "Lon:", longitude);

          try {
            // Fetch the location from the PHP proxy (hosted on your server)
            const res = await fetch(
              `https://ledgermen.com/api/location.php?lat=${latitude}&lon=${longitude}`
            );

            // Check if the response is successful
            if (!res.ok) {
              console.error("Error fetching location: ", res.statusText);
              return resolve({
                location: `Lat: ${latitude.toFixed(
                  6
                )}, Lon: ${longitude.toFixed(6)}`,
                countryCode: null,
              });
            }
            // console.log(res);
            const data = await res.json();
            console.log(data);

            // Ensure address fields are retrieved properly
            const city = data.city || "";
            const countryCode = data.countryCode || "";
            const state =
              data.localityInfo?.administrative?.[1]?.name ||
              data.principalSubdivision;
            const countryName =
              data.countryName || data.principalSubdivisionCode;
            const district = data.localityInfo?.administrative?.[2]?.name || "";

            // Construct the location string (loc)
            const loc =
              city || state || countryName || district
                ? `${city}${city && (state || district) ? ", " : ""}${state}${
                    district ? ", " + district : ""
                  }${countryName ? ", " + countryName : ""}`
                : `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;

            resolve({ location: loc, countryCode });
          } catch (err) {
            console.error("Failed to fetch location:", err);
            resolve({
              location: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(
                6
              )}`,
              countryCode: null,
            });
          }
        },
        (err) => {
          console.warn("Geolocation error:", err);
          resolve({ location: null, countryCode: null });
        },
        { timeout: 8000, enableHighAccuracy: true } // Increased accuracy and timeout
      );
    });
  }

  // ✅ Fallback to IP-based location
  async function getIPLocation() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      return {
        location: `${data.city}, ${data.region}, ${data.country_name}`,
        countryCode: data.country_code,
      };
    } catch {
      return { location: null, countryCode: null };
    }
  }

  // ✅ Decide which location method to use
  async function detectLocation() {
    if (cachedLocation) return cachedLocation;

    let { location, countryCode } = await getGeolocation();
    console.log(location);
    console.log(countryCode);

    // If browser denied or failed → fallback to IP
    if (!location) ({ location, countryCode } = await getIPLocation());

    cachedLocation = { location, countryCode };
    localStorage.setItem(LS_KEY_LOCATION, JSON.stringify(cachedLocation));
    return cachedLocation;
  }

  // ✅ Custom modal prompt
  function showPrompt() {
    if (localStorage.getItem(LS_KEY_PROMPT)) return;

    const modal = document.createElement("div");
    modal.innerHTML = `
       <div class="position-fixed top-0 bottom-0 w-100 h-100 bg-dark bg-opacity-50  d-flex align-items-end  justify-content-center" style="z-index:1060;">
        <div class="bg-white p-2 text-center mx-3 container location-modal" >
          <h5>Allow Location Access?</h5>
          <p class="text-muted mb-3">
            We use your location to enhance your browsing experience and display content relevant to your region and preferences.
          </p>
          <div class="d-flex justify-content-center gap-2">
            <button id="allowLocation" class="animated-button" style="padding:6px 12px;color:#000;border-radius:6px;border:none;">Allow</button>
            <button id="denyLocation" class="animated-button" style="padding:6px 12px;color:#000;border-radius:6px;border:none;">Deny</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    // ✅ When user clicks "Allow"
    modal
      .querySelector("#allowLocation")
      .addEventListener("click", async () => {
        localStorage.setItem(LS_KEY_PROMPT, "true");
        modal.remove();

        // Browser’s own permission prompt appears here
        const locObj = (await getGeolocation()) || (await getIPLocation());
        localStorage.setItem(LS_KEY_LOCATION, JSON.stringify(locObj));
      });

    // ✅ When user clicks "Deny"
    modal.querySelector("#denyLocation").addEventListener("click", async () => {
      localStorage.setItem(LS_KEY_PROMPT, "true");
      modal.remove();

      const locObj = await getIPLocation();
      localStorage.setItem(LS_KEY_LOCATION, JSON.stringify(locObj));
    });
  }

  // ✅ Delay showing modal slightly after page load
  setTimeout(() => {
    if (!localStorage.getItem(LS_KEY_PROMPT)) showPrompt();
  }, 5000);

  // ✅ Public methods
  return {
    async getLocation() {
      const stored = localStorage.getItem(LS_KEY_LOCATION);
      if (stored) return JSON.parse(stored);
      return await detectLocation();
    },
    async refreshLocation() {
      localStorage.removeItem(LS_KEY_LOCATION);
      cachedLocation = null;
      return await detectLocation();
    },
  };
})();

//! Global toast
// main.js (top of file)
window.showToast = function (message, type = "success") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  const bgColor = type === "success" ? "bg-success" : "bg-danger";
  const toast = document.createElement("div");
  toast.className = `toast align-items-center ${bgColor} text-white border-0 show mb-2`;
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

//! GLOBAL HEADER

document.addEventListener("DOMContentLoaded", () => {
  const headerPlaceholder = document.getElementById("header-placeholder");

  //! 1️⃣ Load header (nav.html)
  fetch("nav.html")
    .then((res) => res.text())
    .then((data) => {
      headerPlaceholder.innerHTML = data;

      // 2️⃣ After header is loaded, safely query elements
      const header = document.getElementById("header");
      const menuIcon = document.getElementById("menu-icon");
      const navLinks = document.getElementById("nav-links");
      const overlay = document.getElementById("overlay");
      const policies = document.querySelectorAll(".company-policy");

      // 3️⃣ Highlight current page (top-level nav-links only)
      const currentPath = window.location.pathname;
      let currentPage = currentPath.split("/").pop();
      if (!currentPage) currentPage = "index.html";

      // Select only top-level <a> under .nav-links > li (ignore dropdown links)
      const links = headerPlaceholder.querySelectorAll(".nav-links > li > a");

      links.forEach((link) => {
        const rawHref = link.getAttribute("href") || "";

        // Skip empty or non-navigation links
        if (!rawHref || rawHref === "#" || rawHref.startsWith("javascript:"))
          return;

        // Normalize href to get file name
        let linkPage;
        try {
          linkPage = new URL(rawHref, window.location.origin).pathname
            .split("/")
            .pop();
          if (!linkPage) linkPage = "index.html";
        } catch (e) {
          return; // skip invalid hrefs
        }

        if (linkPage === currentPage) {
          link.classList.add("current");
        } else {
          link.classList.remove("current");
        }
      });

      // 4️⃣ Sticky header on scroll
      window.addEventListener("scroll", () => {
        if (window.scrollY >= 56) {
          header.classList.add("fixed");
          policies.forEach((policy) => (policy.style.paddingTop = "60px"));
        } else {
          header.classList.remove("fixed");
          policies.forEach((policy) => (policy.style.paddingTop = ""));
        }
      });

      // 5️⃣ Menu toggle functionality
      if (menuIcon && navLinks && overlay) {
        menuIcon.addEventListener("click", () => {
          navLinks.classList.toggle("active");
          menuIcon.classList.toggle("open");
          overlay.classList.toggle("visible");

          // Remove dropdowns when closing the menu
          if (!menuIcon.classList.contains("open")) {
            document
              .querySelectorAll(".dropdown")
              .forEach((d) => d.classList.remove("show"));
          }
        });

        overlay.addEventListener("click", () => {
          navLinks.classList.remove("active");
          menuIcon.classList.remove("open");
          overlay.classList.remove("visible");

          // Also hide all dropdowns
          document
            .querySelectorAll(".dropdown")
            .forEach((d) => d.classList.remove("show"));
        });
      }

      // 6️⃣ Dropdown logic setup
      setupDropdownListeners(menuIcon);
      window.addEventListener("resize", () => setupDropdownListeners(menuIcon));
    })
    .catch((err) => console.error("Error loading header:", err));
});

//! Navbar  DROPDOWN HELPER FUNCTION
function clearDropdownEventListeners(dropdowns) {
  dropdowns.forEach((dropdown) => {
    const newDropdown = dropdown.cloneNode(true);
    dropdown.parentNode.replaceChild(newDropdown, dropdown);
  });
}

//! Navbar  SCREEN BASED DROPDOWN INTERACTION FUNCTION
function setupDropdownListeners(menuIcon) {
  const dropdowns = document.querySelectorAll(".dropdown");
  clearDropdownEventListeners(dropdowns);
  const updatedDropdowns = document.querySelectorAll(".dropdown");

  if (window.innerWidth >= 768) {
    // Desktop: hover-based
    updatedDropdowns.forEach((dropdown) => {
      dropdown.addEventListener("mouseenter", () => {
        dropdown.classList.add("show");
      });
      dropdown.addEventListener("mouseleave", () => {
        dropdown.classList.remove("show");
      });
    });
  } else {
    // Mobile: click-based
    updatedDropdowns.forEach((dropdown) => {
      const dropdownLink = dropdown.querySelector("a");
      dropdownLink.addEventListener("click", (event) => {
        event.preventDefault();

        if (menuIcon.classList.contains("open")) {
          updatedDropdowns.forEach((d) => {
            if (d !== dropdown) d.classList.remove("show");
          });
          dropdown.classList.toggle("show");
        } else {
          updatedDropdowns.forEach((d) => d.classList.remove("show"));
        }
      });

      // Close if clicking outside
      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !menuIcon.contains(e.target)) {
          dropdown.classList.remove("show");
        }
      });
    });
  }
}

//! GLOBAL FOOTER

// Load footer dynamically
document.addEventListener("DOMContentLoaded", () => {
  const footerPlaceholder = document.getElementById("footer-placeholder");

  if (footerPlaceholder) {
    fetch("footer.html")
      .then((res) => res.text())
      .then((data) => {
        footerPlaceholder.innerHTML = data;
      })
      .catch((err) => console.error("Error loading footer:", err));
  }
});

//! form submitt

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  const submitSpinner = document.getElementById("submitSpinner");
  const instantCallBtn = document.getElementById("instantCallBtn");
  const instantSpinner = document.getElementById("instantSpinner");

  function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  // Function to validate name
  function isValidName(name) {
    return name.trim() !== ""; // Check if the name field is not empty
  }

  // Function to display error message in the name error span
  function showNameError(message) {
    const nameErrorSpan = document.getElementById("name-err");
    nameErrorSpan.textContent = message;
    document.getElementById("first-name").focus();
  }

  // Function to display error message in the email error span
  function showEmailError(message) {
    const emailErrorSpan = document.getElementById("email-err");
    emailErrorSpan.textContent = message;
    document.getElementById("email").focus();
  }

  // Function to clear error messages
  function clearErrors() {
    document.getElementById("name-err").textContent = "";
    document.getElementById("email-err").textContent = "";
    document.getElementById("captcha-error").innerText = "";
  }

  // Function to set email cooldown in localStorage
  function setEmailCooldown(email) {
    const cooldownData = JSON.parse(
      localStorage.getItem("emailCooldown") || "{}"
    );
    cooldownData[email] = Date.now();
    localStorage.setItem("emailCooldown", JSON.stringify(cooldownData));
  }

  // Function to check if the email cooldown is active (24 hours)
  function isEmailCooldownActive(email) {
    const cooldownData = JSON.parse(
      localStorage.getItem("emailCooldown") || "{}"
    );
    const lastSubmissionTime = cooldownData[email];

    if (!lastSubmissionTime) {
      return false; // No cooldown data for this email
    }

    const currentTime = Date.now();
    const timeDiff = currentTime - lastSubmissionTime;

    // 24 hours cooldown (in milliseconds)
    return timeDiff < 24 * 60 * 60 * 1000; // 24 hours
  }

  // Function to submit the form data to the server
  async function submitLead() {
    const formData = new FormData(form);
    const locObj = JSON.parse(
      localStorage.getItem("userLocation") ||
        '{"location":"Unknown","countryCode":""}'
    );
    formData.append("location", locObj.location);
    formData.append("countryCode", locObj.countryCode);

    try {
      const res = await fetch("api/web-lead-submission.php", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let msg = {};

      try {
        msg = JSON.parse(text);
      } catch {
        showToast("Unexpected server response", "error");
        return;
      }

      if (msg.success) {
        showToast(msg.success);
        const email = form.querySelector('input[name="email"]').value.trim();
        setEmailCooldown(email); // Set email cooldown after successful submission
        form.reset();
        grecaptcha.reset();
      } else if (msg.error) {
        showToast(msg.error, "error");
      } else {
        showToast("Something went wrong.", "errro");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error, try later.", "error");
    } finally {
      // Reset UI after submission
      submitBtn.disabled = false;
      submitSpinner.classList.add("d-none");
      if (instantCallBtn) {
        instantCallBtn.disabled = false;
      }
    }
  }

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.getElementById("cta").value = "Submit";

    const emailInput = form.querySelector('input[name="email"]');
    const nameInput = form.querySelector('input[name="name"]');
    const email = emailInput.value.trim();
    const name = nameInput.value.trim();

    // Clear previous error messages
    clearErrors();

    if (!isValidName(name)) {
      showNameError("Please enter your name");
      return; // Stop further processing
    }

    // Check if email is valid
    if (!isValidEmail(email)) {
      showEmailError("Please enter a valid email address");
      return; // Stop further processing
    }

    // EMAIL COOLDOWN CHECK
    if (isEmailCooldownActive(email)) {
      showToast(
        "Your query is already submitted. We will reach out to you within 24 hours.",
        "error"
      );
      return;
    }
    const captcha = grecaptcha.getResponse();

    if (!captcha) {
      document.getElementById("captcha-error").innerText =
        "Please verify the CAPTCHA.";
      return;
    }

    // Disable both buttons and show the respective spinners
    submitBtn.disabled = true;
    submitSpinner.classList.remove("d-none");
    if (instantCallBtn) {
      instantCallBtn.disabled = true;
      instantSpinner.classList.add("d-none");
    }

    await submitLead();
  });

  // Handle Instant Call button click
  if (instantCallBtn) {
    instantCallBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      document.getElementById("cta").value = "Instant Call";

      const emailInput = form.querySelector('input[name="email"]');
      const nameInput = form.querySelector('input[name="name"]');
      const email = emailInput.value.trim();
      const name = nameInput.value.trim();

      // Clear previous error messages
      clearErrors();

      if (!isValidEmail(email)) {
        showEmailError("Please enter a valid email address.");
        return; // Stop further processing
      }

      if (!isValidName(name)) {
        showNameError("Please enter your name.");
        return; // Stop further processing
      }

      // EMAIL COOLDOWN CHECK
      if (isEmailCooldownActive(email)) {
        showToast(
          "Your query is already submitted. We will reach out to you within 24 hours.",
          "error"
        );
        return;
      }
      const captcha = grecaptcha.getResponse();
      if (!captcha) {
        document.getElementById("captcha-error").innerText =
          "Please verify the CAPTCHA.";
        return;
      }

      // Disable both buttons and show the respective spinners
      submitBtn.disabled = true;
      instantCallBtn.disabled = true;
      submitSpinner.classList.add("d-none");
      instantSpinner.classList.remove("d-none");

      // Send OTP and handle submission

      try {
        await submitLead();

        // showToast("Your query has been submitted successfully!", "success");
        instantSpinner.classList.add("d-none");
        // Open Calendly link after form submission
        setTimeout(() => {
          window.open("https://calendly.com/ledgermen-support/30min", "_blank");
        }, 4000); // 4000 milliseconds delay
        instantCallBtn.disabled = false;
      } catch {
        console.error("Error during submission:", error);
        showToast(
          "There was an error while submitting the form. Please try again.",
          "error"
        );

        instantSpinner.classList.add("d-none");
        instantCallBtn.disabled = false; // Re-enable the Instant Call button
      }
    });
  }
});

//! popup form script

// ================= POPUP FORM LOGIC =================
async function setupPopupForm() {
  const modalPlaceholder = document.getElementById("contact-modal-placeholder");
  if (!modalPlaceholder) return;

  // small delay to let DOM attach
  await new Promise((res) => setTimeout(res, 150));

  // Load popup HTML
  const popupHtml = await fetch("popupForm.html").then((r) => r.text());
  modalPlaceholder.innerHTML = popupHtml;

  const form = document.getElementById("popupContactForm");
  const submitBtn = document.getElementById("popupSubmitBtn");
  const submitSpinner = document.getElementById("popupSubmitSpinner");
  const captchaContainerId = "popup-recaptcha";
  const modalEl = document.getElementById("contactModal");

  if (!form) return;

  let popupCaptchaId = null;

  // 3️⃣ Render the popup CAPTCHA safely
  function renderPopupCaptcha() {
    const container = document.getElementById(captchaContainerId);
    if (!container) {
      // Retry until container exists
      setTimeout(renderPopupCaptcha, 50);
      return;
    }
    popupCaptchaId = loadCaptcha(captchaContainerId); // Use the helper
  }

  // 4️⃣ Ensure grecaptcha is loaded before rendering
  ensureGrecaptchaReady(renderPopupCaptcha);

  // Validation functions
  function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  function isValidName(name) {
    return name.trim() !== "";
  }

  function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  function clearErrors() {
    ["nameError", "emailError", "popup-captcha-error"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
    });
  }

  // Shared email cooldown (same as main form)
  function isEmailCooldownActive(email) {
    const cooldownData = JSON.parse(
      localStorage.getItem("emailCooldown") || "{}"
    );
    const lastSubmissionTime = cooldownData[email];
    if (!lastSubmissionTime) return false;
    return Date.now() - lastSubmissionTime < 24 * 60 * 60 * 1000;
  }

  function setEmailCooldown(email) {
    const cooldownData = JSON.parse(
      localStorage.getItem("emailCooldown") || "{}"
    );
    cooldownData[email] = Date.now();
    localStorage.setItem("emailCooldown", JSON.stringify(cooldownData));
  }

  // Show toast (reuse global if defined)
  const toastFn =
    window.showToast ||
    function (msg, type = "success") {
      alert(msg);
    };

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.getElementById("popupcta").value = "Submit";
    clearErrors();

    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!isValidName(name)) {
      showError("nameError", "Please enter your name");
      nameInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showError("emailError", "Please enter a valid email address");
      emailInput.focus();
      return;
    }

    if (isEmailCooldownActive(email)) {
      toastFn(
        "Your query is already submitted. We will reach out to you within 24 hours.",
        "error"
      );
      return;
    }

    const captchaResponse = grecaptcha.getResponse(popupCaptchaId);
    console.log("Popup CAPTCHA response:", captchaResponse);
    if (!captchaResponse) {
      showError("popup-captcha-error", "Please verify the CAPTCHA.");
      return;
    }

    submitBtn.disabled = true;
    submitSpinner.classList.remove("d-none");

    // Prepare FormData
    const formData = new FormData(form);
    const locObj = JSON.parse(
      localStorage.getItem("userLocation") ||
        '{"location":"Unknown","countryCode":""}'
    );
    formData.append("location", locObj.location);
    formData.append("countryCode", locObj.countryCode);

    try {
      const res = await fetch("api/web-lead-submission.php", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let msg = {};
      try {
        msg = JSON.parse(text);
      } catch {
        msg = {};
      }

      if (msg.success) {
        toastFn(msg.success, "success");
        setEmailCooldown(email);
        form.reset();
        if (popupCaptchaId) {
          grecaptcha.reset(popupCaptchaId); // reset the popup CAPTCHA
        }
        const bootstrapModal = bootstrap.Modal.getInstance(modalEl);
        if (bootstrapModal) {
          bootstrapModal.hide();
          setTimeout(() => ensureGrecaptchaReady(renderPopupCaptcha), 100);
        }
      } else if (msg.error) {
        toastFn(msg.error, "error");
      } else {
        toastFn("Something went wrong.", "error");
      }
    } catch (err) {
      console.error(err);
      toastFn("Server error, try later.", "error");
    } finally {
      submitBtn.disabled = false;
      submitSpinner.classList.add("d-none");
    }
  });
}

// Call setupPopupForm after DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  setupPopupForm();
});
