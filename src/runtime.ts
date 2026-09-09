// Runtime bridge. JSX in the UI modules compiles (classic transform) to
// `React.createElement(...)`, resolving to the `React` binding re-exported
// here. The app injects its own React as `api.react`; it is assigned once in
// activate() before any component renders, so every module shares the one
// instance (a second copy would break hooks).
//
// Also the config round-trip: one settings key holds the whole config, and
// every apply goes through compileCss → api.registerStylesheet, re-registering
// the same sheet id so the host swaps the CSS in place.

import type { SafelightAPI, UiKit } from "./safelight";
import { resolveTweaks, sanitizeConfig, type Config } from "./model/config.ts";
import { compileCss } from "./model/css.ts";

export let React!: typeof import("react");
export let api!: SafelightAPI;
export let ui!: UiKit;

export const CONFIG_KEY = "config";
export const STYLESHEET_ID = "com.safelight.input-styling.controls";
/** The first Safelight release with api.registerStylesheet. */
export const REQUIRED_APP_VERSION = "2.5.4";

export function initRuntime(a: SafelightAPI): void {
  api = a;
  React = a.react;
  ui = a.ui;
}

export function hasStylesheetApi(): boolean {
  return typeof api.registerStylesheet === "function";
}

export function getConfig(): Config {
  return sanitizeConfig(api.settings.get<unknown>(CONFIG_KEY, null));
}

export function applyStyles(config: Config): void {
  api.registerStylesheet?.({
    id: STYLESHEET_ID,
    css: compileCss(resolveTweaks(config), config.customCss),
  });
}

/** Persist and apply. The settings write also fires onChange (in this window
 *  and others), which applies again — idempotent, and the explicit apply here
 *  keeps the in-memory config live even if the write fails. */
export function saveConfig(config: Config): void {
  try {
    api.settings.set(CONFIG_KEY, config);
  } catch (e) {
    console.warn("[input-styling] settings could not be saved:", e);
  }
  applyStyles(config);
}
