// Built-in presets: named tweak sets. The stock preset lists first and is the
// fallback for any id we don't know (a config written by a newer version).

import { STOCK, type Tweaks } from "./types.ts";

export type PresetId = "safelight" | "classic" | "precise" | "soft";

export interface Preset {
  id: PresetId;
  label: string;
  description: string;
  tweaks: Tweaks;
}

export const PRESETS: readonly Preset[] = [
  {
    id: "safelight",
    label: "Safelight",
    description: "The stock look: filled slider bars with no knob, rounded corners, native checkboxes.",
    tweaks: STOCK,
  },
  {
    id: "classic",
    label: "Classic",
    description:
      "Round slider knobs and drawn checkboxes on the stock rounded shapes; numeric fields grow a little while you type.",
    tweaks: {
      corners: "rounded",
      knob: "round",
      knobSize: 12,
      trackSize: 6,
      checkbox: "styled",
      focusZoom: "subtle",
    },
  },
  {
    id: "precise",
    label: "Precise",
    description:
      "Square corners, thin tracks with a pointed knob, drawn checkboxes and a large focus zoom for exact numeric entry.",
    tweaks: {
      corners: "square",
      knob: "pointed",
      knobSize: 10,
      trackSize: 4,
      checkbox: "styled",
      focusZoom: "large",
    },
  },
  {
    id: "soft",
    label: "Soft",
    description: "Pill buttons and fields, thick tracks with big round knobs, drawn checkboxes.",
    tweaks: {
      corners: "pill",
      knob: "round",
      knobSize: 14,
      trackSize: 8,
      checkbox: "styled",
      focusZoom: "subtle",
    },
  },
];

export const DEFAULT_PRESET: PresetId = "safelight";

export function isPresetId(id: unknown): id is PresetId {
  return typeof id === "string" && PRESETS.some((p) => p.id === id);
}

export function getPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
