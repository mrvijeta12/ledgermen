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

            const city = data.city || data.locality || "";
            const state = data.principalSubdivision || "";
            const country = data.countryName || "";
            const loc =
              city || state || country
                ? `${city}${city && state ? ", " : ""}${state}${
                    country ? ", " + country : ""
                  }`
                : `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;

            resolve(loc);
          } catch {
            resolve(
              `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`
            );
          }
        },
        async (err) => {
          console.warn("Geolocation error:", err);
          resolve(null);
        },
        { timeout: 8000 } // Increased timeout for slower devices
      );
    });
  }

  // ✅ Fallback to IP-based location
  async function getIPLocation() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      return `${data.city}, ${data.region}, ${data.country_name}`;
    } catch {
      return "Unknown";
    }
  }

  // ✅ Decide which location method to use
  async function detectLocation() {
    if (cachedLocation) return cachedLocation;

    let location = await getGeolocation();

    // If browser denied or failed → fallback to IP
    if (!location) location = await getIPLocation();

    cachedLocation = location;
    localStorage.setItem(LS_KEY_LOCATION, location);
    return location;
  }

  // ✅ Custom modal prompt
  function showPrompt() {
    if (localStorage.getItem(LS_KEY_PROMPT)) return;

    const modal = document.createElement("div");
    modal.innerHTML = `
      <div class="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style="z-index:1060;">
        <div class="bg-white p-4 rounded-3 shadow text-center mx-3" style="max-width: 400px;">
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
        const loc = (await getGeolocation()) || (await getIPLocation());
        localStorage.setItem(LS_KEY_LOCATION, loc);
      });

    // ✅ When user clicks "Deny"
    modal.querySelector("#denyLocation").addEventListener("click", async () => {
      localStorage.setItem(LS_KEY_PROMPT, "true");
      modal.remove();

      const loc = await getIPLocation();
      localStorage.setItem(LS_KEY_LOCATION, loc);
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
      if (stored) return stored;
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
// Load Contact Modal dynamically
document.addEventListener("DOMContentLoaded", () => {
  const modalPlaceholder = document.getElementById("contact-modal-placeholder");

  if (modalPlaceholder) {
    fetch("popupForm.html")
      .then((res) => res.text())
      .then((data) => {
        modalPlaceholder.innerHTML = data;

        // After HTML is inserted, initialize the popup form
        initPopupForm();
      })
      .catch((err) => console.error("Error loading contact modal:", err));
  }
});

function initPopupForm() {
  const form = document.getElementById("popupContactForm");
  const popupcta = document.getElementById("popupcta");
  const popupSubmitSpinner = document.getElementById("popupSubmitSpinner");
  const popupSubmitBtn = document.getElementById("popupSubmitBtn");

  if (!form) return;

  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast align-items-center ${
      type === "success" ? "bg-success" : "bg-danger"
    } text-white border-0 show mb-2`;
    toast.role = "alert";
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" 
          data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // stop normal navigation

    // --- Email Validation ---
    const emailInput = form.querySelector('input[name="email"]');
    const email = emailInput ? emailInput.value.trim() : "";
    if (!isValidEmail(email)) {
      showToast("Please enter a valid email address.", "error");
      if (emailInput) emailInput.focus();
      return; // stop submission
    }

    popupcta.value = "Submit";
    const formData = new FormData(form);
    popupSubmitBtn.disabled = true;
    popupSubmitSpinner.classList.remove("d-none");

    // --- Get location ---
    // try {
    //   const res = await fetch("https://ipapi.co/json/").catch(() => null);
    //   if (res) {
    //     const data = await res.json();
    //     formData.append(
    //       "location",
    //       `${data.city}, ${data.region}, ${data.country_name}`
    //     );
    //   } else formData.append("location", "Unknown");
    // } catch {
    //   formData.append("location", "Unknown");
    // }

    // --- Get location (from global UserLocation helper) ---
    const location = await UserLocation.getLocation();
    formData.append("location", location);

    // --- Send form data ---
    try {
      const response = await fetch("api/web-lead-submission.php", {
        method: "POST",
        body: formData,
      });
      const text = await response.text();
      let msg = {};
      try {
        msg = JSON.parse(text);
      } catch {
        showToast("Unexpected response from server", "error");
        return;
      }

      if (msg.success) {
        showToast(msg.success, "success");
        form.reset();

        const popupModal = document.getElementById("contactModal");
        const bsModal =
          bootstrap.Modal.getInstance(popupModal) ||
          new bootstrap.Modal(popupModal);
        bsModal.hide();
      } else if (msg.error) {
        showToast(msg.error, "error");
      } else {
        showToast("Something went wrong", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong", "error");
    } finally {
      popupSubmitBtn.disabled = false;
      popupSubmitSpinner.classList.add("d-none"); // hide spinner
    }
  });
}
