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

//! 🌍 GLOBAL LOCATION HELPER
window.UserLocation = (function () {
  let cachedLocation = null;
  const LS_KEY_PROMPT = "locationPromptShown";
  const LS_KEY_LOCATION = "userLocation";

  // ✅ Get browser-based geolocation (with proper user gesture handling)
  async function getGeolocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await res.json();
            console.log(data);

            const city = data.city || data.locality || "";
            const state = data.principalSubdivision || "";
            const country = data.countryName || "";
            const countryCode = data.countryCode || "";
            const loc =
              city || state || country
                ? `${city}${city && state ? ", " : ""}${state}${
                    country ? ", " + country : ""
                  }`
                : `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;

            resolve({ location: loc, countryCode });
          } catch {
            resolve({
              location: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(
                6
              )}`,
              countryCode: null,
            });
          }
        },
        async (err) => {
          console.warn("Geolocation error:", err);
          resolve({ location: null, countryCode: null });
        },
        { timeout: 8000 } // Increased timeout for slower devices
      );
    });
  }
  // async function getGeolocation() {
  //   return new Promise((resolve) => {
  //     if (!navigator.geolocation) return resolve(null);

  //     navigator.geolocation.getCurrentPosition(
  //       async (pos) => {
  //         const { latitude, longitude } = pos.coords;

  //         try {
  //           const res = await fetch(
  //             `https://api-bdc.com/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
  //           );

  //           const data = await res.json();
  //           console.log("BDC Data:", data);

  //           const city = data.city || data.locality || "";
  //           const state = data.principalSubdivision || "";
  //           const country = data.countryName || "";
  //           const countryCode = data.countryCode || "";

  //           const loc =
  //             city || state || country
  //               ? `${city}${city && state ? ", " : ""}${state}${
  //                   country ? ", " + country : ""
  //                 }`
  //               : `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;

  //           resolve({ location: loc, countryCode });
  //         } catch (e) {
  //           console.warn("BDC Fetch Error:", e);
  //           resolve({
  //             location: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(
  //               6
  //             )}`,
  //             countryCode: null,
  //           });
  //         }
  //       },
  //       (err) => {
  //         console.warn("Geolocation error:", err);
  //         resolve({ location: null, countryCode: null });
  //       },
  //       { timeout: 8000 }
  //     );
  //   });
  // }

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

//! GLOBAL HEADER

