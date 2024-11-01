let skipCount = 0;
let adMetadata = [];
let intervalId = null;


function skipAd() {
  const skipButton = document.querySelector(".ytp-skip-ad-button");
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
  };
  adMetadata.push(adData);
  chrome.runtime.sendMessage({ type: "ad-metadata", data: adData });
}

function startSkipChecker() {
  // Clear any existing interval
  if (intervalId) {
    clearInterval(intervalId);
  }

  intervalId = setInterval(() => {
    try {
      chrome.storage.sync.get("isSkippingEnabled", (data) => {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError);
          clearInterval(intervalId);
          return;
        }

        if (data.isSkippingEnabled !== false) {
          // Will run if true or undefined
          skipAd();
          trackMetadata();
        }
      });
    } catch (error) {
      console.log("Error:", error);
      clearInterval(intervalId);
    }
  }, 2000);
}

// Start the checker when the script loads
startSkipChecker();

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "toggle-skip") {
    if (message.isEnabled) {
      startSkipChecker();
    } else {
      clearInterval(intervalId);
    }
  }
});

// Clean up when the script is unloaded
window.addEventListener("unload", () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

// Handle extension context invalidation
// chrome.runtime.onSuspend.addListener(() => {
//   if (intervalId) {
//     clearInterval(intervalId);
//   }
// });
