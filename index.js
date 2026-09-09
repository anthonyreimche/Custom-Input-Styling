//#region src/model/types.ts
const CHOICE_KEYS = [
	"corners",
	"knob",
	"checkbox",
	"focusZoom"
];
const NUMBER_KEYS = ["knobSize", "trackSize"];
const CHOICES = {
	corners: [
		"square",
		"rounded",
		"pill"
	],
	knob: [
		"none",
		"round",
		"square",
		"pointed",
		"line"
	],
	checkbox: ["native", "styled"],
	focusZoom: [
		"off",
		"subtle",
		"large"
	]
};
const RANGES = {
	knobSize: {
		min: 8,
		max: 16
	},
	trackSize: {
		min: 2,
		max: 10
	}
};
/** The look Safelight ships with; compiles to no CSS. */
const STOCK = {
	corners: "rounded",
	knob: "none",
	knobSize: 12,
	trackSize: 6,
	checkbox: "native",
	focusZoom: "off"
};
const TWEAK_LABELS = {
	corners: "Corners",
	knob: "Slider knob",
	knobSize: "Knob size",
	trackSize: "Track thickness",
	checkbox: "Checkboxes",
	focusZoom: "Focus zoom"
};
const OPTION_LABELS = {
	corners: {
		square: "Square",
		rounded: "Rounded",
		pill: "Pill"
	},
	knob: {
		none: "None",
		round: "Round",
		square: "Square",
		pointed: "Pointed",
		line: "Line"
	},
	checkbox: {
		native: "Native",
		styled: "Styled"
	},
	focusZoom: {
		off: "Off",
		subtle: "Subtle",
		large: "Large"
	}
};
//#endregion
//#region src/model/presets.ts
const PRESETS = [
	{
		id: "safelight",
		label: "Safelight",
		description: "The stock look: filled slider bars with no knob, rounded corners, native checkboxes.",
		tweaks: STOCK
	},
	{
		id: "classic",
		label: "Classic",
		description: "Round slider knobs and drawn checkboxes on the stock rounded shapes; numeric fields grow a little while you type.",
		tweaks: {
			corners: "rounded",
			knob: "round",
			knobSize: 12,
			trackSize: 6,
			checkbox: "styled",
			focusZoom: "subtle"
		}
	},
	{
		id: "precise",
		label: "Precise",
		description: "Square corners, thin tracks with a pointed knob, drawn checkboxes and a large focus zoom for exact numeric entry.",
		tweaks: {
			corners: "square",
			knob: "pointed",
			knobSize: 10,
			trackSize: 4,
			checkbox: "styled",
			focusZoom: "large"
		}
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
			focusZoom: "subtle"
		}
	}
];
const DEFAULT_PRESET = "safelight";
function isPresetId(id) {
	return typeof id === "string" && PRESETS.some((p) => p.id === id);
}
function getPreset(id) {
	return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
//#endregion
//#region src/model/config.ts
const DEFAULT_CONFIG = {
	version: 1,
	preset: DEFAULT_PRESET,
	overrides: {},
	customCss: ""
};
function clampNumber(key, n) {
	const { min, max } = RANGES[key];
	return Math.min(max, Math.max(min, Math.round(n)));
}
function isChoice(key, v) {
	return CHOICES[key].includes(v);
}
function copyChoice(src, out, key) {
	const v = src[key];
	if (isChoice(key, v)) out[key] = v;
}
function sanitizeOverrides(raw) {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
	const src = raw;
	const out = {};
	for (const key of CHOICE_KEYS) copyChoice(src, out, key);
	for (const key of NUMBER_KEYS) {
		const v = src[key];
		if (typeof v === "number" && Number.isFinite(v)) out[key] = clampNumber(key, v);
	}
	return out;
}
function sanitizeConfig(raw) {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return DEFAULT_CONFIG;
	const src = raw;
	return {
		version: 1,
		preset: isPresetId(src.preset) ? src.preset : DEFAULT_PRESET,
		overrides: sanitizeOverrides(src.overrides),
		customCss: typeof src.customCss === "string" ? src.customCss : ""
	};
}
/** The effective tweaks: the preset's values with the overrides on top. */
function resolveTweaks(config) {
	return {
		...getPreset(config.preset).tweaks,
		...config.overrides
	};
}
/** Set (or, with undefined, drop) one override. Values pass the sanitizer, so
*  numbers land clamped and rounded. Returns a new config. */
function setOverride(config, key, value) {
	const overrides = { ...config.overrides };
	if (value === void 0) delete overrides[key];
	else overrides[key] = value;
	return {
		...config,
		overrides: sanitizeOverrides(overrides)
	};
}
function clearOverrides(config) {
	return {
		...config,
		overrides: {}
	};
}
/** Whether any tweak departs from the chosen preset. */
function isDirty(config) {
	return Object.keys(config.overrides).length > 0;
}
//#endregion
//#region src/model/css.ts
/** The core selectors this extension styles, for the panel hint and README. */
const HOOKS = [
	{
		selector: "button",
		what: "every push button (add :not(.sl-switch):not(.sl-select) to skip switches and dropdowns)"
	},
	{
		selector: ".sl-segmented",
		what: "segmented control container"
	},
	{
		selector: ".sl-select",
		what: "dropdown trigger"
	},
	{
		selector: ".sl-switch, .sl-switch-track, .sl-switch-knob",
		what: "toggle switch, its track and its knob"
	},
	{
		selector: ".sl-slider-track, .sl-slider-fill",
		what: "Develop slider track and filled bar"
	},
	{
		selector: ".sl-slider-thumb",
		what: "Develop slider knob at the value (display: none until you show it)"
	},
	{
		selector: ".sl-slider-marker",
		what: "value marker on gradient (HSL) tracks"
	},
	{
		selector: ".sl-slider-value, .sl-slider-label",
		what: "the slider's numeric field and label"
	},
	{
		selector: ".sl-slider",
		what: "native range inputs (Preferences)"
	},
	{
		selector: "input[type=\"checkbox\"]",
		what: "checkboxes"
	},
	{
		selector: "input[type=\"text\"], input[type=\"number\"], textarea",
		what: "text and number fields"
	}
];
const PUSH_BUTTONS = "button:not(.sl-switch):not(.sl-select)";
const FIELDS = "input:not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]):not([type=\"color\"]), textarea";
const KNOB_FACE = "var(--color-text-primary)";
function rule(selector, declarations) {
	return `${selector} {\n${Object.entries(declarations).map(([property, value]) => `  ${property}: ${value};`).join("\n")}\n}`;
}
function cornersRules(corners) {
	if (corners === "rounded") return [];
	if (corners === "square") return [rule(`${PUSH_BUTTONS}, ${FIELDS}, .sl-select, .sl-segmented, .sl-slider-track, .sl-slider-fill, .sl-slider, .sl-slider::-moz-range-track`, { "border-radius": "0" }), rule(".sl-switch-track, .sl-switch-knob", { "border-radius": "2px" })];
	return [rule(`${PUSH_BUTTONS}, ${FIELDS}, .sl-select, .sl-segmented`, { "border-radius": "9999px" })];
}
function knobShape(knob) {
	switch (knob) {
		case "round": return { "border-radius": "50%" };
		case "square": return { "border-radius": "2px" };
		case "line": return { "border-radius": "1px" };
		case "pointed": return { "clip-path": "polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)" };
	}
}
function knobRules(knob, size, trackSize) {
	if (knob === "none") return [];
	const face = {
		width: `${knob === "line" ? 2 : size}px`,
		height: `${size}px`,
		background: KNOB_FACE,
		"box-shadow": "0 1px 2px rgba(0, 0, 0, 0.4)",
		...knobShape(knob)
	};
	return [
		rule(".sl-slider-thumb", {
			display: "block",
			...face
		}),
		rule(".sl-slider-marker", face),
		rule(".sl-slider::-webkit-slider-thumb", {
			"-webkit-appearance": "none",
			appearance: "none",
			border: "none",
			"margin-top": `${(trackSize - size) / 2}px`,
			...face
		}),
		rule(".sl-slider::-moz-range-thumb", {
			border: "none",
			...face
		})
	];
}
function trackRules(size) {
	if (size === STOCK.trackSize) return [];
	return [rule(".sl-slider-track, .sl-slider, .sl-slider::-moz-range-track", { height: `${size}px` })];
}
function checkboxRules(checkbox, corners) {
	if (checkbox === "native") return [];
	return [
		rule("input[type=\"checkbox\"]", {
			"-webkit-appearance": "none",
			appearance: "none",
			width: "13px",
			height: "13px",
			margin: "0",
			"flex-shrink": "0",
			border: "1px solid var(--color-border)",
			"border-radius": corners === "square" ? "0" : corners === "pill" ? "50%" : "3px",
			background: "var(--color-surface-2)",
			display: "inline-grid",
			"place-content": "center",
			"vertical-align": "middle",
			cursor: "pointer"
		}),
		rule("input[type=\"checkbox\"]::before", {
			content: "\"\"",
			width: "7px",
			height: "7px",
			transform: "scale(0)",
			background: "var(--color-text-primary)",
			"clip-path": "polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)"
		}),
		rule("input[type=\"checkbox\"]:checked", {
			background: "var(--color-slider-fill)",
			"border-color": "var(--color-slider-fill)"
		}),
		rule("input[type=\"checkbox\"]:checked::before", { transform: "scale(1)" }),
		rule("input[type=\"checkbox\"]:focus-visible", {
			outline: "1px solid var(--color-text-primary)",
			"outline-offset": "1px"
		})
	];
}
function focusRules(zoom) {
	if (zoom === "off") return [];
	return [rule(".sl-slider-value:focus, input[type=\"number\"]:focus", {
		transform: `scale(${zoom === "subtle" ? 1.2 : 1.45})`,
		"transform-origin": "right center",
		position: "relative",
		"z-index": "2",
		background: "var(--color-surface-2)",
		"box-shadow": "0 2px 8px rgba(0, 0, 0, 0.35)"
	})];
}
/** Open minus close braces outside strings and comments — the panel's only
*  check on custom CSS (the browser parser recovers from everything else). */
function braceBalance(css) {
	let depth = 0;
	let quote = null;
	for (let i = 0; i < css.length; i++) {
		const ch = css[i];
		if (quote) {
			if (ch === "\\") i++;
			else if (ch === quote) quote = null;
		} else if (ch === "/" && css[i + 1] === "*") {
			const end = css.indexOf("*/", i + 2);
			i = end < 0 ? css.length : end + 1;
		} else if (ch === "\"" || ch === "'") quote = ch;
		else if (ch === "{") depth++;
		else if (ch === "}") depth--;
	}
	return depth;
}
function compileCss(tweaks, customCss) {
	return [[
		...cornersRules(tweaks.corners),
		...knobRules(tweaks.knob, tweaks.knobSize, tweaks.trackSize),
		...trackRules(tweaks.trackSize),
		...checkboxRules(tweaks.checkbox, tweaks.corners),
		...focusRules(tweaks.focusZoom)
	].join("\n\n"), customCss.trim()].filter(Boolean).join("\n\n");
}
//#endregion
//#region src/runtime.ts
let React;
let api;
let ui;
const CONFIG_KEY = "config";
const STYLESHEET_ID = "com.safelight.input-styling.controls";
/** The first Safelight release with api.registerStylesheet. */
const REQUIRED_APP_VERSION = "2.5.4";
function initRuntime(a) {
	api = a;
	React = a.react;
	ui = a.ui;
}
function hasStylesheetApi() {
	return typeof api.registerStylesheet === "function";
}
function getConfig() {
	return sanitizeConfig(api.settings.get(CONFIG_KEY, null));
}
function applyStyles(config) {
	api.registerStylesheet?.({
		id: STYLESHEET_ID,
		css: compileCss(resolveTweaks(config), config.customCss)
	});
}
/** Persist and apply. The settings write also fires onChange (in this window
*  and others), which applies again — idempotent, and the explicit apply here
*  keeps the in-memory config live even if the write fails. */
function saveConfig(config) {
	try {
		api.settings.set(CONFIG_KEY, config);
	} catch (e) {
		console.warn("[input-styling] settings could not be saved:", e);
	}
	applyStyles(config);
}
//#endregion
//#region src/ui/Preview.tsx
function Preview() {
	const [exposure, setExposure] = React.useState(25);
	const [checked, setChecked] = React.useState(true);
	const [on, setOn] = React.useState(true);
	const [amount, setAmount] = React.useState(50);
	const { Slider } = api.components;
	return /* @__PURE__ */ React.createElement(ui.Card, null, /* @__PURE__ */ React.createElement(ui.Stack, { gap: 8 }, /* @__PURE__ */ React.createElement("span", { style: {
		fontSize: 10,
		letterSpacing: "0.1em",
		textTransform: "uppercase",
		color: ui.tokens.textMuted
	} }, "Preview"), /* @__PURE__ */ React.createElement(Slider, {
		label: "Exposure",
		value: exposure,
		min: -100,
		max: 100,
		onChange: setExposure
	}), /* @__PURE__ */ React.createElement(ui.Row, {
		gap: 12,
		wrap: true
	}, /* @__PURE__ */ React.createElement("label", { style: {
		display: "inline-flex",
		alignItems: "center",
		gap: 6,
		fontSize: 11,
		color: ui.tokens.textSecondary,
		cursor: "pointer"
	} }, /* @__PURE__ */ React.createElement("input", {
		type: "checkbox",
		checked,
		onChange: (e) => setChecked(e.target.checked)
	}), "Checkbox"), /* @__PURE__ */ React.createElement(ui.Toggle, {
		checked: on,
		onChange: setOn,
		label: "Switch"
	}), /* @__PURE__ */ React.createElement(ui.Button, {
		variant: "primary",
		size: "sm"
	}, "Primary"), /* @__PURE__ */ React.createElement(ui.Button, { size: "sm" }, "Button"), /* @__PURE__ */ React.createElement(ui.NumberInput, {
		value: amount,
		onChange: setAmount,
		"aria-label": "Sample number field"
	}))));
}
//#endregion
//#region src/ui/Preferences.tsx
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
const text = (size, color) => ({
	fontSize: size,
	lineHeight: 1.45,
	color,
	margin: 0
});
function TweakRow({ label, overridden, children }) {
	return /* @__PURE__ */ React.createElement("div", { style: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		padding: "2px 0 2px 10px",
		borderLeft: `2px solid ${overridden ? ui.tokens.sliderFill : "transparent"}`
	} }, /* @__PURE__ */ React.createElement("span", { style: {
		width: 110,
		flexShrink: 0,
		fontSize: 11,
		color: ui.tokens.textSecondary
	} }, label), /* @__PURE__ */ React.createElement("div", { style: {
		flex: 1,
		minWidth: 0
	} }, children));
}
function ChoiceRow({ tweakKey, config, onChange }) {
	const labels = OPTION_LABELS[tweakKey];
	const fromPreset = getPreset(config.preset).tweaks[tweakKey];
	const override = config.overrides[tweakKey];
	const options = [{
		value: FROM_PRESET,
		label: `From preset · ${labels[fromPreset]}`
	}, ...CHOICES[tweakKey].map((value) => ({
		value,
		label: labels[value]
	}))];
	return /* @__PURE__ */ React.createElement(TweakRow, {
		label: TWEAK_LABELS[tweakKey],
		overridden: override !== void 0
	}, /* @__PURE__ */ React.createElement(ui.Select, {
		value: override ?? FROM_PRESET,
		onChange: (v) => onChange(CHOICES[tweakKey].find((choice) => choice === v)),
		options,
		ariaLabel: TWEAK_LABELS[tweakKey]
	}));
}
function NumberRow({ tweakKey, config, effective, disabled, onChange }) {
	const override = config.overrides[tweakKey];
	const { min, max } = RANGES[tweakKey];
	return /* @__PURE__ */ React.createElement(TweakRow, {
		label: TWEAK_LABELS[tweakKey],
		overridden: override !== void 0
	}, /* @__PURE__ */ React.createElement(ui.Row, { gap: 6 }, /* @__PURE__ */ React.createElement(ui.NumberInput, {
		value: effective[tweakKey],
		min,
		max,
		step: 1,
		width: "56px",
		disabled,
		"aria-label": TWEAK_LABELS[tweakKey],
		onChange
	}), /* @__PURE__ */ React.createElement("span", { style: {
		fontSize: 11,
		color: ui.tokens.textMuted
	} }, "px"), override !== void 0 && /* @__PURE__ */ React.createElement(ui.Button, {
		size: "sm",
		variant: "ghost",
		title: "Back to the preset value",
		onClick: () => onChange(void 0)
	}, "↺")));
}
function CustomCssEditor({ value, onCommit }) {
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
	return /* @__PURE__ */ React.createElement(ui.Section, { title: "Custom CSS" }, /* @__PURE__ */ React.createElement(ui.TextArea, {
		value: draft,
		onChange: setDraft,
		mono: true,
		rows: 8,
		placeholder: CSS_PLACEHOLDER,
		"aria-label": "Custom CSS"
	}), unbalanced && /* @__PURE__ */ React.createElement("p", { style: text(10, "var(--color-label-yellow)") }, "Unbalanced braces — the CSS is applied as far as the browser can parse it."), /* @__PURE__ */ React.createElement("p", { style: text(10, ui.tokens.textMuted) }, "Applied live, after the preset and tweaks. Hooks: ", HOOKS.map((h) => h.selector).join(" · "), ". The README describes each one."));
}
function PreferencesPanel() {
	const [config, setConfig] = React.useState(() => getConfig());
	React.useEffect(() => api.settings.onChange((key) => {
		if (key === "config") setConfig(getConfig());
	}), []);
	const commit = React.useCallback((next) => {
		setConfig(next);
		saveConfig(next);
	}, []);
	const latest = React.useRef(config);
	React.useEffect(() => {
		latest.current = config;
	}, [config]);
	const commitCss = React.useCallback((customCss) => commit({
		...latest.current,
		customCss
	}), [commit]);
	if (!hasStylesheetApi()) return /* @__PURE__ */ React.createElement("p", { style: text(11, ui.tokens.textSecondary) }, "Input Styling needs Safelight ", REQUIRED_APP_VERSION, " or newer, which added the stylesheet API extensions restyle controls through. Nothing is applied until you update.");
	const preset = getPreset(config.preset);
	const effective = resolveTweaks(config);
	const dirty = isDirty(config);
	const setTweak = (key) => (value) => commit(setOverride(config, key, value));
	return /* @__PURE__ */ React.createElement(ui.Stack, {
		gap: 12,
		style: { maxWidth: 560 }
	}, /* @__PURE__ */ React.createElement("p", { style: text(11, ui.tokens.textSecondary) }, "Restyle Safelight's sliders, checkboxes, switches, buttons and fields: pick a preset, adjust any single aspect, or write your own CSS."), /* @__PURE__ */ React.createElement(ui.Field, {
		label: "Preset",
		hint: "Choosing a preset clears the tweaks below; custom CSS is kept."
	}, /* @__PURE__ */ React.createElement(ui.Select, {
		value: config.preset,
		onChange: (id) => commit(clearOverrides({
			...config,
			preset: getPreset(id).id
		})),
		options: PRESETS.map((p) => ({
			value: p.id,
			label: p.label
		})),
		ariaLabel: "Preset"
	}), /* @__PURE__ */ React.createElement("p", { style: {
		...text(10, ui.tokens.textMuted),
		marginTop: 4
	} }, preset.description, dirty ? " • modified" : "")), /* @__PURE__ */ React.createElement(Preview, null), /* @__PURE__ */ React.createElement(ui.Section, {
		title: "Tweaks",
		right: dirty ? /* @__PURE__ */ React.createElement(ui.Button, {
			size: "sm",
			onClick: () => commit(clearOverrides(config)),
			title: "Clear every override (keeps the preset and custom CSS)"
		}, "Reset tweaks") : null
	}, /* @__PURE__ */ React.createElement(ui.Stack, { gap: 2 }, /* @__PURE__ */ React.createElement(ChoiceRow, {
		tweakKey: "corners",
		config,
		onChange: setTweak("corners")
	}), /* @__PURE__ */ React.createElement(ChoiceRow, {
		tweakKey: "knob",
		config,
		onChange: setTweak("knob")
	}), /* @__PURE__ */ React.createElement(NumberRow, {
		tweakKey: "knobSize",
		config,
		effective,
		disabled: effective.knob === "none",
		onChange: setTweak("knobSize")
	}), /* @__PURE__ */ React.createElement(NumberRow, {
		tweakKey: "trackSize",
		config,
		effective,
		onChange: setTweak("trackSize")
	}), /* @__PURE__ */ React.createElement(ChoiceRow, {
		tweakKey: "checkbox",
		config,
		onChange: setTweak("checkbox")
	}), /* @__PURE__ */ React.createElement(ChoiceRow, {
		tweakKey: "focusZoom",
		config,
		onChange: setTweak("focusZoom")
	}))), /* @__PURE__ */ React.createElement(CustomCssEditor, {
		value: config.customCss,
		onCommit: commitCss
	}));
}
//#endregion
//#region src/index.ts
let unsubscribe = null;
function activate(api) {
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
			"theme"
		],
		fields: [],
		component: PreferencesPanel
	});
	unsubscribe = api.settings.onChange((key) => {
		if (key === "config") applyStyles(getConfig());
	});
}
function deactivate() {
	unsubscribe?.();
	unsubscribe = null;
}
//#endregion
export { activate, deactivate };
