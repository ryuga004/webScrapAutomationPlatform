// WebBot element picker — injected on demand into the target tab.
// Lets the user click an element on the live page; generates a robust locator
// in the SAME shape the executor resolves ({ by, role?, selector }) and
// self-verifies it by re-resolving with identical logic before returning.
// Uses only DOM APIs — no dependencies (same approach as Automa).

(function () {
  if (window.__webbotPicker) return; // guard against double-injection
  window.__webbotPicker = true;

  // ---- resolver: a faithful copy of executor.js resolveOnce, document-scoped.
  // Keeping this in lockstep with the executor is what makes "generate → verify"
  // trustworthy: if resolve() here finds the element, the runtime will too.
  const ROLE_SEL = {
    button: "button,[role=button],input[type=submit],input[type=button]",
    link: "a,[role=link]",
    textbox: "input:not([type=hidden]),textarea,[role=textbox],[contenteditable=true]",
    checkbox: "input[type=checkbox],[role=checkbox]",
    radio: "input[type=radio],[role=radio]",
    combobox: "select,[role=combobox]",
    tab: "[role=tab]",
    menuitem: "[role=menuitem]",
    option: "option,[role=option]",
    heading: "h1,h2,h3,h4,h5,h6,[role=heading]",
    img: "img,[role=img]",
    switch: "[role=switch]",
    listitem: "li,[role=listitem]",
    cell: "td,[role=cell],[role=gridcell]",
  };

  function nameOf(el) {
    return (
      el.getAttribute("aria-label") ||
      el.getAttribute("value") ||
      (el.textContent || "").trim()
    );
  }

  function resolve(loc) {
    const sel = loc.selector || "";
    const by = loc.by;
    const role = loc.role;
    try {
      switch (by) {
        case "css":
          return document.querySelector(sel);
        case "testid":
          return document.querySelector(`[data-testid="${CSS.escape(sel)}"]`);
        case "placeholder":
          return (
            Array.from(document.querySelectorAll("[placeholder]")).find((e) =>
              (e.getAttribute("placeholder") || "").toLowerCase().includes(sel.toLowerCase()),
            ) || null
          );
        case "role": {
          const cands = Array.from(document.querySelectorAll(ROLE_SEL[role] || "*"));
          if (!sel) return cands[0] || null;
          return (
            cands.find((e) => nameOf(e).toLowerCase().includes(sel.toLowerCase())) || null
          );
        }
        case "label": {
          const label = Array.from(document.querySelectorAll("label")).find((l) =>
            (l.textContent || "").toLowerCase().includes(sel.toLowerCase()),
          );
          if (!label) return null;
          const forId = label.getAttribute("for");
          return forId
            ? document.getElementById(forId)
            : label.querySelector("input,textarea,select");
        }
        case "text":
        default: {
          const all = Array.from(document.querySelectorAll("*")).filter((e) =>
            (e.textContent || "").trim().toLowerCase().includes(sel.toLowerCase()),
          );
          all.sort((a, b) => (a.textContent || "").length - (b.textContent || "").length);
          return all[0] || null;
        }
      }
    } catch {
      return null;
    }
  }

  // ---- role detection: map a concrete element to one of ROLE_SEL's keys.
  function roleOf(el) {
    const explicit = el.getAttribute("role");
    if (explicit && ROLE_SEL[explicit]) return explicit;
    const tag = el.tagName.toLowerCase();
    if (tag === "button") return "button";
    if (tag === "a" && el.hasAttribute("href")) return "link";
    if (tag === "textarea") return "textbox";
    if (tag === "select") return "combobox";
    if (tag === "input") {
      const t = (el.getAttribute("type") || "text").toLowerCase();
      if (t === "submit" || t === "button") return "button";
      if (t === "checkbox") return "checkbox";
      if (t === "radio") return "radio";
      if (t === "hidden") return null;
      return "textbox";
    }
    if (/^h[1-6]$/.test(tag)) return "heading";
    if (tag === "img") return "img";
    return null;
  }

  // ---- CSS path builder. `similar:true` drops the final :nth-of-type so the
  // selector matches every sibling in a repeating list (for loops / scraping).
  function cssPath(el, similar) {
    if (el.id && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
      return `#${CSS.escape(el.id)}`;
    }
    const parts = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === 1 && node !== document.body && depth < 6) {
      let part = node.tagName.toLowerCase();
      const cls = Array.from(node.classList)
        .filter((c) => !/^(is-|has-|js-)/.test(c) && !/\d{3,}/.test(c))
        .slice(0, 2);
      if (cls.length) part += "." + cls.map((c) => CSS.escape(c)).join(".");
      const parent = node.parentElement;
      if (parent) {
        const sibs = Array.from(parent.children).filter(
          (s) => s.tagName === node.tagName,
        );
        // Only pin the index on the target element itself, and only when we are
        // not building a "select similar" selector.
        if (sibs.length > 1 && depth === 0 && !similar) {
          part += `:nth-of-type(${sibs.indexOf(node) + 1})`;
        }
      }
      parts.unshift(part);
      node = node.parentElement;
      depth++;
    }
    return parts.join(" > ");
  }

  // ---- the generator: try strategies best-first, keep the first that verifies.
  function buildLocator(el, similar) {
    const candidates = [];

    if (!similar) {
      const testid = el.getAttribute("data-testid");
      if (testid) candidates.push({ by: "testid", selector: testid });

      const role = roleOf(el);
      const name = nameOf(el).replace(/\s+/g, " ").trim();
      if (role && name && name.length <= 60) {
        candidates.push({ by: "role", role, selector: name });
      }

      if (el.matches("input,textarea,select")) {
        // by label
        let labelText = "";
        if (el.id) {
          const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
          if (l) labelText = (l.textContent || "").trim();
        }
        if (!labelText) {
          const wrap = el.closest("label");
          if (wrap) labelText = (wrap.textContent || "").trim();
        }
        if (labelText) candidates.push({ by: "label", selector: labelText });

        const ph = el.getAttribute("placeholder");
        if (ph) candidates.push({ by: "placeholder", selector: ph });
      }

      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (text && text.length <= 60 && !el.children.length) {
        candidates.push({ by: "text", selector: text });
      }
    }

    candidates.push({ by: "css", selector: cssPath(el, similar) });

    // Return the first candidate that actually resolves back to this element.
    for (const c of candidates) {
      if (!similar && resolve(c) === el) return c;
      if (similar) return c; // similar mode targets many; skip exact verify
    }
    // Nothing verified — fall back to a pinned CSS path (always unique).
    return { by: "css", selector: cssPath(el, false) };
  }

  // ---- overlay UI ----------------------------------------------------------
  const HL_ID = "__webbot_hl";
  const BAR_ID = "__webbot_bar";

  const hl = document.createElement("div");
  hl.id = HL_ID;
  Object.assign(hl.style, {
    position: "fixed",
    zIndex: "2147483646",
    pointerEvents: "none",
    background: "rgba(34,211,238,0.22)",
    border: "2px solid #06b6d4",
    borderRadius: "3px",
    transition: "all 40ms linear",
    display: "none",
  });

  const bar = document.createElement("div");
  bar.id = BAR_ID;
  Object.assign(bar.style, {
    position: "fixed",
    zIndex: "2147483647",
    left: "50%",
    top: "16px",
    transform: "translateX(-50%)",
    background: "#0f172a",
    color: "#e2e8f0",
    font: "13px/1.4 system-ui,sans-serif",
    padding: "8px 14px",
    borderRadius: "9999px",
    boxShadow: "0 6px 24px rgba(0,0,0,.35)",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  });
  bar.textContent = "Click an element to select it  ·  Shift = select all similar  ·  Esc = cancel";

  document.documentElement.append(hl, bar);

  let current = null;

  function isOurs(el) {
    return el === hl || el === bar || el.id === HL_ID || el.id === BAR_ID;
  }

  function onMove(e) {
    const el = e.target;
    if (!el || isOurs(el)) return;
    current = el;
    const r = el.getBoundingClientRect();
    Object.assign(hl.style, {
      display: "block",
      left: r.left + "px",
      top: r.top + "px",
      width: r.width + "px",
      height: r.height + "px",
    });
  }

  function cleanup() {
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    hl.remove();
    bar.remove();
    window.__webbotPicker = false;
  }

  function send(payload) {
    try {
      chrome.runtime.sendMessage({ __webbot: true, type: "PICK_RESULT", ...payload });
    } catch {
      /* extension context gone — nothing to do */
    }
  }

  function onClick(e) {
    if (!current || isOurs(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    const similar = e.shiftKey;
    const locator = buildLocator(current, similar);
    let count = 1;
    if (similar && locator.by === "css") {
      try {
        count = document.querySelectorAll(locator.selector).length;
      } catch {
        count = 1;
      }
    }
    cleanup();
    send({ locator, count, cancelled: false });
  }

  function onKey(e) {
    if (e.key === "Escape") {
      cleanup();
      send({ cancelled: true });
    }
  }

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
})();
