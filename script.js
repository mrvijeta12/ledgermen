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
        } else {
          header.classList.remove("fixed");
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
      })
      .catch((err) => console.error("Error loading contact modal:", err));
  }
});
