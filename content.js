let skipCount = 0;
let adMetadata = [];
let intervalId = null;

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

function skipAd() {
  const skipButton = document.querySelector("#skip-button\\:v");

  if (skipButton && isButtonVisible(skipButton)) {
    try {
      // Force the button to be visible and clickable
      skipButton.style.display = "block";
      skipButton.style.opacity = "1";
      skipButton.style.zIndex = "1000"; // Bring to foreground
      skipButton.dispatchEvent(new MouseEvent("mouseenter"));
      skipButton.focus(); // Focus before click // Attempt to click with a small delay
      skipButton.blur(); // simulate a click

      setTimeout(() => {
        skipButton.click();
        skipButton.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
        skipButton.dispatchEvent(new MouseEvent("mousedown"));
        skipButton.dispatchEvent(new MouseEvent("mouseup"));
        console.log("Ad skip attempted");
        skipCount++;
        chrome.runtime.sendMessage({ type: "skip-count-update", skipCount }); // Track metadata after successful skip

        trackMetadata();
      }, 300); // Adjust delay if needed
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
  chrome.runtime.sendMessage({ type: "ad-metadata", data: adData });
}

function startSkipChecker() {
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Use a more frequent interval for better response
  intervalId = setInterval(() => {
    try {
      chrome.storage.sync.get("isSkippingEnabled", (data) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          clearInterval(intervalId);
          return;
        }

        if (data.isSkippingEnabled !== false) {
          skipAd();
        }
      });
    } catch (error) {
      console.error("Error in skip checker:", error);
      clearInterval(intervalId);
    }
  }, 500); // Check more frequently for better response
}

// Create a mutation observer to watch for new skip buttons
const observerConfig = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["style", "class"],
};

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList" || mutation.type === "attributes") {
      skipAd();
    }
  });
});

// Start observing the document
observer.observe(document.body, observerConfig);

// Start the checker when the script loads
startSkipChecker();

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "toggle-skip") {
    if (message.isEnabled) {
      startSkipChecker();
      observer.observe(document.body, observerConfig);
    } else {
      clearInterval(intervalId);
      observer.disconnect();
    }
  }
});

// Clean up when the script is unloaded
window.addEventListener("unload", () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  observer.disconnect();
});
