// A sample strip of the controls the extension restyles, so every aspect is
// visible without leaving Preferences. The slider is the app's own component
// (api.components.Slider), so it carries the real styling hooks.

import { React, api, ui } from "../runtime.ts";

export function Preview() {
  const [exposure, setExposure] = React.useState(25);
  const [checked, setChecked] = React.useState(true);
  const [on, setOn] = React.useState(true);
  const [amount, setAmount] = React.useState(50);
  const { Slider } = api.components;
  return (
    <ui.Card>
      <ui.Stack gap={8}>
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: ui.tokens.textMuted,
          }}
        >
          Preview
        </span>
        <Slider label="Exposure" value={exposure} min={-100} max={100} onChange={setExposure} />
        <ui.Row gap={12} wrap>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: ui.tokens.textSecondary,
              cursor: "pointer",
            }}
          >
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            Checkbox
          </label>
          <ui.Toggle checked={on} onChange={setOn} label="Switch" />
          <ui.Button variant="primary" size="sm">
            Primary
          </ui.Button>
          <ui.Button size="sm">Button</ui.Button>
          <ui.NumberInput value={amount} onChange={setAmount} aria-label="Sample number field" />
        </ui.Row>
      </ui.Stack>
    </ui.Card>
  );
}
