// The persisted config and the pure operations on it. sanitizeConfig is the
// single trust boundary: everything read from api.settings (or edited by the
// panel) passes through it, so an unknown preset, a stray key, an out-of-range
// number or a non-string CSS can never reach the compiler.

import { DEFAULT_PRESET, getPreset, isPresetId, type PresetId } from "./presets.ts";
import {
  CHOICES,
  CHOICE_KEYS,
  NUMBER_KEYS,
  RANGES,
  type ChoiceKey,
  type NumberKey,
  type TweakKey,
  type Tweaks,
} from "./types.ts";

export interface Config {
  version: 1;
  preset: PresetId;
  /** An absent key means "from preset". */
  overrides: Partial<Tweaks>;
  /** Appended after the compiled rules, verbatim. */
  customCss: string;
}

export const DEFAULT_CONFIG: Config = {
  version: 1,
  preset: DEFAULT_PRESET,
  overrides: {},
  customCss: "",
};

export function clampNumber(key: NumberKey, n: number): number {
  const { min, max } = RANGES[key];
  return Math.min(max, Math.max(min, Math.round(n)));
}

function isChoice<K extends ChoiceKey>(key: K, v: unknown): v is Tweaks[K] {
  return (CHOICES[key] as readonly unknown[]).includes(v);
}

function copyChoice<K extends ChoiceKey>(
  src: Record<string, unknown>,
  out: Partial<Tweaks>,
  key: K,
): void {
  const v = src[key];
  if (isChoice(key, v)) out[key] = v;
}

function sanitizeOverrides(raw: unknown): Partial<Tweaks> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Partial<Tweaks> = {};
  for (const key of CHOICE_KEYS) copyChoice(src, out, key);
  for (const key of NUMBER_KEYS) {
    const v = src[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = clampNumber(key, v);
  }
  return out;
}

export function sanitizeConfig(raw: unknown): Config {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return DEFAULT_CONFIG;
  const src = raw as Record<string, unknown>;
  return {
    version: 1,
    preset: isPresetId(src.preset) ? src.preset : DEFAULT_PRESET,
    overrides: sanitizeOverrides(src.overrides),
    customCss: typeof src.customCss === "string" ? src.customCss : "",
  };
}

/** The effective tweaks: the preset's values with the overrides on top. */
export function resolveTweaks(config: Config): Tweaks {
  return { ...getPreset(config.preset).tweaks, ...config.overrides };
}

/** Set (or, with undefined, drop) one override. Values pass the sanitizer, so
 *  numbers land clamped and rounded. Returns a new config. */
export function setOverride<K extends TweakKey>(
  config: Config,
  key: K,
  value: Tweaks[K] | undefined,
): Config {
  const overrides: Partial<Tweaks> = { ...config.overrides };
  if (value === undefined) delete overrides[key];
  else overrides[key] = value;
  return { ...config, overrides: sanitizeOverrides(overrides) };
}

export function clearOverrides(config: Config): Config {
  return { ...config, overrides: {} };
}

/** Whether any tweak departs from the chosen preset. */
export function isDirty(config: Config): boolean {
  return Object.keys(config.overrides).length > 0;
}
