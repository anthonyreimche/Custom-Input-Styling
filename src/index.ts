// Input Styling — entry point. Compiles the saved config to a stylesheet on
// load, re-applies on every config change (from this window or another), and
// registers the Preferences section.

import type { SafelightAPI } from "./safelight";
import { CONFIG_KEY, applyStyles, getConfig, initRuntime } from "./runtime.ts";
import { PreferencesPanel } from "./ui/Preferences.tsx";

let unsubscribe: (() => void) | null = null;

export function activate(api: SafelightAPI): void {
  initRuntime(api);
  applyStyles(getConfig());
  api.registerSettings({
    title: "Input Styling",
    keywords: [
      "style",
      "styling",
      "slider",
      "knob",
      "thumb",
      "checkbox",
      "switch",
      "button",
      "corners",
      "rounded",
      "square",
      "pill",
      "css",
      "theme",
    ],
    fields: [],
    component: PreferencesPanel,
  });
  unsubscribe = api.settings.onChange((key) => {
    if (key === CONFIG_KEY) applyStyles(getConfig());
  });
}

export function deactivate(): void {
  // The host sweeps the stylesheet and the settings section; only our own
  // subscription needs releasing.
  unsubscribe?.();
  unsubscribe = null;
}
