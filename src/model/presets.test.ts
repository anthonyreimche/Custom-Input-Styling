// Built-in presets: identity, the stock preset, and that every preset's tweak
// values are ones the sanitizer accepts (so a preset can never carry a value
// the UI would refuse). Run: node --experimental-strip-types src/model/presets.test.ts

import assert from "node:assert/strict";
import { sanitizeConfig } from "./config.ts";
import { DEFAULT_PRESET, PRESETS, getPreset, isPresetId } from "./presets.ts";
import { STOCK } from "./types.ts";

assert.equal(new Set(PRESETS.map((p) => p.id)).size, PRESETS.length, "preset ids are unique");
assert.equal(PRESETS[0].id, DEFAULT_PRESET, "the stock preset lists first");
assert.equal(DEFAULT_PRESET, "safelight");

assert.deepEqual(getPreset("safelight").tweaks, STOCK, "Safelight is the stock look");
assert.equal(getPreset("does-not-exist").id, "safelight", "unknown ids resolve to the stock preset");
assert.equal(getPreset("precise").label, "Precise");

assert.equal(isPresetId("soft"), true);
assert.equal(isPresetId("Soft"), false);
assert.equal(isPresetId(3), false);
assert.equal(isPresetId(undefined), false);

for (const p of PRESETS) {
  assert.ok(p.label.length > 0 && p.description.length > 0, `${p.id} has a label and description`);
  assert.deepEqual(
    sanitizeConfig({ overrides: p.tweaks }).overrides,
    p.tweaks,
    `${p.id} tweaks are all valid values`,
  );
}

assert.ok(
  PRESETS.some((p) => p.tweaks.knob === "pointed") &&
    PRESETS.some((p) => p.tweaks.knob === "round") &&
    PRESETS.some((p) => p.tweaks.corners === "square") &&
    PRESETS.some((p) => p.tweaks.corners === "pill"),
  "presets cover the headline looks: pointed and round knobs, square and pill corners",
);

console.log("presets OK");
