let skipCount = 0;
let adProfileData = [];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    isSkippingEnabled: true,
    skipCount: 0,
    adMetadata: [],
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "toggle-skip") {
    chrome.storage.sync.set({ isSkippingEnabled: message.isEnabled });
  } else if (message.type === "skip-count-update") {
    skipCount = message.skipCount;
    chrome.action.setBadgeText({ text: skipCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
  } else if (message.type === "ad-metadata") {
    adProfileData.push(message.data);
  } else if (message.type === "export-data") {
    sendResponse(adProfileData);
  }
});


chrome.runtime.onSuspend.addListener(() => {
  // Save any necessary data before the extension is unloaded
  chrome.storage.sync.set({
    skipCount: skipCount,
    adProfileData: adProfileData,
  });
});

chrome.runtime.onStartup.addListener(() => {
  // Retrieve saved data when the extension is loaded
  chrome.storage.sync.get(["skipCount", "adProfileData"], (data) => {
    skipCount = data.skipCount || 0;
    adProfileData = data.adProfileData || [];
  });
});
