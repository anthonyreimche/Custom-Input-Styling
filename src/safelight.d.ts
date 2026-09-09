// Local, focused type stubs for the slice of the Safelight extension API this
// extension uses. The app's real, exhaustive definitions live in the core repo
// (src/extensions/types.ts, src/extensions/ui-kit.tsx); this file mirrors only
// what we touch so the bundle type-checks standalone without depending on core.

import type { ComponentType, CSSProperties, ReactNode } from "react";

/** Plain CSS applied in every app window after the core styles. Re-registering
 *  the same id replaces it; the host removes it when the extension unloads. */
export interface StylesheetContribution {
  id: string;
  css: string;
}

export interface SettingsContribution {
  title?: string;
  fields: never[];
  order?: number;
  keywords?: string[];
  /** Rendered instead of declarative fields; reads/writes via api.settings. */
  component?: ComponentType;
}

/** The Develop slider (api.components.Slider), the subset of props we render. */
export interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  hideValue?: boolean;
  compact?: boolean;
  trackBackground?: string;
  onChange: (value: number) => void;
  onCommit?: () => void;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type Token =
  | "surface0"
  | "surface1"
  | "surface2"
  | "surface3"
  | "surface4"
  | "border"
  | "borderSubtle"
  | "textPrimary"
  | "textSecondary"
  | "textMuted"
  | "accent"
  | "accentHover"
  | "sliderFill"
  | "rating"
  | "fontMono";

/** The shared, theme-styled primitives in api.ui (authored in core, where
 *  Tailwind is scanned), typed to the props this extension passes. */
export interface UiKit {
  Button: ComponentType<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md";
    active?: boolean;
    full?: boolean;
    disabled?: boolean;
    title?: string;
    onClick?: () => void;
    children?: ReactNode;
  }>;
  Select: ComponentType<{
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    disabled?: boolean;
    ariaLabel?: string;
    title?: string;
  }>;
  NumberInput: ComponentType<{
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    /** CSS width, e.g. "56px". */
    width?: string;
    disabled?: boolean;
    title?: string;
    "aria-label"?: string;
  }>;
  TextArea: ComponentType<{
    value: string;
    onChange: (value: string) => void;
    mono?: boolean;
    rows?: number;
    placeholder?: string;
    "aria-label"?: string;
  }>;
  Toggle: ComponentType<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
    ariaLabel?: string;
  }>;
  Field: ComponentType<{ label?: ReactNode; hint?: ReactNode; children?: ReactNode }>;
  Section: ComponentType<{ title: ReactNode; right?: ReactNode; children?: ReactNode }>;
  Card: ComponentType<{ children?: ReactNode }>;
  Stack: ComponentType<{ children?: ReactNode; gap?: number; style?: CSSProperties }>;
  Row: ComponentType<{
    children?: ReactNode;
    gap?: number;
    align?: CSSProperties["alignItems"];
    justify?: CSSProperties["justifyContent"];
    wrap?: boolean;
    style?: CSSProperties;
  }>;
  /** Canonical `var(--color-…)` strings for inline styles. */
  tokens: Record<Token, string>;
}

export interface SafelightAPI {
  version: 1;
  extensionId: string;
  react: typeof import("react");
  /** Absent on Safelight builds older than 2.5.4. */
  registerStylesheet?(c: StylesheetContribution): void;
  unregisterStylesheet?(id: string): void;
  registerSettings(c: SettingsContribution): void;
  settings: {
    get<T>(key: string, fallback: T): T;
    set(key: string, value: unknown): void;
    /** Fires for this extension's settings from any window. */
    onChange(cb: (key: string, value: unknown) => void): () => void;
  };
  ui: UiKit;
  components: { Slider: ComponentType<SliderProps> };
}

export interface ExtensionModule {
  activate(api: SafelightAPI): void;
  deactivate?(): void;
}
