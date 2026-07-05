// WebBot background — bridges the dashboard's "Pick from page" button to the
// element picker running on the tab the user actually wants to automate.
//
// Flow:  builder page --postMessage--> content-bridge --runtime--> background
//        background injects picker.js into the target tab
//        picker.js --runtime--> background --tabs.sendMessage--> content-bridge
//        content-bridge --postMessage--> builder page fills the locator field.

let builderTabId = null; // the dashboard tab that asked to pick

async function pickTargetTab() {
  const tabs = await chrome.tabs.query({});
  const usable = tabs.filter(
    (t) =>
      t.id !== builderTabId &&
      t.id != null &&
      /^https?:/.test(t.url || "") && // real web pages only
      !(t.url || "").startsWith("chrome://"),
  );
  if (!usable.length) return null;
  // The tab the user was on right before switching to the builder.
  usable.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
  return usable[0];
}

async function startPick() {
  const target = await pickTargetTab();
  if (!target) {
    if (builderTabId != null) {
      chrome.tabs.sendMessage(builderTabId, {
        __webbot: true,
        type: "PICK_RESULT",
        cancelled: true,
        error: "Open the page you want to automate in another tab, then pick again.",
      });
    }
    return;
  }
  // Bring the target tab forward so the user can click on it.
  try {
    await chrome.windows.update(target.windowId, { focused: true });
    await chrome.tabs.update(target.id, { active: true });
  } catch {
    /* best effort */
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: target.id },
      files: ["picker.js"],
    });
  } catch (e) {
    if (builderTabId != null) {
      chrome.tabs.sendMessage(builderTabId, {
        __webbot: true,
        type: "PICK_RESULT",
        cancelled: true,
        error: "Can't pick on this page (" + (e && e.message ? e.message : "blocked") + ").",
      });
    }
  }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !msg.__webbot) return;
  if (msg.type === "START_PICK") {
    builderTabId = sender.tab && sender.tab.id != null ? sender.tab.id : null;
    startPick();
  } else if (msg.type === "PICK_RESULT") {
    // Came from picker.js on the target tab — relay to the builder tab.
    if (builderTabId != null) chrome.tabs.sendMessage(builderTabId, msg);
    // Return focus to the builder so the filled field is visible.
    if (!msg.cancelled && builderTabId != null) {
      chrome.tabs.update(builderTabId, { active: true }).catch(() => {});
    }
  }
});
