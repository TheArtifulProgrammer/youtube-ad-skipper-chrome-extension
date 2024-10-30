document.addEventListener("DOMContentLoaded", () => {
  const skipToggle = document.getElementById("toggle-skip");
  const skipCountDisplay = document.getElementById("skip-count");
  const exportDataBtn = document.getElementById("export-data");

  chrome.storage.sync.get("isSkippingEnabled", (data) => {
    skipToggle.checked = data.isSkippingEnabled || true;
  });

  skipToggle.addEventListener("change", () => {
    chrome.storage.sync.set({ isSkippingEnabled: skipToggle.checked });
    chrome.runtime.sendMessage({
      type: "toggle-skip",
      isEnabled: skipToggle.checked,
    });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "skip-count-update") {
      skipCountDisplay.innerText = message.skipCount;
      chrome.action.setBadgeText({ text: message.skipCount.toString() });
    }
  });

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
