document.addEventListener("DOMContentLoaded", () => {
  const skipToggle = document.getElementById("toggle-skip");
  const skipCountDisplay = document.getElementById("skip-count");
  const exportDataBtn = document.getElementById("export-data");

  // Initialize the toggle and display elements
  chrome.storage.sync.get("isSkippingEnabled", (data) => {
    skipToggle.checked = data.isSkippingEnabled !== false; // Defaults to true
  });

  // Toggle skip functionality on or off
  skipToggle.addEventListener("change", () => {
    const isEnabled = skipToggle.checked;
    chrome.storage.sync.set({ isSkippingEnabled: isEnabled });
    chrome.runtime.sendMessage({ type: "toggle-skip", isEnabled });
  });

  // Listen for skip count update and update the display
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "skip-count-update") {
      skipCountDisplay.innerText = `Ads Skipped: ${message.skipCount}`;
      chrome.action.setBadgeText({ text: message.skipCount.toString() });
    }
  });

  // Export data when clicking the export button
  exportDataBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "export-data" }, (data) => {
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ad_data.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  });
});
