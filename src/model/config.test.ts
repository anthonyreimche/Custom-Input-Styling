// Persisted-config coverage: sanitizing untrusted JSON, resolving preset +
// overrides into effective tweaks, and the override edits the panel makes.
// Run: node --experimental-strip-types src/model/config.test.ts

import assert from "node:assert/strict";
import {
  DEFAULT_CONFIG,
  clampNumber,
  clearOverrides,
  isDirty,
  resolveTweaks,
  sanitizeConfig,
  setOverride,
} from "./config.ts";
import { getPreset } from "./presets.ts";
import { STOCK } from "./types.ts";

// ── sanitizeConfig ───────────────────────────────────────────────────────────

assert.deepEqual(sanitizeConfig(null), DEFAULT_CONFIG);
assert.deepEqual(sanitizeConfig(undefined), DEFAULT_CONFIG);
assert.deepEqual(sanitizeConfig("nope"), DEFAULT_CONFIG);
assert.deepEqual(sanitizeConfig([]), DEFAULT_CONFIG);

{
  const full = {
    version: 1,
    preset: "precise",
    overrides: { knob: "round", knobSize: 10 },
    customCss: "button { color: red }",
  };
  assert.deepEqual(sanitizeConfig(full), full, "a valid config round-trips");
}

assert.equal(sanitizeConfig({ preset: "neon" }).preset, "safelight", "unknown preset falls back");
assert.equal(sanitizeConfig({ preset: 3 }).preset, "safelight");
assert.equal(sanitizeConfig({ version: 7 }).version, 1);

{
  const c = sanitizeConfig({
    overrides: { knob: "hexagon", corners: "pill", bogus: 1, knobSize: "12" },
  });
  assert.deepEqual(c.overrides, { corners: "pill" }, "invalid overrides are dropped one by one");
}
assert.deepEqual(sanitizeConfig({ overrides: "x" }).overrides, {});
assert.deepEqual(sanitizeConfig({ overrides: null }).overrides, {});
assert.deepEqual(
  sanitizeConfig({ overrides: { knobSize: 99, trackSize: -3 } }).overrides,
  { knobSize: 16, trackSize: 2 },
  "numbers clamp to their range",
);
assert.deepEqual(sanitizeConfig({ overrides: { knobSize: 11.6 } }).overrides, { knobSize: 12 });
assert.deepEqual(sanitizeConfig({ overrides: { knobSize: NaN } }).overrides, {});
assert.deepEqual(sanitizeConfig({ overrides: { trackSize: Infinity } }).overrides, {});

assert.equal(sanitizeConfig({ customCss: 42 }).customCss, "");
assert.equal(sanitizeConfig({ customCss: ".a{}" }).customCss, ".a{}");

// ── resolveTweaks ────────────────────────────────────────────────────────────

assert.deepEqual(resolveTweaks(DEFAULT_CONFIG), STOCK);
assert.deepEqual(
  resolveTweaks({ ...DEFAULT_CONFIG, preset: "precise" }),
  getPreset("precise").tweaks,
);
assert.deepEqual(
  resolveTweaks({ ...DEFAULT_CONFIG, preset: "precise", overrides: { knob: "round", trackSize: 9 } }),
  { ...getPreset("precise").tweaks, knob: "round", trackSize: 9 },
  "overrides win over the preset",
);

// ── setOverride / clearOverrides / isDirty ───────────────────────────────────

{
  const a = setOverride(DEFAULT_CONFIG, "corners", "pill");
  assert.deepEqual(a.overrides, { corners: "pill" });
  assert.deepEqual(DEFAULT_CONFIG.overrides, {}, "input config is not mutated");
  assert.equal(isDirty(a), true);

  const b = setOverride(a, "corners", undefined);
  assert.deepEqual(b.overrides, {}, "undefined removes the override");
  assert.equal(isDirty(b), false);

  const c = setOverride(setOverride(a, "knobSize", 40), "trackSize", 1.2);
  assert.deepEqual(c.overrides, { corners: "pill", knobSize: 16, trackSize: 2 }, "numbers clamp");

  const d = clearOverrides({ ...c, customCss: "kept" });
  assert.deepEqual(d.overrides, {});
  assert.equal(d.preset, c.preset);
  assert.equal(d.customCss, "kept", "custom CSS survives a tweak reset");
}
assert.equal(isDirty(DEFAULT_CONFIG), false);
assert.equal(isDirty({ ...DEFAULT_CONFIG, customCss: "x" }), false, "custom CSS is not an override");

// ── clampNumber ──────────────────────────────────────────────────────────────

assert.equal(clampNumber("knobSize", 3), 8);
assert.equal(clampNumber("knobSize", 12.4), 12);
assert.equal(clampNumber("knobSize", 16), 16);
assert.equal(clampNumber("trackSize", 100), 10);
assert.equal(clampNumber("trackSize", 2), 2);

console.log("config OK");
