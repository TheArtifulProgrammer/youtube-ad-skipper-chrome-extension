let skipCount = 0;
let adMetadata = [];
let intervalId = null;
let isExtensionValid = true;

function isButtonVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const opacity = parseFloat(style.opacity);
  const display = style.display;
  const visibility = style.visibility;

  return (
    display !== "none" &&
    visibility !== "hidden" &&
    opacity > 0 &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

function safeMessageSend(message) {
  if (!isExtensionValid) return;
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        isExtensionValid = false;
        console.error("Extension context invalidated");
        stopSkipChecker();
      }
    });
  } catch (error) {
    isExtensionValid = false;
    console.error("Failed to send message:", error);
    stopSkipChecker();
  }
}

function skipAd() {
  // Updated selector to match both formats
  const skipButton =
    document.querySelector(".ytp-skip-ad-button") ||
    document.querySelector("#skip-button\\:v") ||
    document.querySelector('[class*="skip-button"]');

  if (skipButton && isButtonVisible(skipButton)) {
    try {
      // Make button interactive
      skipButton.style.display = "block";
      skipButton.style.opacity = "1";
      skipButton.style.zIndex = "1000";
      skipButton.style.pointerEvents = "auto";

      // Simulate natural interaction
      const clickEvent = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      });

      // Click sequence
      skipButton.dispatchEvent(new MouseEvent("mouseenter"));
      skipButton.dispatchEvent(new MouseEvent("mousedown"));
      skipButton.dispatchEvent(clickEvent);
      skipButton.dispatchEvent(new MouseEvent("mouseup"));
      skipButton.dispatchEvent(new MouseEvent("mouseleave"));

      console.log("Ad skip attempted");
      skipCount++;

      // Safe message sending
      safeMessageSend({
        type: "skip-count-update",
        skipCount,
      });

      trackMetadata();
    } catch (error) {
      console.error("Error clicking skip button:", error);
    }
  }
}

function trackMetadata() {
  const adData = {
    timestamp: new Date().toISOString(),
    title: document.title,
    url: window.location.href,
    pageType: "youtube",
    skipSuccess: true,
  };
  adMetadata.push(adData);
  safeMessageSend({
    type: "ad-metadata",
    data: adData,
  });
}

function startSkipChecker() {
  stopSkipChecker(); // Clear existing interval if any

  intervalId = setInterval(() => {
    if (!isExtensionValid) {
      stopSkipChecker();
      return;
    }

    try {
      chrome.storage.sync.get("isSkippingEnabled", (data) => {
        if (chrome.runtime.lastError) {
          isExtensionValid = false;
          stopSkipChecker();
          return;
        }

        if (data.isSkippingEnabled !== false) {
          skipAd();
        }
      });
    } catch (error) {
      console.error("Error in skip checker:", error);
      stopSkipChecker();
    }
  }, 1000);
}

function stopSkipChecker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (observer) {
    observer.disconnect();
  }
}

// Mutation Observer setup
const observer = new MutationObserver((mutations) => {
  if (!isExtensionValid) {
    observer.disconnect();
    return;
  }

  for (const mutation of mutations) {
    if (mutation.type === "childList" || mutation.type === "attributes") {
      skipAd();
      break;
    }
  }
});

// Observer configuration
const observerConfig = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["style", "class"],
};

// Start observers
observer.observe(document.body, observerConfig);
startSkipChecker();

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isExtensionValid) return;

  if (message.type === "toggle-skip") {
    if (message.isEnabled) {
      startSkipChecker();
      observer.observe(document.body, observerConfig);
    } else {
      stopSkipChecker();
    }
  }
});

// Cleanup on page unload
window.addEventListener("unload", stopSkipChecker);

// Handle extension errors
window.addEventListener("error", (event) => {
  if (
    event.error &&
    event.error.message.includes("Extension context invalidated")
  ) {
    isExtensionValid = false;
    stopSkipChecker();
  }
});
