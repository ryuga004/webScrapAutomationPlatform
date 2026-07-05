# WebBot Nodes — how they work & how to build one

A **workflow** is a graph. Each box on the canvas is a **node**; the arrows
between them are **edges**. When you run a workflow, the engine starts at the
**Start** node and walks the edges, executing one node at a time.

Everything a node "knows how to do" is described by its entry in the **node
registry** — a single source of truth at [`src/lib/nodes.ts`](../src/lib/nodes.ts).
That one definition drives three things:

1. the **palette** (what you can drag onto the canvas),
2. the **config modal** (the form you fill in when you add/edit a node), and
3. **execution** (the extension looks the node up by `type` and runs it).

---

## 1. Anatomy of a node definition

```ts
{
  type: "click",              // unique id, matched by the executor
  category: "navigation",     // palette grouping + colour
  label: "Click",             // shown on the card & palette
  description: "Click an element on the page.",
  icon: "click",              // key into the icon set
  inputs: 1,                  // number of input ports (Start has 0)
  outputs: [{ id: "out" }],   // output ports; branch nodes have several
  fields: [ /* config inputs, see below */ ],
  summarize: (c) => `Click ${c.locator || "…"}`,  // one-line card summary
}
```

### Config fields

Each field renders an input in the config modal and is stored on the node's
`config` object under `name`:

```ts
{ name: "url", label: "URL", kind: "url", required: true, placeholder: "https://…" }
```

Supported `kind`s: `text`, `url`, `number`, `textarea`, `select` (needs
`options`), `variable`, `locator` (find-by strategy + selector), and `mappings`
(key→value rows).

Two useful extras:

- **`showIf(config)`** — only render/validate the field when a predicate passes.
  Example: the Loop node shows a "Next-page button" field only when its mode is
  `whileExists`.
- **`summarize(config)`** — build the human-readable line on the node card.
  Locator values are pre-formatted to strings before it runs.

### Ports & branching

- `inputs: 0` → an entry node (Start).
- `outputs: [{ id: "out" }]` → a single, linear output.
- Multiple outputs → a **branch**. The executor returns a **handle id** to pick
  which edge to follow:
  - **If / Condition** → `"true"` / `"false"`
  - **Loop** → `"loop"` (the body) and `"done"` (continue after)

---

## 2. How the engine runs a node

The extension's executor ([`extension/executor.js`](../extension/executor.js))
does a graph walk:

```
current = Start
while current exists:
    handle = execNode(current)       # do the work, return which output to take
    current = the node that `handle`'s edge points to
```

Key concepts:

- **Variables** — nodes read/write a shared `vars` map. `Set Variable` writes;
  `Extract Text` writes its result into a variable; any text field can
  interpolate with `{{ myVar }}`.
- **Locators** — how an element is found: by visible **text**, **role + name**,
  **label**, **placeholder**, **test id**, or raw **CSS**. Use the **Pick**
  button in the config modal to generate one by clicking the element.
- **Loops & scope** — inside a `forEach` loop, element lookups are *scoped* to
  the current item, so a Click inside the loop acts on "this row". A
  `whileExists` loop paginates: run the body, click the "Next" button, repeat
  until it's gone. A `fixedCount` loop repeats N times.
- **Data output** — `Append Row` accumulates rows into a named dataset;
  `Export CSV` / `Save to Text File` turn datasets/variables into downloadable
  files at the end of a run.

---

## 3. Node catalog (built-in)

| Category | Nodes |
|---|---|
| Core | Start, End, Set Variable, Note |
| Navigation | Go to URL, Click, Hover, Scroll, Go Back |
| Interaction | Fill, Type, Press Key, Wait for Element |
| Extract | Extract Text, Extract Attribute, Screenshot |
| Logic / Flow | Loop / Repeat (`forEach` · `whileExists` · `fixedCount`), If / Condition, Delay |
| Data / Output | Append Row, Export CSV, Save to Text File |

---

## 4. Adding a new node type

Two edits — the registry entry, then the runtime.

**Step 1 — declare it** in `src/lib/nodes.ts`:

```ts
{
  type: "setTitle",
  category: "interaction",
  label: "Set Page Title",
  description: "Overwrite document.title (demo node).",
  icon: "edit",
  inputs: 1,
  outputs: [{ id: "out" }],
  fields: [
    { name: "title", label: "New title", kind: "text", required: true },
  ],
  summarize: (c) => `Title → ${c.title || "…"}`,
}
```

That alone makes it appear in the palette and get a config form. Required-field
validation is automatic (via the `NodeValidatorRegistry`).

**Step 2 — implement it** in `extension/executor.js`, inside `execNode`'s switch:

```js
case "setTitle": {
  await execInPage(tabId, { action: "eval", code:
    `document.title = ${JSON.stringify(interp(c.title))}` });
  record(node, def, true);
  return "out";               // follow the "out" edge
}
```

Return the **handle id** of the output to follow (or `null` to stop, `STOP` on
error). Nodes with custom validation can register a strategy with
`nodeValidatorRegistry.register("setTitle", { validate });`.

---

## 5. Worked example — scrape a paginated list to CSV

**Goal:** collect every quote + author from all pages of
`https://quotes.toscrape.com` (a public scraping sandbox) into a CSV.

The graph:

```
Start
 └─▶ Go to URL            https://quotes.toscrape.com
      └─▶ Loop (whileExists)              ← paginate
           ├─ loop ─▶ Loop (forEach)      ← each quote card on the page
           │           └─ loop ─▶ Extract Text  → quote
           │                       └─▶ Extract Text → author
           │                             └─▶ Append Row (dataset "quotes")
           └─ done ─▶ Export CSV  (dataset "quotes" → quotes.csv)
                       └─▶ End
```

**Node config, step by step:**

1. **Go to URL** — `url: https://quotes.toscrape.com`
2. **Loop / Repeat** (outer) — `mode: whileExists`,
   **Next-page button**: Pick the *Next →* link (CSS `li.next > a`),
   `Max iterations: 20` (safety cap).
3. **Loop / Repeat** (inner) — `mode: forEach`,
   **Items to loop over**: Pick one quote card, then **Shift-click** to select
   all similar (CSS `.quote`). This iterates once per card and scopes the
   extracts below to "this card".
4. **Extract Text** — locator `.text` (scoped to the card), output variable
   `quote`.
5. **Extract Text** — locator `.author`, output variable `author`.
6. **Append Row** — dataset `quotes`, columns:
   `quote = {{quote}}`, `author = {{author}}`.
7. **Export CSV** — dataset `quotes`, filename `quotes.csv`.

**Run it:** open `quotes.toscrape.com` in a tab, open the WebBot extension, pick
this workflow, **Run on this tab**. The inner loop extracts every card on the
page; the outer loop clicks *Next* and repeats until the button disappears; then
`quotes.csv` is offered as a download.

### Why it's structured this way

- **`whileExists` outer loop** is pagination: it doesn't know how many pages
  exist, it just keeps clicking *Next* until there isn't one.
- **`forEach` inner loop** scopes each `Extract Text` to the current `.quote`,
  so `.text` / `.author` resolve *within that card* — not the first match on the
  whole page.
- **`{{variable}}`** interpolation carries data from the extract nodes into the
  `Append Row` columns.

That's the whole model: small nodes, a few variables, and loops for repetition —
no code required, and selectors picked by clicking rather than typing.
