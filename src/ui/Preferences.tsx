// The Input Styling Preferences section: preset picker, live preview, one row
// per tweak (each defaulting to "from preset"), and the custom CSS editor.
// Built on the shared api.ui kit; layout is inline styles on the theme tokens
// because runtime-loaded extensions get no Tailwind classes.

import type { CSSProperties, ReactNode } from "react";
import {
  CONFIG_KEY,
  React,
  REQUIRED_APP_VERSION,
  api,
  getConfig,
  hasStylesheetApi,
  saveConfig,
  ui,
} from "../runtime.ts";
import { clearOverrides, isDirty, resolveTweaks, setOverride, type Config } from "../model/config.ts";
import { HOOKS, braceBalance } from "../model/css.ts";
import { PRESETS, getPreset } from "../model/presets.ts";
import {
  CHOICES,
  OPTION_LABELS,
  RANGES,
  TWEAK_LABELS,
  type ChoiceKey,
  type NumberKey,
  type Tweaks,
} from "../model/types.ts";
import { Preview } from "./Preview.tsx";

const FROM_PRESET = "preset";
const COMMIT_DELAY_MS = 300;

const CSS_PLACEHOLDER = `/* e.g. a 12px round knob on every Develop slider */
.sl-slider-thumb {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-text-primary);
}`;

const text = (size: number, color: string): CSSProperties => ({
  fontSize: size,
  lineHeight: 1.45,
  color,
  margin: 0,
});

function TweakRow({
  label,
  overridden,
  children,
}: {
  label: string;
  overridden: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "2px 0 2px 10px",
        borderLeft: `2px solid ${overridden ? ui.tokens.sliderFill : "transparent"}`,
      }}
    >
      <span style={{ width: 110, flexShrink: 0, fontSize: 11, color: ui.tokens.textSecondary }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function ChoiceRow<K extends ChoiceKey>({
  tweakKey,
  config,
  onChange,
}: {
  tweakKey: K;
  config: Config;
  onChange: (value: Tweaks[K] | undefined) => void;
}) {
  const labels = OPTION_LABELS[tweakKey];
  const fromPreset = getPreset(config.preset).tweaks[tweakKey];
  const override = config.overrides[tweakKey];
  const options = [
    { value: FROM_PRESET, label: `From preset · ${labels[fromPreset]}` },
    ...CHOICES[tweakKey].map((value) => ({ value, label: labels[value] })),
  ];
  return (
    <TweakRow label={TWEAK_LABELS[tweakKey]} overridden={override !== undefined}>
      <ui.Select
        value={override ?? FROM_PRESET}
        onChange={(v) => onChange(CHOICES[tweakKey].find((choice) => choice === v))}
        options={options}
        ariaLabel={TWEAK_LABELS[tweakKey]}
      />
    </TweakRow>
  );
}

function NumberRow({
  tweakKey,
  config,
  effective,
  disabled,
  onChange,
}: {
  tweakKey: NumberKey;
  config: Config;
  effective: Tweaks;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
}) {
  const override = config.overrides[tweakKey];
  const { min, max } = RANGES[tweakKey];
  return (
    <TweakRow label={TWEAK_LABELS[tweakKey]} overridden={override !== undefined}>
      <ui.Row gap={6}>
        <ui.NumberInput
          value={effective[tweakKey]}
          min={min}
          max={max}
          step={1}
          width="56px"
          disabled={disabled}
          aria-label={TWEAK_LABELS[tweakKey]}
          onChange={onChange}
        />
        <span style={{ fontSize: 11, color: ui.tokens.textMuted }}>px</span>
        {override !== undefined && (
          <ui.Button size="sm" variant="ghost" title="Back to the preset value" onClick={() => onChange(undefined)}>
            ↺
          </ui.Button>
        )}
      </ui.Row>
    </TweakRow>
  );
}

function CustomCssEditor({ value, onCommit }: { value: string; onCommit: (css: string) => void }) {
  const [draft, setDraft] = React.useState(value);
  const committed = React.useRef(value);
  React.useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setDraft(value);
    }
  }, [value]);
  React.useEffect(() => {
    if (draft === committed.current) return;
    const timer = setTimeout(() => {
      committed.current = draft;
      onCommit(draft);
    }, COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, onCommit]);
  const unbalanced = braceBalance(draft) !== 0;
  return (
    <ui.Section title="Custom CSS">
      <ui.TextArea
        value={draft}
        onChange={setDraft}
        mono
        rows={8}
        placeholder={CSS_PLACEHOLDER}
        aria-label="Custom CSS"
      />
      {unbalanced && (
        <p style={text(10, "var(--color-label-yellow)")}>
          Unbalanced braces — the CSS is applied as far as the browser can parse it.
        </p>
      )}
      <p style={text(10, ui.tokens.textMuted)}>
        Applied live, after the preset and tweaks. Hooks: {HOOKS.map((h) => h.selector).join(" · ")}. The README
        describes each one.
      </p>
    </ui.Section>
  );
}

