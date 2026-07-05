// WebBot content bridge — runs on every page. On the dashboard tab it relays
// the "Pick from page" request to the background worker, and relays the picked
// locator back to the page. (Page scripts can't call chrome.* directly.)

window.addEventListener("message", (e) => {
  if (e.source !== window) return;
  const d = e.data;
  if (d && d.__webbot === "PICK_REQUEST") {
    chrome.runtime.sendMessage({ __webbot: true, type: "START_PICK" });
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.__webbot && msg.type === "PICK_RESULT") {
    window.postMessage(
      {
        __webbot: "PICK_RESULT",
        locator: msg.locator,
        count: msg.count,
        cancelled: msg.cancelled,
        error: msg.error,
      },
      "*",
    );
  }
});
