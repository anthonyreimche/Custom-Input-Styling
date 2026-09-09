// Smoke test against the built bundle: run `npm run smoke` (builds first).
// Mocks the SafelightAPI, drives activate() and checks that the saved config
// compiles to the registered stylesheet, that changes from any window
// re-apply, that a host without the stylesheet API degrades gracefully, and
// that the Preferences panel server-renders across every preset. The pure
// model (sanitizing, resolving, compiling) is covered by src/model/*.test.ts.

import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";

const h = React.createElement;
const SHEET_ID = "com.safelight.input-styling.controls";
const TOKENS = [
  "surface0", "surface1", "surface2", "surface3", "surface4", "border", "borderSubtle",
  "textPrimary", "textSecondary", "textMuted", "accent", "accentHover", "sliderFill", "rating", "fontMono",
];

// Plain-element stand-ins for api.ui so the panel renders outside the app.
function stubUi() {
  const flex = (direction) => (p) =>
    h("div", { style: { display: "flex", flexDirection: direction, gap: p.gap ?? 8, ...p.style } }, p.children);
  return {
    Button: (p) => h("button", { type: "button", onClick: p.onClick, disabled: p.disabled, title: p.title }, p.children),
    Select: (p) =>
      h(
        "select",
        { value: p.value, onChange: (e) => p.onChange(e.target.value), disabled: p.disabled, "aria-label": p.ariaLabel },
        p.options.map((o) => h("option", { key: o.value, value: o.value, disabled: o.disabled }, o.label)),
      ),
    NumberInput: (p) =>
      h("input", { type: "number", value: p.value, onChange: (e) => p.onChange(Number(e.target.value)), disabled: p.disabled, "aria-label": p["aria-label"] }),
    TextArea: (p) =>
      h("textarea", { value: p.value, onChange: (e) => p.onChange(e.target.value), rows: p.rows, placeholder: p.placeholder, "aria-label": p["aria-label"] }),
    Toggle: (p) => h("button", { type: "button", role: "switch", "aria-checked": p.checked, onClick: () => p.onChange(!p.checked) }, p.label),
    Field: (p) => h("div", null, p.label, p.children, p.hint),
    Section: (p) => h("section", null, h("h4", null, p.title), p.right, p.children),
    Card: (p) => h("div", { className: "card" }, p.children),
    Stack: flex("column"),
    Row: flex("row"),
    tokens: Object.fromEntries(TOKENS.map((k) => [k, `var(--${k})`])),
  };
}

function makeApi({ withStylesheetApi = true, config } = {}) {
  const settings = new Map();
  if (config !== undefined) settings.set("config", config);
  const listeners = new Set();
  const sheets = [];
  const api = {
    version: 1,
    extensionId: "com.safelight.input-styling",
    react: React,
    registered: null,
    sheets,
    registerSettings: (c) => (api.registered = c),
    settings: {
      get: (k, fb) => (settings.has(k) ? settings.get(k) : fb),
      // The app fires onChange for the writing window too.
      set: (k, v) => api.emit(k, v),
      onChange: (cb) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
    },
    emit: (k, v) => {
      settings.set(k, v);
      listeners.forEach((cb) => cb(k, v));
    },
    ui: stubUi(),
    components: {
      Slider: (p) =>
        h("div", { className: "slider" }, h("label", null, p.label), h("input", { type: "range", value: p.value, readOnly: true })),
    },
  };
  if (withStylesheetApi) {
    api.registerStylesheet = (c) => sheets.push(c);
    api.unregisterStylesheet = (id) => sheets.push({ id, css: null });
  }
  return api;
}

const latest = (api) => api.sheets[api.sheets.length - 1];
const render = (api) => renderToString(h(api.registered.component));

const mod = await import("./index.js");
assert.equal(typeof mod.activate, "function", "exports activate()");
assert.equal(typeof mod.deactivate, "function", "exports deactivate()");

