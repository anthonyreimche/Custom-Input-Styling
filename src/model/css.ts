// Compiles the effective tweaks (plus the user's custom CSS) into one
// stylesheet against Safelight's documented styling hooks
// (docs/dev/api/components.md → Styling hooks). Extension sheets are unlayered
// and cascade after core, so they beat Tailwind utility classes without
// !important — nothing here uses it. Only aspects that differ from the stock
// look emit rules, so the Safelight preset compiles to an empty string.

import { STOCK, type Checkbox, type Corners, type FocusZoom, type Knob, type Tweaks } from "./types.ts";

export interface Hook {
  selector: string;
  what: string;
}

/** The core selectors this extension styles, for the panel hint and README. */
export const HOOKS: readonly Hook[] = [
  { selector: "button", what: "every push button (add :not(.sl-switch):not(.sl-select) to skip switches and dropdowns)" },
  { selector: ".sl-segmented", what: "segmented control container" },
  { selector: ".sl-select", what: "dropdown trigger" },
  { selector: ".sl-switch, .sl-switch-track, .sl-switch-knob", what: "toggle switch, its track and its knob" },
  { selector: ".sl-slider-track, .sl-slider-fill", what: "Develop slider track and filled bar" },
  { selector: ".sl-slider-thumb", what: "Develop slider knob at the value (display: none until you show it)" },
  { selector: ".sl-slider-marker", what: "value marker on gradient (HSL) tracks" },
  { selector: ".sl-slider-value, .sl-slider-label", what: "the slider's numeric field and label" },
  { selector: ".sl-slider", what: "native range inputs (Preferences)" },
  { selector: 'input[type="checkbox"]', what: "checkboxes" },
  { selector: 'input[type="text"], input[type="number"], textarea', what: "text and number fields" },
];

const PUSH_BUTTONS = "button:not(.sl-switch):not(.sl-select)";
const FIELDS =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]), textarea';
const KNOB_FACE = "var(--color-text-primary)";

type Declarations = Record<string, string>;

function rule(selector: string, declarations: Declarations): string {
  const body = Object.entries(declarations)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}

function cornersRules(corners: Corners): string[] {
  if (corners === "rounded") return [];
  if (corners === "square") {
    return [
      rule(
        `${PUSH_BUTTONS}, ${FIELDS}, .sl-select, .sl-segmented, .sl-slider-track, .sl-slider-fill, .sl-slider, .sl-slider::-moz-range-track`,
        { "border-radius": "0" },
      ),
      rule(".sl-switch-track, .sl-switch-knob", { "border-radius": "2px" }),
    ];
  }
  return [rule(`${PUSH_BUTTONS}, ${FIELDS}, .sl-select, .sl-segmented`, { "border-radius": "9999px" })];
}

function knobShape(knob: Exclude<Knob, "none">): Declarations {
  switch (knob) {
    case "round":
      return { "border-radius": "50%" };
    case "square":
      return { "border-radius": "2px" };
    case "line":
      return { "border-radius": "1px" };
    case "pointed":
      // A pentagon pointing down at the track.
      return { "clip-path": "polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)" };
  }
}

function knobRules(knob: Knob, size: number, trackSize: number): string[] {
  if (knob === "none") return [];
  const face: Declarations = {
    width: `${knob === "line" ? 2 : size}px`,
    height: `${size}px`,
    background: KNOB_FACE,
    "box-shadow": "0 1px 2px rgba(0, 0, 0, 0.4)",
    ...knobShape(knob),
  };
  return [
    rule(".sl-slider-thumb", { display: "block", ...face }),
    rule(".sl-slider-marker", face),
    // WebKit lays the thumb out from the top of the track box; the negative
    // margin centres it. Gecko centres on its own.
    rule(".sl-slider::-webkit-slider-thumb", {
      "-webkit-appearance": "none",
      appearance: "none",
      border: "none",
      "margin-top": `${(trackSize - size) / 2}px`,
      ...face,
    }),
    rule(".sl-slider::-moz-range-thumb", { border: "none", ...face }),
  ];
}

function trackRules(size: number): string[] {
  if (size === STOCK.trackSize) return [];
  return [rule(".sl-slider-track, .sl-slider, .sl-slider::-moz-range-track", { height: `${size}px` })];
}

function checkboxRules(checkbox: Checkbox, corners: Corners): string[] {
  if (checkbox === "native") return [];
  const radius = corners === "square" ? "0" : corners === "pill" ? "50%" : "3px";
  return [
    rule('input[type="checkbox"]', {
      "-webkit-appearance": "none",
      appearance: "none",
      width: "13px",
      height: "13px",
      margin: "0",
      "flex-shrink": "0",
      border: "1px solid var(--color-border)",
      "border-radius": radius,
      background: "var(--color-surface-2)",
      display: "inline-grid",
      "place-content": "center",
      "vertical-align": "middle",
      cursor: "pointer",
    }),
    rule('input[type="checkbox"]::before', {
      content: '""',
      width: "7px",
      height: "7px",
      transform: "scale(0)",
      background: "var(--color-text-primary)",
      "clip-path": "polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)",
    }),
    rule('input[type="checkbox"]:checked', {
      background: "var(--color-slider-fill)",
      "border-color": "var(--color-slider-fill)",
    }),
    rule('input[type="checkbox"]:checked::before', { transform: "scale(1)" }),
    rule('input[type="checkbox"]:focus-visible', {
      outline: "1px solid var(--color-text-primary)",
      "outline-offset": "1px",
    }),
  ];
}

function focusRules(zoom: FocusZoom): string[] {
  if (zoom === "off") return [];
  const scale = zoom === "subtle" ? 1.2 : 1.45;
  return [
    rule('.sl-slider-value:focus, input[type="number"]:focus', {
      transform: `scale(${scale})`,
      "transform-origin": "right center",
      position: "relative",
      "z-index": "2",
      background: "var(--color-surface-2)",
      "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.35)",
    }),
  ];
}

/** Open minus close braces outside strings and comments — the panel's only
 *  check on custom CSS (the browser parser recovers from everything else). */
export function braceBalance(css: string): number {
  let depth = 0;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
    } else if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end < 0 ? css.length : end + 1;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  return depth;
}

export function compileCss(tweaks: Tweaks, customCss: string): string {
  const rules = [
    ...cornersRules(tweaks.corners),
    ...knobRules(tweaks.knob, tweaks.knobSize, tweaks.trackSize),
    ...trackRules(tweaks.trackSize),
    ...checkboxRules(tweaks.checkbox, tweaks.corners),
    ...focusRules(tweaks.focusZoom),
  ];
  return [rules.join("\n\n"), customCss.trim()].filter(Boolean).join("\n\n");
}
