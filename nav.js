// Common navigation functionality
document.addEventListener("DOMContentLoaded", () => {
  // Highlight the current page in the navigation
  const currentPath = window.location.pathname;
  const filename = currentPath.substring(currentPath.lastIndexOf("/") + 1);

  // Save the current page as the active tab
  chrome.storage.local.set({ activeTab: filename || "index.html" });

  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    const linkHref = link.getAttribute("href");
    if (
      linkHref === filename ||
      (filename === "" && linkHref === "index.html") ||
      (filename === "/" && linkHref === "index.html")
    ) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
});
