// Sticky header on scroll
window.addEventListener("scroll", function () {
  const header = document.getElementById("header");
  if (window.scrollY >= 56) {
    header.classList.add("fixed");
  } else {
    header.classList.remove("fixed");
  }
});

// Menu toggle functionality
const menuIcon = document.getElementById("menu-icon");
const navLinks = document.getElementById("nav-links");
const overlay = document.getElementById("overlay");

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

// Helper: Clear all event listeners by replacing elements
function clearDropdownEventListeners(dropdowns) {
  dropdowns.forEach((dropdown) => {
    const newDropdown = dropdown.cloneNode(true);
    dropdown.parentNode.replaceChild(newDropdown, dropdown);
  });
}

// Attach dropdown listeners based on screen size
function addDropdownListener() {
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
          // Close other dropdowns
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

// Initial setup
addDropdownListener();

// Re-apply listeners on resize
window.addEventListener("resize", addDropdownListener);
