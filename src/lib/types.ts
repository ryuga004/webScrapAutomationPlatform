// Shared locator types used by the node registry and the config modal.

/** How an element should be located on the page. */
export type LocatorType =
  | "text" // visible text
  | "role" // ARIA role + accessible name
  | "label" // form control by its label
  | "placeholder" // input by placeholder text
  | "testid" // data-testid attribute
  | "css"; // raw CSS selector or XPath

export const LOCATOR_TYPES: {
  value: LocatorType;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    value: "text",
    label: "Text",
    hint: "Matches an element by its visible text",
    placeholder: "e.g. Show all",
  },
  {
    value: "role",
    label: "Role + name",
    hint: "Matches by accessible role and name (most robust for buttons/links)",
    placeholder: "Accessible name, e.g. Show all",
  },
  {
    value: "label",
    label: "Label",
    hint: "A form field by its <label> text",
    placeholder: "e.g. Email address",
  },
  {
    value: "placeholder",
    label: "Placeholder",
    hint: "An input by its placeholder text",
    placeholder: "e.g. Search…",
  },
  {
    value: "testid",
    label: "Test ID",
    hint: "The element's data-testid attribute",
    placeholder: "e.g. submit-button",
  },
  {
    value: "css",
    label: "CSS / XPath",
    hint: "A raw CSS selector or XPath expression",
    placeholder: "e.g. #submit, .btn.primary",
  },
];

/** Common ARIA roles offered when locating by role. */
export const ELEMENT_ROLES = [
  "button",
  "link",
  "textbox",
  "checkbox",
  "radio",
  "combobox",
  "tab",
  "menuitem",
  "option",
  "heading",
  "img",
  "switch",
  "listitem",
  "cell",
];
