// Launcher script to redirect to the last active tab
chrome.storage.local.get(["activeTab"], function (result) {
  const defaultPage = "index.html";
  let activeTab = result.activeTab || defaultPage;
  // Redirect to the active tab
  window.location.replace(activeTab);
});
