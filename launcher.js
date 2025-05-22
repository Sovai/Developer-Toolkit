// Launcher script to redirect to the last active tab
chrome.storage.local.get(["activeTab"], function (result) {
  const defaultPage = "index.html";
  let activeTab = result.activeTab || defaultPage;

  // Handle the renamed popup.html to timestamp.html
  if (activeTab === "popup.html") {
    activeTab = "timestamp.html";
  }

  console.log("Redirecting to:", activeTab);

  // Redirect to the active tab
  window.location.replace(activeTab);
});
