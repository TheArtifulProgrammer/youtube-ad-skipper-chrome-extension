let skipCount = 0;
let adProfileData = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "toggle-skip") {
    chrome.storage.sync.set({ isSkippingEnabled: message.isEnabled });
  } else if (message.type === "skip-count-update") {
    skipCount = message.skipCount;
    chrome.action.setBadgeText({ text: skipCount.toString() });
  } else if (message.type === "ad-metadata") {
    adProfileData.push(message.data);
  } else if (message.type === "export-data") {
    sendResponse(adProfileData);
  }
});