// Fresh install: the stock look registers an empty sheet under our id.
{
  const api = makeApi();
  mod.activate(api);
  assert.equal(api.sheets.length, 1, "one stylesheet registered on activate");
  assert.equal(latest(api).id, SHEET_ID);
  assert.equal(latest(api).css, "", "stock look compiles to nothing");
  assert.equal(api.registered?.title, "Input Styling");
  assert.equal(typeof api.registered.component, "function");
  assert.ok(api.registered.keywords.includes("slider"));
  mod.deactivate();
}

// A saved config applies on activate; a change from another window re-applies.
{
  const api = makeApi({ config: { version: 1, preset: "precise", overrides: {}, customCss: "" } });
  mod.activate(api);
  assert.ok(latest(api).css.includes("clip-path: polygon("), "precise preset: pointed knob");
  assert.ok(latest(api).css.includes("border-radius: 0"), "precise preset: square corners");

  api.emit("config", {
    version: 1,
    preset: "soft",
    overrides: { knob: "line" },
    customCss: "/* mine */ button { color: red }",
  });
  const css = latest(api).css;
  assert.ok(css.includes("border-radius: 9999px"), "re-applied: pill corners");
  assert.ok(css.includes("width: 2px"), "re-applied: line knob override");
  assert.ok(css.endsWith("/* mine */ button { color: red }"), "custom CSS appended verbatim");

  const before = api.sheets.length;
  api.emit("unrelated", 1);
  assert.equal(api.sheets.length, before, "unrelated settings keys don't re-register");
  mod.deactivate();
  api.emit("config", { version: 1, preset: "classic", overrides: {}, customCss: "" });
  assert.equal(api.sheets.length, before, "no re-apply after deactivate");
}

// Junk in storage falls back to the stock look without throwing.
{
  const api = makeApi({ config: "garbage" });
  assert.doesNotThrow(() => mod.activate(api));
  assert.equal(latest(api).css, "");
  mod.deactivate();
}

// A host without the stylesheet API: nothing applied, panel explains why.
{
  const api = makeApi({ withStylesheetApi: false, config: { preset: "soft" } });
  assert.doesNotThrow(() => mod.activate(api));
  assert.equal(api.sheets.length, 0);
  assert.ok(api.registered, "settings section still registered");
  assert.ok(render(api).includes("2.5.4"), "panel states the version requirement");
  mod.deactivate();
}

// The panel renders across every preset, with the live preview.
const LABELS = ["Preset", "Corners", "Slider knob", "Knob size", "Track thickness", "Checkboxes", "Focus zoom", "Custom CSS"];
for (const preset of ["safelight", "classic", "precise", "soft"]) {
  const api = makeApi({ config: { version: 1, preset, overrides: {}, customCss: "" } });
  mod.activate(api);
  const html = render(api);
  for (const label of LABELS) assert.ok(html.includes(label), `${preset}: panel shows "${label}"`);
  assert.ok(html.includes('class="slider"'), `${preset}: preview renders the app Slider`);
  assert.ok(!html.includes("modified"), `${preset}: no overrides, no modified marker`);
  mod.deactivate();
}

// Overrides and a broken custom CSS: modified marker, reset control, warning.
{
  const api = makeApi({
    config: {
      version: 1,
      preset: "classic",
      overrides: { corners: "pill", knob: "pointed", knobSize: 9, trackSize: 3, checkbox: "native", focusZoom: "large" },
      customCss: "button { color: red ",
    },
  });
  mod.activate(api);
  const html = render(api);
  assert.ok(html.includes("modified"), "overrides show the modified marker");
  assert.ok(html.includes("Reset tweaks"), "overrides show the reset control");
  assert.ok(/brace/i.test(html), "unbalanced custom CSS shows a warning");
  assert.ok(latest(api).css.endsWith("button { color: red"), "the CSS is still applied");
  mod.deactivate();
}

console.log("OK — Input Styling smoke passed");
