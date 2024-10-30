let skipCount = 0;
let adMetadata = [];

function skipAd() {
  const skipButton = document.querySelector(".ytp-ad-skip-button");
  if (skipButton) {
    skipButton.click();
    skipCount++;
    chrome.runtime.sendMessage({ type: "skip-count-update", skipCount });
  }
}

function trackMetadata() {
  const adData = {
    timestamp: new Date(),
    title: document.title,
    url: window.location.href,
    // TODO: add more metadata from the ad metadata
  };
  adMetadata.push(adData);
  chrome.runtime.sendMessage({ type: "ad-metadata", data: adData });
}

// Check every 2 seconds for the skip button
setInterval(() => {
  if (
    chrome.storage.sync.get("isSkippingEnabled", (data) => {
      if (data.isSkippingEnabled) {
        skipAd();
        trackMetadata();
      }
    })
  );
}, 2000);
