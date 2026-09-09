// The tweak vocabulary: every aspect a preset or override can set, the values
// it accepts, numeric ranges and display labels. Single source of truth for
// the sanitizer, the CSS compiler and the Preferences panel.

export type Corners = "square" | "rounded" | "pill";
export type Knob = "none" | "round" | "square" | "pointed" | "line";
export type Checkbox = "native" | "styled";
export type FocusZoom = "off" | "subtle" | "large";

export interface Tweaks {
  /** Buttons, fields, dropdown trigger, segmented control, slider tracks and
   *  the switch track. */
  corners: Corners;
  /** Develop slider knob and the native range thumb. */
  knob: Knob;
  /** Knob size in px. */
  knobSize: number;
  /** Slider track thickness in px. */
  trackSize: number;
  /** The OS checkbox, or a CSS-drawn box and tick that follows `corners`. */
  checkbox: Checkbox;
  /** Compact numeric fields scale up while focused. */
  focusZoom: FocusZoom;
}

export type TweakKey = keyof Tweaks;
export type ChoiceKey = "corners" | "knob" | "checkbox" | "focusZoom";
export type NumberKey = "knobSize" | "trackSize";

export const CHOICE_KEYS: readonly ChoiceKey[] = ["corners", "knob", "checkbox", "focusZoom"];
export const NUMBER_KEYS: readonly NumberKey[] = ["knobSize", "trackSize"];

export const CHOICES: { readonly [K in ChoiceKey]: readonly Tweaks[K][] } = {
  corners: ["square", "rounded", "pill"],
  knob: ["none", "round", "square", "pointed", "line"],
  checkbox: ["native", "styled"],
  focusZoom: ["off", "subtle", "large"],
};

export const RANGES: { readonly [K in NumberKey]: { min: number; max: number } } = {
  knobSize: { min: 8, max: 16 },
  trackSize: { min: 2, max: 10 },
};

/** The look Safelight ships with; compiles to no CSS. */
export const STOCK: Tweaks = {
  corners: "rounded",
  knob: "none",
  knobSize: 12,
  trackSize: 6,
  checkbox: "native",
  focusZoom: "off",
};

export const TWEAK_LABELS: Record<TweakKey, string> = {
  corners: "Corners",
  knob: "Slider knob",
  knobSize: "Knob size",
  trackSize: "Track thickness",
  checkbox: "Checkboxes",
  focusZoom: "Focus zoom",
};

export const OPTION_LABELS: { readonly [K in ChoiceKey]: Record<Tweaks[K], string> } = {
  corners: { square: "Square", rounded: "Rounded", pill: "Pill" },
  knob: { none: "None", round: "Round", square: "Square", pointed: "Pointed", line: "Line" },
  checkbox: { native: "Native", styled: "Styled" },
  focusZoom: { off: "Off", subtle: "Subtle", large: "Large" },
};
