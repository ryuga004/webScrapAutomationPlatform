// WebBot workflow executor — runs a workflow graph IN THE USER'S BROWSER.
// The orchestrator (this file, running in the popup) walks the node graph and,
// for each DOM step, injects `pageOp` into the active tab to act on the live
// page. This replaces the old Playwright backend engine — same node types,
// executed by the browser instead.

// ---- injected into the page (must be self-contained: no outside refs) ----
async function pageOp(payload) {
  const {
    action,
    by,
    role,
    selector,
    value,
    attribute,
    key,
    direction,
    speed,
    scopeSelector,
    scopeIndex,
    timeout,
  } = payload;

  const root = (() => {
    if (!scopeSelector) return document;
    const items = document.querySelectorAll(scopeSelector);
    return items[scopeIndex] || null;
  })();
  if (scopeSelector && !root) return { ok: false, error: "loop item no longer on page" };

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

  function resolveOnce(r) {
    if (!r) return null;
    const sel = selector || "";
    switch (by) {
      case "css":
        try {
          return r.querySelector(sel);
        } catch {
          return null;
        }
      case "testid":
        return r.querySelector(`[data-testid="${CSS.escape(sel)}"]`);
      case "placeholder":
        return (
          Array.from(r.querySelectorAll("[placeholder]")).find((e) =>
            (e.getAttribute("placeholder") || "").toLowerCase().includes(sel.toLowerCase()),
          ) || null
        );
      case "role": {
        const cands = Array.from(r.querySelectorAll(ROLE_SEL[role] || "*"));
        if (!sel) return cands[0] || null;
        return (
          cands.find((e) => nameOf(e).toLowerCase().includes(sel.toLowerCase())) || null
        );
      }
      case "label": {
        const label = Array.from(r.querySelectorAll("label")).find((l) =>
          (l.textContent || "").toLowerCase().includes(sel.toLowerCase()),
        );
        if (!label) return null;
        const forId = label.getAttribute("for");
        return forId ? document.getElementById(forId) : label.querySelector("input,textarea,select");
      }
      case "text":
      default: {
        const all = Array.from(r.querySelectorAll("*")).filter((e) =>
          (e.textContent || "").trim().toLowerCase().includes(sel.toLowerCase()),
        );
        // smallest (deepest) element that contains the text
        all.sort((a, b) => (a.textContent || "").length - (b.textContent || "").length);
        return all[0] || null;
      }
    }
  }

  async function find(r) {
    const deadline = Date.now() + (timeout || 8000);
    let el = resolveOnce(r);
    while (!el && Date.now() < deadline) {
      await new Promise((res) => setTimeout(res, 200));
      el = resolveOnce(r);
    }
    return el;
  }

  function fire(el, type) {
    el.dispatchEvent(new Event(type, { bubbles: true }));
  }

  try {
    if (action === "count") {
      const n = root.querySelectorAll(selector).length;
      return { ok: true, value: n };
    }
    if (action === "exists") {
      return { ok: true, value: !!resolveOnce(root) };
    }
    if (action === "scroll") {
      const nap = (ms) => new Promise((r) => setTimeout(r, ms));
      // Speed controls how "to bottom" scrolling behaves. Slower = smaller
      // steps + longer pauses, which gives lazy-loaded / infinite-scroll pages
      // time to fetch and render new content. "fast" jumps instantly.
      const SPEED = {
        fast: { fraction: 0, delay: 0 },
        medium: { fraction: 0.8, delay: 300 },
        slow: { fraction: 0.4, delay: 700 },
      };
      const cfg = SPEED[speed] || SPEED.medium;

      if (direction === "top") {
        window.scrollTo(0, 0);
      } else if (direction === "element") {
        const el = await find(root);
        if (el) el.scrollIntoView({ block: "center", behavior: "auto" });
      } else if (cfg.fraction === 0) {
        window.scrollTo(0, document.body.scrollHeight);
      } else {
        // Step down through the page, pausing between steps, until we reach the
        // bottom AND the page height stops growing (nothing left to lazy-load).
        const stepPx = Math.max(200, Math.round(window.innerHeight * cfg.fraction));
        const deadline = Date.now() + 30000; // hard cap so this can't hang
        let lastHeight = -1;
        let stableAtBottom = 0;
        for (let i = 0; i < 400 && Date.now() < deadline; i++) {
          window.scrollBy(0, stepPx);
          await nap(cfg.delay);
          const docHeight = document.body.scrollHeight;
          const atBottom =
            window.innerHeight + window.scrollY >= docHeight - 4;
          if (atBottom && docHeight === lastHeight) {
            if (++stableAtBottom >= 2) break; // settled — no new content
          } else {
            stableAtBottom = 0;
          }
          lastHeight = docHeight;
        }
      }
      return { ok: true };
    }

    const el = await find(root);
    if (!el) return { ok: false, error: "element not found" };

    switch (action) {
      case "click":
        el.click();
        return { ok: true };
      case "hover":
        el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        return { ok: true };
      case "fill":
      case "type":
        el.focus();
        if ("value" in el) {
          el.value = value ?? "";
          fire(el, "input");
          fire(el, "change");
        } else {
          el.textContent = value ?? "";
          fire(el, "input");
        }
        return { ok: true };
      case "pressKey": {
        const opts = { key, bubbles: true };
        el.dispatchEvent(new KeyboardEvent("keydown", opts));
        el.dispatchEvent(new KeyboardEvent("keyup", opts));
        if (key === "Enter" && el.form && el.form.requestSubmit) el.form.requestSubmit();
        return { ok: true };
      }
      case "waitForElement":
        return { ok: true };
      case "extractText":
        return { ok: true, value: (el.textContent || "").trim() };
      case "extractAttribute":
        return { ok: true, value: el.getAttribute(attribute || "href") ?? "" };
      default:
        return { ok: false, error: "unknown action " + action };
    }
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

// ---- orchestrator (runs in the popup) ----
const WebBotExecutor = (() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function execInPage(tabId, payload) {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: pageOp,
      args: [payload],
    });
    return result;
  }

  async function gotoAndWait(tabId, url) {
    await chrome.tabs.update(tabId, { url });
    const deadline = Date.now() + 30000;
    // give the navigation a moment to start, then wait for "complete"
    await sleep(300);
    while (Date.now() < deadline) {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === "complete") return;
      await sleep(250);
    }
  }

  async function runWorkflow(wf, tabId, onProgress) {
    const nodeById = new Map(wf.nodes.map((n) => [n.id, n]));
    const edges = wf.edges || [];
    const vars = {};
    const datasets = {};
    const textBuf = {};
    const results = [];
    let scope = null; // { scopeSelector, scopeIndex }
    let iteration;
    let execCount = 0;

    const interp = (s) =>
      (s || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => vars[k] ?? "");

    const edgeTarget = (nodeId, handle) => {
      const e = edges.find(
        (e) => e.source === nodeId && (e.sourceHandle || "out") === handle,
      );
      return e ? e.target : undefined;
    };

    const locPayload = (loc, extra) => ({
      by: (loc && loc.by) || "css",
      role: loc && loc.role,
      selector: interp(loc && loc.selector),
      scopeSelector: scope && scope.scopeSelector,
      scopeIndex: scope && scope.scopeIndex,
      ...extra,
    });

    function record(node, def, ok, extra) {
      const r = { nodeId: node.id, type: node.type, label: def.label, ok, ...extra };
      if (iteration !== undefined) r.iteration = iteration;
      results.push(r);
      if (onProgress) onProgress(r);
    }

    async function execNode(node) {
      const def = LABELS[node.type] || { label: node.type };
      const c = node.config || {};
      try {
        switch (node.type) {
          case "start":
          case "note":
          case "end":
            record(node, def, true);
            return node.type === "end" ? null : "out";

          case "setVariable":
            vars[interp(c.name)] = interp(c.value);
            record(node, def, true);
            return "out";

          case "goto":
            await gotoAndWait(tabId, interp(c.url));
            record(node, def, true);
            return "out";
          case "goBack":
            await chrome.tabs.goBack(tabId).catch(() => {});
            await sleep(500);
            record(node, def, true);
            return "out";
          case "wait":
          case "delay":
            await sleep(Math.min(Number(c.ms) || 0, 60000));
            record(node, def, true);
            return "out";

          case "click":
          case "hover":
          case "fill":
          case "type":
          case "pressKey":
          case "waitForElement":
          case "scroll": {
            const r = await execInPage(
              tabId,
              locPayload(c.locator, {
                action: node.type,
                value: interp(c.value),
                key: interp(c.key),
                direction: c.direction,
                speed: c.speed,
                timeout: node.type === "waitForElement" ? 15000 : 8000,
              }),
            );
            record(node, def, r.ok, r.ok ? {} : { message: humanError(r.error) });
            if (!r.ok) return STOP;
            return "out";
          }

          case "extractText":
          case "extractAttribute": {
            const r = await execInPage(
              tabId,
              locPayload(c.locator, {
                action: node.type,
                attribute: interp(c.attribute) || "href",
              }),
            );
            const out = c.output || (node.type === "extractText" ? "text" : "value");
            vars[out] = r.ok ? r.value || "" : "";
            const warn = r.ok && !(r.value || "").trim() ? `Extracted empty into “${out}”` : undefined;
            record(node, def, r.ok, r.ok ? { message: warn, warning: !!warn } : { message: humanError(r.error) });
            if (!r.ok) return STOP;
            return "out";
          }

          case "if": {
            let pass;
            const left = interp(c.left);
            const right = interp(c.right);
            if (c.op === "empty") pass = left.trim() === "";
            else if (c.op === "equals") pass = left === right;
            else if (c.op === "contains") pass = left.includes(right);
            else if (c.op === "exists") {
              const r = await execInPage(tabId, locPayload(c.locator, { action: "exists" }));
              pass = !!(r && r.value);
            } else pass = left.trim() !== "";
            record(node, def, true, { message: pass ? "→ true" : "→ false" });
            return pass ? "true" : "false";
          }

          case "loop": {
            const mode = c.mode || "forEach";
            const bodyStart = edgeTarget(node.id, "loop");
            const cap = Number(c.limit) || 0; // 0 = no user cap
            const savedScope = scope;
            const savedIter = iteration;

            if (mode === "whileExists") {
              // Pagination: run body, click "Next", repeat until it's gone.
              const max = cap || 100; // hard safety ceiling
              record(node, def, true, { message: "Paginating…" });
              let ran = 0;
              if (bodyStart) {
                for (let i = 0; i < max; i++) {
                  scope = null;
                  iteration = i;
                  const stopped = await walk(bodyStart, node.id);
                  ran++;
                  if (stopped === STOP) break;
                  const has = await execInPage(
                    tabId,
                    locPayload(c.nextLocator, { action: "exists" }),
                  );
                  if (!has || !has.value) break; // no more pages
                  const clicked = await execInPage(
                    tabId,
                    locPayload(c.nextLocator, { action: "click" }),
                  );
                  if (!clicked.ok) break;
                  await sleep(1200); // let the next page render
                }
              }
              scope = savedScope;
              iteration = savedIter;
              record(node, def, true, { message: `Ran ${ran} page(s)` });
              return "done";
            }

            if (mode === "fixedCount") {
              const n = Math.max(0, Number(c.count) || 0);
              record(node, def, true, { message: `Repeating ${n}×` });
              if (bodyStart) {
                for (let i = 0; i < n; i++) {
                  scope = null;
                  iteration = i;
                  const stopped = await walk(bodyStart, node.id);
                  if (stopped === STOP) break;
                }
              }
              scope = savedScope;
              iteration = savedIter;
              return "done";
            }

            // forEach — iterate elements matching the locator on the page.
            const r = await execInPage(
              tabId,
              locPayload(c.locator, { action: "count" }),
            );
            const total = r.ok ? r.value : 0;
            const n = cap ? Math.min(total, cap) : total;
            record(
              node,
              def,
              true,
              n === 0
                ? {
                    message:
                      "Matched 0 elements — check the “Items to loop over” selector (use Shift-click to select all similar)",
                    warning: true,
                  }
                : { message: `Looping over ${n} item(s)` },
            );
            if (bodyStart) {
              const loopSel = interp(c.locator && c.locator.selector);
              for (let i = 0; i < n; i++) {
                scope = { scopeSelector: loopSel, scopeIndex: i };
                iteration = i;
                const stopped = await walk(bodyStart, node.id);
                if (stopped === STOP) break;
              }
            }
            scope = savedScope;
            iteration = savedIter;
            return "done";
          }

          case "appendRow": {
            const ds = c.dataset || "results";
            const row = {};
            for (const m of c.columns || []) if (m.key) row[m.key] = interp(m.value);
            (datasets[ds] = datasets[ds] || []).push(row);
            const empty = (c.columns || []).length && Object.values(row).every((v) => v === "");
            record(node, def, true, empty ? { message: "All values empty — check {{names}}", warning: true } : {});
            return "out";
          }
          case "exportCsv": {
            const ds = c.dataset || "results";
            const rows = datasets[ds] || [];
            files[interp(c.filename) || `${ds}.csv`] = { content: toCsv(rows), type: "text/csv" };
            record(node, def, rows.length > 0, rows.length ? {} : { message: `Dataset “${ds}” empty — add Append Row`, warning: true });
            return "out";
          }
          case "exportText": {
            const fname = interp(c.filename) || "output.txt";
            const content = interp(c.content);
            if (c.mode === "overwrite") textBuf[fname] = content;
            else textBuf[fname] = (textBuf[fname] !== undefined ? textBuf[fname] + "\n" : "") + content;
            files[fname] = { content: textBuf[fname], type: "text/plain" };
            record(node, def, true, !content.trim() ? { message: "Wrote empty text", warning: true } : {});
            return "out";
          }

          default:
            record(node, def, true, { message: "not supported in extension yet", warning: true });
            return "out";
        }
      } catch (e) {
        record(node, def, false, { message: String(e && e.message ? e.message : e) });
        return STOP;
      }
    }

    const files = {};

    async function walk(startId, stopAt) {
      let current = startId;
      while (current && current !== stopAt) {
        if (++execCount > 5000) throw new Error("too many steps");
        const node = nodeById.get(current);
        if (!node) break;
        const handle = await execNode(node);
        if (handle === STOP) return STOP;
        if (handle === null) break;
        current = edgeTarget(current, handle);
      }
    }

    const start =
      wf.nodes.find((n) => n.type === "start") ||
      wf.nodes.find((n) => !edges.some((e) => e.target === n.id));
    if (!start) return { ok: false, error: "No Start node", results: [], datasets, files };

    await walk(start.id);
    const ok = results.every((r) => r.ok);
    return { ok, results, datasets, files };
  }

  return { runWorkflow };
})();

const STOP = "__STOP__";

const LABELS = {
  start: { label: "Start" }, end: { label: "End" }, note: { label: "Note" },
  setVariable: { label: "Set Variable" }, goto: { label: "Go to URL" },
  goBack: { label: "Go Back" }, wait: { label: "Wait" }, delay: { label: "Delay" },
  click: { label: "Click" }, hover: { label: "Hover" }, scroll: { label: "Scroll" },
  waitForElement: { label: "Wait for Element" }, fill: { label: "Fill" },
  type: { label: "Type" }, pressKey: { label: "Press Key" },
  selectOption: { label: "Select Option" }, extractText: { label: "Extract Text" },
  extractAttribute: { label: "Extract Attribute" }, if: { label: "If" },
  loop: { label: "Loop" }, appendRow: { label: "Append Row" },
  exportCsv: { label: "Export CSV" }, exportText: { label: "Save to Text File" },
};

function humanError(err) {
  if (/not found/i.test(err || "")) return "Couldn't find the element — check the selector / Find by.";
  return err || "Step failed";
}

function toCsv(rows) {
  if (!rows.length) return "";
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.map(esc).join(","), ...rows.map((r) => cols.map((k) => esc(r[k] ?? "")).join(","))].join("\n");
}
