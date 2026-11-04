# Input Styling

Restyle [Safelight](https://github.com/anthonyreimche/SafeLight)'s input controls — slider knobs, checkboxes, switches, buttons and fields — from a preset, a few tweaks, or your own CSS.

Themes change Safelight's colours. This extension changes the *shapes*: whether a slider shows a knob and what shape it is, how thick the track is, whether corners are square, rounded or pill, whether checkboxes are the OS ones or drawn to match, and whether a numeric field grows while you type in it. Everything applies instantly, in every window, and disabling the extension puts the stock look back.

## Presets

Preferences ▸ Extensions ▸ Input Styling. Pick one, then adjust anything below it.

| Preset | Corners | Slider knob | Knob / track | Checkboxes | Focus zoom |
|---|---|---|---|---|---|
| **Safelight** | rounded | none (filled bar) | 12 / 6 px | native | off |
| **Classic** | rounded | round | 12 / 6 px | styled | subtle |
| **Precise** | square | pointed | 10 / 4 px | styled | large |
| **Soft** | pill | round | 14 / 8 px | styled | subtle |

Safelight is the stock look and compiles to no CSS at all. A **Preview** card under the picker shows a real Develop slider, a checkbox, a switch, buttons and a number field, so you can judge a preset without leaving Preferences (the dialogue's own controls restyle live too).

## Tweaks

Each row defaults to *From preset*; choose a value to override just that aspect. Overridden rows show a bar on the left and the preset line reads "modified"; **Reset tweaks** clears them all. Choosing a different preset also clears them (custom CSS is kept).

- **Corners** — square / rounded / pill, for buttons, text and number fields, the dropdown trigger, segmented controls, slider tracks and the switch.
- **Slider knob** — none / round / square / pointed / line. Applies to the Develop sliders (and the marker on the HSL gradient tracks) and to the native range sliders in Preferences.
- **Knob size** — 8–16 px (disabled while the knob is *None*).
- **Track thickness** — 2–10 px.
- **Checkboxes** — *Native* keeps the OS checkbox; *Styled* draws a box and tick from the theme colours, with corners following the Corners setting.
- **Focus zoom** — off / subtle / large: the slider value field and number inputs scale up (1.2× / 1.45×) while focused, so what you type is easy to read.

## Custom CSS

The **Custom CSS** box is appended after the preset and tweaks and applied live (a short pause after you stop typing). It can target anything, but the selectors below are the ones Safelight guarantees — its Tailwind class names are not a contract and may change.

| Selector | What it is |
|---|---|
| `button` | Every push button. Add `:not(.sl-switch):not(.sl-select)` to skip switches and dropdown triggers. |
| `.sl-segmented` | Segmented-control container (its options are `button`s). |
| `.sl-select` | Dropdown trigger. |
| `.sl-switch`, `.sl-switch-track`, `.sl-switch-knob` | Toggle switch, its track and knob; `[aria-checked="true"]` on the switch marks the on state. |
| `.sl-slider-wrap` | The Develop slider's track area (16 px tall, `position: relative`). |
| `.sl-slider-track`, `.sl-slider-fill` | The track and the filled bar up to the value. |
| `.sl-slider-thumb` | A knob positioned at the value. Hidden by default: set `display: block`, a size and a shape. |
| `.sl-slider-marker` | The value marker on gradient (HSL) tracks. |
| `.sl-slider-value`, `.sl-slider-label` | The slider's numeric field (`:focus` while typing) and label. |
| `.sl-slider` | Native range inputs (Preferences); style `::-webkit-slider-thumb` for the knob. |
| `input[type="checkbox"]`, `input[type="text"]`, `input[type="number"]`, `textarea` | Native fields. |

Extension rules cascade after Safelight's own CSS and win over its utility classes without `!important`. Inline styles still win. `@import` is refused.

```css
/* a pointed knob in the accent colour instead of white */
.sl-slider-thumb { background: var(--color-accent); }

/* every push button as a pill, keeping switches and dropdowns as they are */
button:not(.sl-switch):not(.sl-select) { border-radius: 9999px; padding-inline: 10px; }
```

Colours come from the theme tokens (`--color-surface-0…4`, `--color-border`, `--color-text-primary/secondary/muted`, `--color-accent`, `--color-slider-fill`), so a custom style follows whichever theme is active.

## How it works

The tweaks compile to a stylesheet against the hooks above, your custom CSS is appended, and the result is registered with `api.registerStylesheet`. Safelight keeps it as a constructed stylesheet after its own CSS in every window, swaps the CSS in place on each change, and removes it when the extension is disabled or uninstalled. The config (preset, overrides, custom CSS) lives in one persisted setting and is re-applied on load and on change from any window.

Custom HTML is deliberately not supported: the controls stay Safelight's own, so their keyboard handling and accessibility never depend on a style pack.

Requires Safelight **2.5.4** or newer (the release that added the stylesheet API and the styling hooks). On an older build the extension installs, but applies nothing and says so in its Preferences section.

## Build

```sh
npm install
npm run build          # bundle → index.js (committed; the store fetches it as-is)
npm run typecheck      # tsc, no emit
npm test               # model unit tests (config sanitizing, presets, CSS compiler)
npm run smoke          # build + mocked-API smoke test (activation, re-apply, panel render)
npm run verify         # typecheck + test + smoke
npm run install-local  # build + copy into Safelight's plugins directory
```

React is provided by the host at runtime via `api.react` and is never bundled.

To iterate in the app: Extensions ▸ Dev ▸ Choose folder… and point it at the folder that contains this repo, then ↻ Reload the row after each `npm run build`. The Preferences section appears under Settings ▸ Extensions ▸ Input Styling.

## Licence

MIT — see [LICENSE](LICENSE).