document.addEventListener("DOMContentLoaded", () => {
  const headerPlaceholder = document.getElementById("header-placeholder");

  // 1️⃣ Load header (nav.html)
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

//!  DROPDOWN HELPER FUNCTION
function clearDropdownEventListeners(dropdowns) {
  dropdowns.forEach((dropdown) => {
    const newDropdown = dropdown.cloneNode(true);
    dropdown.parentNode.replaceChild(newDropdown, dropdown);
  });
}

//!  SCREEN BASED DROPDOWN INTERACTION FUNCTION
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

//! GLOBAL POPUP FORM

document.addEventListener("DOMContentLoaded", () => {
  const modalPlaceholder = document.getElementById("contact-modal-placeholder");
  if (!modalPlaceholder) return;

  fetch("popupForm.html")
    .then((res) => res.text())
    .then((data) => {
      modalPlaceholder.innerHTML = data;

      const form = document.getElementById("popupContactForm");
      const popupSubmitBtn = document.getElementById("popupSubmitBtn");
      const popupSubmitSpinner = document.getElementById("popupSubmitSpinner");
      const popupModalEl = document.getElementById("contactModal");

      if (!form) return;

      let popupOtpVerified = false; // Track OTP success

      /* -----------------------------------------------------
              ⭐ UPDATED → Email-Based 24hr Cooldown
                 ----------------------------------------------------- */
      function setEmailCooldown(email) {
        const cooldownData = JSON.parse(
          localStorage.getItem("emailCooldown") || "{}"
        );
        cooldownData[email] = Date.now();
        localStorage.setItem("emailCooldown", JSON.stringify(cooldownData));
      }

      function isEmailCooldownActive(email, hours = 24) {
        const cooldownData = JSON.parse(
          localStorage.getItem("emailCooldown") || "{}"
        );
        if (!cooldownData[email]) return false;

        const last = cooldownData[email];
        const now = Date.now();
        const diffHours = (now - last) / (1000 * 60 * 60);
        return diffHours < hours;
      }

      function showToast(message, type = "success") {
        const container = document.getElementById("toast-container");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = `toast align-items-center ${
          type === "success" ? "bg-success" : "bg-danger"
        } text-white border-0 show mb-2`;
        toast.innerHTML = `
          <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
          </div>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      }

      function isValidEmail(email) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
      }

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
            showToast(msg.success, "success");
            /* -----------------------------------------------------
                     ⭐ Set Email Cooldown AFTER successful submission
                       ----------------------------------------------------- */
            const email = form
              .querySelector('input[name="email"]')
              .value.trim();

            setEmailCooldown(email);
            form.reset();
            bootstrap.Modal.getInstance(popupModalEl)?.hide();
          } else {
            showToast(msg.error || "Something went wrong", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Server error. Try again later.", "error");
        } finally {
          popupSubmitBtn.disabled = false;
          popupSubmitSpinner.classList.add("d-none");
        }
      }

      // ---------------- OTP Cancel Handling ----------------
      // ---------------- OTP Cancel Handling ----------------
      const otpModalEl = document.getElementById("otpModal");
      otpModalEl.addEventListener("hidden.bs.modal", () => {
        if (!popupOtpVerified) {
          // User manually closed/cancelled OTP modal
          popupSubmitBtn.disabled = false;
          popupSubmitSpinner.classList.add("d-none");

          // Remove leftover modal backdrop and restore body
          document
            .querySelectorAll(".modal-backdrop")
            .forEach((b) => b.remove());
          document.body.classList.remove("modal-open");
          document.body.style.overflow = ""; // restore scrolling
        }
        popupOtpVerified = false; // reset for next OTP
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailInput = form.querySelector('input[name="email"]');
        const email = emailInput.value.trim();
        /* -----------------------------------------------------
       ⭐ EMAIL COOLDOWN CHECK
        ----------------------------------------------------- */
        if (isEmailCooldownActive(email)) {
          return showToast(
            "Your query is already submitted. We will reach out to you within 24 hours.",
            "error"
          );
        }

        if (!isValidEmail(email)) {
          showToast("Please enter a valid email address.", "error");
          emailInput.focus();
          return;
        }

        popupSubmitBtn.disabled = true;
        popupSubmitSpinner.classList.remove("d-none");

        // ---------------- SEND OTP ----------------
        const sendOtpRes = await fetch("api/send_otp.php", {
          method: "POST",
          body: new URLSearchParams({ email }),
        });
        const sendOtpData = await sendOtpRes.json();

        if (!sendOtpData.success) {
          popupSubmitBtn.disabled = false;
          popupSubmitSpinner.classList.add("d-none");
          showToast(sendOtpData.error || "Failed to send OTP", "error");
          return;
        }

        // ---------------- LOAD OTP MODAL CONTENT ----------------
        const otpContent = document.getElementById("otpContent");
        const otpHTML = await fetch("otp.html").then((r) => r.text());
        otpContent.innerHTML = otpHTML;

        const emailSpan = document.getElementById("otpEmail");
        if (emailSpan) emailSpan.innerText = email;

        const otpInputs = otpContent.querySelectorAll(".otp-input");
        otpInputs.forEach((inp, i) => {
          inp.addEventListener("input", () => {
            if (inp.value.length === 1 && i < otpInputs.length - 1)
              otpInputs[i + 1].focus();
          });
        });

        bootstrap.Modal.getInstance(popupModalEl)?.hide();
        const otpModal = new bootstrap.Modal(otpModalEl, {
          backdrop: "static",
          keyboard: false,
        });
        otpModal.show();

        // ---------------- RESEND OTP ----------------
        const resendBtn = document.getElementById("resendOtpBtn");
        let resendTimer = null;

        function startResendTimer() {
          if (!resendBtn) return;
          let timer = 60;
          resendBtn.disabled = true;
          resendBtn.innerText = `Resend in ${timer}s`;

          clearInterval(resendTimer);
          resendTimer = setInterval(() => {
            timer--;
            resendBtn.innerText = `Resend in ${timer}s`;
            if (timer <= 0) {
              clearInterval(resendTimer);
              resendBtn.disabled = false;
              resendBtn.innerText = "Resend";
            }
          }, 1000);
        }

        startResendTimer();

        resendBtn.onclick = async () => {
          if (resendBtn.disabled) return;
          await fetch("api/send_otp.php", {
            method: "POST",
            body: new URLSearchParams({ email }),
          });
          startResendTimer();
        };

        // ---------------- VERIFY OTP ----------------
        document.getElementById("verifyOtpBtn").onclick = async () => {
          let otp = "";
          otpInputs.forEach((i) => (otp += i.value));

          if (otp.length !== 6) return;

          const verifyRes = await fetch("api/verify_otp.php", {
            method: "POST",
            body: new URLSearchParams({ email, otp }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            popupOtpVerified = true; // ✅ mark OTP verified
            document.getElementById("verifiedOtp").value = otp;

            otpModal.hide();
            document
              .querySelectorAll(".modal-backdrop")
              .forEach((b) => b.remove());
            document.body.classList.remove("modal-open");
            document.body.style = "";

            new bootstrap.Modal(popupModalEl).show();

            await submitLead();
          } else {
            showToast(verifyData.error, "error");
          }
        };
      });
    });
});

// -----------------------------
//! OTPManager (Reusable)
// -----------------------------
const OTPManager = (() => {
  let otpInputs, resendBtn, emailInput, otpEmail;
  let resendTimer = null;
  let timer = 60;
  let verifiedCallback = null; // callback to run after OTP verified

  function initOtpModal() {
    otpInputs = document.querySelectorAll(".otp-input");
    resendBtn = document.getElementById("resendOtpBtn");
    emailInput = document.getElementById("email");
    otpEmail = document.getElementById("otpEmail");

    // Mask email
    if (otpEmail && emailInput) {
      otpEmail.innerText = emailInput.value.replace(
        /(.{2}).+(@.+)/,
        "$1****$2"
      );
    }

    // Auto-focus & numbers only
    otpInputs.forEach((input, idx) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");
        if (input.value && idx < otpInputs.length - 1)
          otpInputs[idx + 1].focus();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && idx > 0)
          otpInputs[idx - 1].focus();
      });
      input.addEventListener("paste", (e) => {
        const paste = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(paste)) {
          otpInputs.forEach((box, i) => (box.value = paste[i] || ""));
          otpInputs[5].focus();
        }
        e.preventDefault();
      });
    });

    startResendTimer();

    // Resend OTP
    if (resendBtn) {
      resendBtn.addEventListener("click", async () => {
        if (!emailInput.value)
          return window.showToast("Email missing", "error");
        await sendOtp(emailInput.value, verifiedCallback);
      });
    }

    const verifyBtn = document.getElementById("verifyOtpBtn");
    verifyBtn?.addEventListener("click", async (e) => {
      e.preventDefault();
      const verified = await verifyOtp();
      if (verified && typeof verifiedCallback === "function") {
        verifiedCallback(); // run page-specific form submission
        verifiedCallback = null; // reset
      }
    });

    otpInputs[0]?.focus();
  }

  function startResendTimer() {
    if (!resendBtn) return;
    resendBtn.disabled = true;
    timer = 60;
    resendBtn.innerText = `Resend in ${timer}s`;

    clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      timer--;
      resendBtn.innerText = `Resend in ${timer}s`;
      if (timer <= 0) {
        clearInterval(resendTimer);
        resendBtn.disabled = false;
        resendBtn.innerText = "Resend";
      }
    }, 1000);
  }

  async function loadModal() {
    const box = document.getElementById("otpContent");
    if (!box) return;
    box.innerHTML = "Loading…";
    try {
      const res = await fetch("./otp.html");
      const html = await res.text();
      box.innerHTML = html;
      initOtpModal();
      document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
      new bootstrap.Modal("#otpModal").show();
    } catch (err) {
      console.error("Failed to load OTP:", err);
      box.innerHTML = "Failed to load OTP.";
    }
  }

  async function sendOtp(email, callback) {
    if (!email) return false;
    verifiedCallback = callback; // store the page-specific submit function
    try {
      const res = await fetch("api/send_otp.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "email=" + encodeURIComponent(email),
      });
      const data = await res.json();
      if (data.success) {
        await loadModal();
        return true;
      } else {
        window.showToast(data.error || "OTP sending failed", "error");
        return false;
      }
    } catch (err) {
      console.error(err);
      window.showToast("Server error. Try again later.", "error");
      return false;
    }
  }

  async function verifyOtp() {
    const otp = Array.from(document.querySelectorAll(".otp-input"))
      .map((i) => i.value)
      .join("");
    if (otp.length !== 6)
      return window.showToast("Enter complete 6-digit OTP", "error");

    const email = emailInput.value;
    try {
      const res = await fetch("api/verify_otp.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:
          "email=" +
          encodeURIComponent(email) +
          "&otp=" +
          encodeURIComponent(otp),
      });
      const data = await res.json();

      if (data.success) {
        const modalEl = document.getElementById("otpModal");
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance?.hide();
        setTimeout(() => {
          document
            .querySelectorAll(".modal-backdrop")
            .forEach((b) => b.remove());
          document.body.classList.remove("modal-open");
          document.body.style = "";
        }, 300);
        return true;
      } else {
        window.showToast(data.error || "Invalid OTP", "error");
        return false;
      }
    } catch (err) {
      console.error(err);
      window.showToast("Verification failed", "error");
      return false;
    }
  }

  return {
    sendOtp,
    verifyOtp,
    cancel() {
      verifiedCallback = null;
      clearInterval(resendTimer);
    },
  };
})();