export function PreferencesPanel() {
  const [config, setConfig] = React.useState<Config>(() => getConfig());
  React.useEffect(
    () =>
      api.settings.onChange((key) => {
        if (key === CONFIG_KEY) setConfig(getConfig());
      }),
    [],
  );
  const commit = React.useCallback((next: Config) => {
    setConfig(next);
    saveConfig(next);
  }, []);
  // The CSS editor commits on a debounce, by which time `config` may have moved
  // on (a tweak, another window); the ref keeps the commit on the latest state.
  const latest = React.useRef(config);
  React.useEffect(() => {
    latest.current = config;
  }, [config]);
  const commitCss = React.useCallback(
    (customCss: string) => commit({ ...latest.current, customCss }),
    [commit],
  );

  if (!hasStylesheetApi()) {
    return (
      <p style={text(11, ui.tokens.textSecondary)}>
        Input Styling needs Safelight {REQUIRED_APP_VERSION} or newer, which added the stylesheet API extensions
        restyle controls through. Nothing is applied until you update.
      </p>
    );
  }

  const preset = getPreset(config.preset);
  const effective = resolveTweaks(config);
  const dirty = isDirty(config);
  const setTweak = <K extends keyof Tweaks>(key: K) => (value: Tweaks[K] | undefined) =>
    commit(setOverride(config, key, value));

  return (
    <ui.Stack gap={12} style={{ maxWidth: 560 }}>
      <p style={text(11, ui.tokens.textSecondary)}>
        Restyle Safelight's sliders, checkboxes, switches, buttons and fields: pick a preset, adjust any single
        aspect, or write your own CSS.
      </p>

      <ui.Field label="Preset" hint="Choosing a preset clears the tweaks below; custom CSS is kept.">
        <ui.Select
          value={config.preset}
          onChange={(id) => commit(clearOverrides({ ...config, preset: getPreset(id).id }))}
          options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          ariaLabel="Preset"
        />
        <p style={{ ...text(10, ui.tokens.textMuted), marginTop: 4 }}>
          {preset.description}
          {dirty ? " • modified" : ""}
        </p>
      </ui.Field>

      <Preview />

      <ui.Section
        title="Tweaks"
        right={
          dirty ? (
            <ui.Button
              size="sm"
              onClick={() => commit(clearOverrides(config))}
              title="Clear every override (keeps the preset and custom CSS)"
            >
              Reset tweaks
            </ui.Button>
          ) : null
        }
      >
        <ui.Stack gap={2}>
          <ChoiceRow tweakKey="corners" config={config} onChange={setTweak("corners")} />
          <ChoiceRow tweakKey="knob" config={config} onChange={setTweak("knob")} />
          <NumberRow
            tweakKey="knobSize"
            config={config}
            effective={effective}
            disabled={effective.knob === "none"}
            onChange={setTweak("knobSize")}
          />
          <NumberRow tweakKey="trackSize" config={config} effective={effective} onChange={setTweak("trackSize")} />
          <ChoiceRow tweakKey="checkbox" config={config} onChange={setTweak("checkbox")} />
          <ChoiceRow tweakKey="focusZoom" config={config} onChange={setTweak("focusZoom")} />
        </ui.Stack>
      </ui.Section>

      <CustomCssEditor value={config.customCss} onCommit={commitCss} />
    </ui.Stack>
  );
}
