// The CSS compiler: every tweak value emits (or omits) the rules for its hook
// selectors, the stock look compiles to nothing, and custom CSS lands last,
// untouched. Run: node --experimental-strip-types src/model/css.test.ts

import assert from "node:assert/strict";
import { HOOKS, braceBalance, compileCss } from "./css.ts";
import { PRESETS } from "./presets.ts";
import { STOCK, type Tweaks } from "./types.ts";

const tweaks = (patch: Partial<Tweaks>): Tweaks => ({ ...STOCK, ...patch });
const has = (css: string, ...parts: string[]): void => {
  for (const p of parts) assert.ok(css.includes(p), `expected CSS to contain ${JSON.stringify(p)}\n${css}`);
};
const lacks = (css: string, ...parts: string[]): void => {
  for (const p of parts) assert.ok(!css.includes(p), `expected CSS to omit ${JSON.stringify(p)}\n${css}`);
};

// ── stock ────────────────────────────────────────────────────────────────────

assert.equal(compileCss(STOCK, ""), "", "the stock look emits no CSS at all");

// ── corners ──────────────────────────────────────────────────────────────────

{
  const css = compileCss(tweaks({ corners: "square" }), "");
  has(
    css,
    "button:not(.sl-switch):not(.sl-select)",
    "border-radius: 0",
    ".sl-switch-track",
    ".sl-switch-knob",
    ".sl-slider-track",
    ".sl-slider-fill",
    ".sl-slider",
    ".sl-select",
    ".sl-segmented",
    "textarea",
  );
  lacks(css, "9999px");
}
{
  const css = compileCss(tweaks({ corners: "pill" }), "");
  has(css, "border-radius: 9999px", "button:not(.sl-switch):not(.sl-select)", ".sl-select", ".sl-segmented");
  lacks(css, "border-radius: 0;", ".sl-switch-track");
}

// ── knob ─────────────────────────────────────────────────────────────────────

lacks(compileCss(tweaks({ knob: "none", knobSize: 16 }), ""), ".sl-slider-thumb", "slider-thumb");
{
  const css = compileCss(tweaks({ knob: "round" }), "");
  has(
    css,
    ".sl-slider-thumb",
    "display: block",
    "width: 12px",
    "height: 12px",
    "border-radius: 50%",
    ".sl-slider::-webkit-slider-thumb",
    ".sl-slider::-moz-range-thumb",
    ".sl-slider-marker",
    "var(--color-text-primary)",
  );
  lacks(css, "clip-path");
}
{
  const css = compileCss(tweaks({ knob: "square", knobSize: 10 }), "");
  has(css, "width: 10px", "height: 10px", "border-radius: 2px");
  lacks(css, "clip-path", "border-radius: 50%");
}
has(compileCss(tweaks({ knob: "pointed" }), ""), "clip-path: polygon(");
{
  const css = compileCss(tweaks({ knob: "line", knobSize: 14 }), "");
  has(css, "width: 2px", "height: 14px");
  lacks(css, "clip-path");
}

// ── track ────────────────────────────────────────────────────────────────────

{
  const css = compileCss(tweaks({ trackSize: 4 }), "");
  has(css, ".sl-slider-track", "height: 4px", ".sl-slider::-moz-range-track");
}
lacks(compileCss(tweaks({ trackSize: 6 }), ""), "height: 6px");

// ── checkbox ─────────────────────────────────────────────────────────────────

{
  const css = compileCss(tweaks({ checkbox: "styled" }), "");
  has(
    css,
    'input[type="checkbox"]',
    "appearance: none",
    "::before",
    ":checked",
    ":focus-visible",
    "var(--color-slider-fill)",
    "border-radius: 3px",
  );
}
has(compileCss(tweaks({ checkbox: "styled", corners: "pill" }), ""), 'input[type="checkbox"]', "border-radius: 50%");
{
  const css = compileCss(tweaks({ checkbox: "styled", corners: "square" }), "");
  has(css, 'input[type="checkbox"]');
  lacks(css, "border-radius: 3px", "border-radius: 50%");
}

// ── focus zoom ───────────────────────────────────────────────────────────────

{
  const css = compileCss(tweaks({ focusZoom: "subtle" }), "");
  has(css, ".sl-slider-value:focus", 'input[type="number"]:focus', "scale(1.2)", "z-index");
}
has(compileCss(tweaks({ focusZoom: "large" }), ""), "scale(1.45)");
lacks(compileCss(tweaks({ focusZoom: "off" }), ""), "scale(");

// ── custom CSS ───────────────────────────────────────────────────────────────

{
  const custom = "/* mine */\nbutton { letter-spacing: 1px }";
  const css = compileCss(tweaks({ knob: "round" }), custom);
  assert.ok(css.endsWith(custom), "custom CSS is the last chunk, verbatim");
  assert.ok(css.indexOf(".sl-slider-thumb") < css.indexOf(custom), "custom CSS comes after the compiled rules");
}
assert.equal(compileCss(STOCK, "button{}"), "button{}", "stock + custom is just the custom CSS");

// ── presets ──────────────────────────────────────────────────────────────────

for (const p of PRESETS) {
  const css = compileCss(p.tweaks, "");
  if (p.id === "safelight") assert.equal(css, "");
  else assert.ok(css.length > 0, `${p.id} emits CSS`);
}

// ── braceBalance (the panel's only validation of custom CSS) ─────────────────

assert.equal(braceBalance(""), 0);
assert.equal(braceBalance("a { b: c }"), 0);
assert.equal(braceBalance("@media (x) { a { b: c } }"), 0);
assert.equal(braceBalance("a { b: c "), 1, "one unclosed block");
assert.equal(braceBalance("a { b: c } }"), -1, "one stray close");
assert.equal(braceBalance('a::before { content: "}" }'), 0, "braces inside strings don't count");
assert.equal(braceBalance("/* { */ a { b: c }"), 0, "braces inside comments don't count");

// ── hooks reference ──────────────────────────────────────────────────────────

assert.ok(HOOKS.some((h) => h.selector === ".sl-slider-thumb"));
assert.ok(HOOKS.some((h) => h.selector.includes("checkbox")));
assert.ok(HOOKS.every((h) => h.selector.length > 0 && h.what.length > 0));

console.log("css OK");
