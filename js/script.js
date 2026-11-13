"use strict";

/* ------------------------------------------------------------------ *
 *  Constants
 * ------------------------------------------------------------------ */

const BACKGROUNDS = [
	{ id: "bg", label: "City Lights", url: "img/bg.mp4" },
	{ id: "bg_2", label: "Neon Skyline", url: "img/bg_2.mp4" },
	{ id: "bg_cop", label: "Cyber Street", url: "img/bg_cop.mp4" },
];

const SEARCH_ENGINES = {
	default: { label: "Browser default", icon: "travel_explore", url: null },
	google: { label: "Google", icon: "G", url: "https://www.google.com/search?q=" },
	bing: { label: "Bing", icon: "B", url: "https://www.bing.com/search?q=" },
	duckduckgo: { label: "DuckDuckGo", icon: "D", url: "https://duckduckgo.com/?q=" },
	brave: { label: "Brave", icon: "V", url: "https://search.brave.com/search?q=" },
	youtube: { label: "YouTube", icon: "Y", url: "https://www.youtube.com/results?search_query=" },
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"];
const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n) => (n < 10 ? "0" + n : "" + n);

/* ------------------------------------------------------------------ *
 *  Settings model
 * ------------------------------------------------------------------ */

const SETTINGS_KEY = "ncSettings";

const DEFAULTS = {
	// Clock
	showClock: true,
	hour24: false,
	showSeconds: true,
	showAmPm: true,
	showDate: true,
	dateFormat: "full",
	clockPosition: "bottom-right",
	clockSize: 100,

	// Greeting
	showGreeting: false,
	userName: "",

	// Search
	showSearch: true,
	searchEngine: "default",
	searchPosition: "top",
	openInNewTab: false,

	// Quick links
	showShortcuts: true,
	shortcuts: [],

	// Background
	background: "shuffle",
	overlayDim: 30,
	bgBlur: 0,
	muteVideo: true,
	pauseVideo: false,

	// Appearance
	accent: "#0072ff",
	textColor: "#ffffff",
	fontFamily: "Poppins",

	// General
	focusMode: false,
	twinkle: false,
};

let settings = loadSettings();

function loadSettings() {
	try {
		return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)));
	} catch {
		return { ...DEFAULTS };
	}
}

// Drop stored values whose type doesn't match the default (e.g. NaN saved as null).
function sanitizeSettings(stored) {
	stored = stored || {};
	const merged = { ...DEFAULTS };
	for (const key of Object.keys(DEFAULTS)) {
		const v = stored[key];
		const valid = Array.isArray(DEFAULTS[key])
			? Array.isArray(v)
			: typeof v === typeof DEFAULTS[key] && (typeof v !== "number" || Number.isFinite(v));
		if (valid) merged[key] = v;
	}
	return merged;
}

function saveSettings() {
	localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function setSetting(key, value) {
	settings[key] = value;
	saveSettings();
	applySettings();
}

/* ------------------------------------------------------------------ *
 *  Settings panel schema
 * ------------------------------------------------------------------ */

const SCHEMA = [
	{
		title: "Clock",
		icon: "schedule",
		items: [
			{ key: "showClock", label: "Show clock", type: "toggle" },
			{ key: "hour24", label: "24-hour time", type: "toggle" },
			{ key: "showSeconds", label: "Show seconds", type: "toggle" },
			{ key: "showAmPm", label: "Show AM/PM", type: "toggle" },
			{ key: "showDate", label: "Show date", type: "toggle" },
			{
				key: "dateFormat", label: "Date format", type: "select", options: [
					{ value: "full", label: "Monday, January 5, 2026" },
					{ value: "short", label: "Mon, Jan 5" },
					{ value: "mdy", label: "January 5, 2026" },
					{ value: "dmy", label: "5 January 2026" },
					{ value: "iso", label: "2026-01-05" },
					{ value: "weekday", label: "Monday" },
				],
			},
			{
				key: "clockPosition", label: "Position", type: "select", options: [
					{ value: "top-left", label: "Top left" },
					{ value: "top-center", label: "Top center" },
					{ value: "top-right", label: "Top right" },
					{ value: "center-left", label: "Center left" },
					{ value: "center", label: "Center" },
					{ value: "center-right", label: "Center right" },
					{ value: "bottom-left", label: "Bottom left" },
					{ value: "bottom-center", label: "Bottom center" },
					{ value: "bottom-right", label: "Bottom right" },
				],
			},
			{ key: "clockSize", label: "Size", type: "range", min: 50, max: 220, step: 5, unit: "%" },
		],
	},
	{
		title: "Greeting",
		icon: "waving_hand",
		items: [
			{ key: "showGreeting", label: "Show greeting", type: "toggle" },
			{ key: "userName", label: "Your name", type: "text", placeholder: "e.g. Pat" },
		],
	},
	{
		title: "Search",
		icon: "search",
		items: [
			{ key: "showSearch", label: "Show search bar", type: "toggle" },
			{
				key: "searchEngine", label: "Engine", type: "select",
				options: Object.entries(SEARCH_ENGINES).map(([value, e]) => ({ value, label: e.label })),
			},
			{
				key: "searchPosition", label: "Position", type: "select", options: [
					{ value: "top", label: "Top" },
					{ value: "center", label: "Center" },
				],
			},
			{ key: "openInNewTab", label: "Open results in new tab", type: "toggle" },
		],
	},
	{
		title: "Quick links",
		icon: "apps",
		items: [
			{ key: "showShortcuts", label: "Show quick links", type: "toggle" },
			{ key: "shortcuts", type: "shortcuts" },
		],
	},
	{
		title: "Background",
		icon: "image",
		items: [
			{
				key: "background", label: "Scene", type: "select", options: [
					{ value: "shuffle", label: "Shuffle each tab" },
					...BACKGROUNDS.map((b) => ({ value: b.id, label: b.label })),
				],
			},
			{ key: "overlayDim", label: "Dim", type: "range", min: 0, max: 90, step: 5, unit: "%" },
			{ key: "bgBlur", label: "Blur", type: "range", min: 0, max: 24, step: 1, unit: "px" },
			{ key: "muteVideo", label: "Mute video", type: "toggle" },
			{ key: "pauseVideo", label: "Pause video", type: "toggle" },
		],
	},
	{
		title: "Appearance",
		icon: "palette",
		items: [
			{ key: "accent", label: "Accent color", type: "color" },
			{ key: "textColor", label: "Text color", type: "color" },
			{
				key: "fontFamily", label: "Font", type: "select", options: [
					{ value: "Poppins", label: "Poppins" },
					{ value: "Inter", label: "Inter" },
					{ value: "Roboto Mono", label: "Roboto Mono" },
					{ value: "Playfair Display", label: "Playfair Display" },
					{ value: "system-ui", label: "System" },
				],
			},
			{ key: "twinkle", label: "Twinkling stars", type: "toggle" },
		],
	},
	{
		title: "General",
		icon: "settings",
		items: [
			{ key: "focusMode", label: "Focus mode (clock only)", type: "toggle" },
		],
	},
];

/* ------------------------------------------------------------------ *
 *  Boot
 * ------------------------------------------------------------------ */

let bgVideo = null;
let clockTimer = null;

document.addEventListener("DOMContentLoaded", () => {
	document.body.style.setProperty("--scale", screen.width / 2560);
	initBackground();
	initClock();
	initSearch();
	initShortcuts();
	buildSettingsPanel();
	initSettingsUI();
	initKeyboard();
	applySettings();
});

/* ------------------------------------------------------------------ *
 *  Background
 * ------------------------------------------------------------------ */

function resolveBackgroundUrl() {
	if (settings.background === "shuffle") {
		const index = ((parseInt(localStorage.getItem("videoIndex")) || 0) + 1) % BACKGROUNDS.length;
		localStorage.setItem("videoIndex", index);
		return BACKGROUNDS[index].url;
	}
	const found = BACKGROUNDS.find((b) => b.id === settings.background);
	return (found || BACKGROUNDS[0]).url;
}

function initBackground() {
	bgVideo = document.getElementById("bgVdo");
	if (!bgVideo) {
		bgVideo = document.createElement("video");
		bgVideo.id = "bgVdo";
		bgVideo.autoplay = true;
		bgVideo.loop = true;
		bgVideo.playsInline = true;
		bgVideo.muted = true;
		bgVideo.defaultMuted = true;
		bgVideo.setAttribute("muted", "");
		document.body.prepend(bgVideo);
	}
	loadBackgroundVideo();
}

function loadBackgroundVideo() {
	const url = resolveBackgroundUrl();
	if (bgVideo.getAttribute("src") !== url) {
		bgVideo.src = url;
	}
	bgVideo.play().catch(() => {});
}

/* ------------------------------------------------------------------ *
 *  Clock
 * ------------------------------------------------------------------ */

function formatDate(now) {
	const d = now.getDate();
	switch (settings.dateFormat) {
		case "short": return `${dayShort[now.getDay()]}, ${monthShort[now.getMonth()]} ${d}`;
		case "mdy": return `${monthNames[now.getMonth()]} ${d}, ${now.getFullYear()}`;
		case "dmy": return `${d} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
		case "iso": return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(d)}`;
		case "weekday": return dayNames[now.getDay()];
		default: return `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${d}, ${now.getFullYear()}`;
	}
}

function renderClock() {
	const timeEl = document.getElementById("time");
	const todayEl = document.getElementById("today");
	const now = new Date();

	let h = now.getHours();
	let session = "";
	if (!settings.hour24) {
		session = h >= 12 ? "PM" : "AM";
		h = h % 12 || 12;
	}

	let timeStr = `${pad(h)}:${pad(now.getMinutes())}`;
	if (settings.showSeconds) timeStr += `:${pad(now.getSeconds())}`;
	if (!settings.hour24 && settings.showAmPm) timeStr += ` ${session}`;
	timeEl.textContent = timeStr;

	todayEl.textContent = settings.showDate ? formatDate(now) : "";
}

function initClock() {
	renderClock();
	if (clockTimer) clearInterval(clockTimer);
	clockTimer = setInterval(renderClock, 1000);
}

/* ------------------------------------------------------------------ *
 *  Greeting
 * ------------------------------------------------------------------ */

function renderGreeting() {
	const el = document.getElementById("greeting");
	const h = new Date().getHours();
	let part = "Good evening";
	if (h < 5) part = "Good night";
	else if (h < 12) part = "Good morning";
	else if (h < 18) part = "Good afternoon";
	const name = settings.userName.trim();
	el.textContent = name ? `${part}, ${name}.` : `${part}.`;
}

/* ------------------------------------------------------------------ *
 *  Search
 * ------------------------------------------------------------------ */

function initSearch() {
	const trigger = document.getElementById("searchTrigger");
	const input = document.getElementById("searchInput");

	const runSearch = () => {
		const query = input.value.trim();
		if (!query) {
			input.classList.add("shake");
			setTimeout(() => input.classList.remove("shake"), 500);
			return;
		}
		const engine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.default;
		if (engine.url) {
			const target = engine.url + encodeURIComponent(query);
			if (settings.openInNewTab) window.open(target, "_blank");
			else window.location.href = target;
		} else if (typeof chrome !== "undefined" && chrome.search) {
			chrome.search.query({
				text: query,
				disposition: settings.openInNewTab ? "NEW_TAB" : "CURRENT_TAB",
			});
		} else {
			const target = SEARCH_ENGINES.google.url + encodeURIComponent(query);
			if (settings.openInNewTab) window.open(target, "_blank");
			else window.location.href = target;
		}
	};

	trigger.addEventListener("click", runSearch);
	input.addEventListener("keyup", (e) => {
		if (e.key === "Enter") runSearch();
	});
}

function renderSearchEngineBadge() {
	const badge = document.getElementById("searchEngineBadge");
	const engine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.default;
	const isMaterial = engine.icon.length > 1;
	badge.textContent = engine.icon;
	badge.classList.toggle("material-symbols-outlined", isMaterial);
	badge.classList.toggle("letter-badge", !isMaterial);
	badge.title = engine.label;
}

/* ------------------------------------------------------------------ *
 *  Quick links / shortcuts
 * ------------------------------------------------------------------ */

function normalizeUrl(url) {
	if (!/^https?:\/\//i.test(url)) return "https://" + url;
	return url;
}

function faviconFor(url) {
	try {
		const host = new URL(normalizeUrl(url)).hostname;
		return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
	} catch {
		return "";
	}
}

function initShortcuts() {
	renderShortcuts();
}

function renderShortcuts() {
	const container = document.getElementById("shortcuts");
	container.innerHTML = "";
	settings.shortcuts.forEach((s) => {
		const a = document.createElement("a");
		a.className = "shortcut";
		a.href = normalizeUrl(s.url);
		a.title = s.name || s.url;

		const icon = document.createElement("div");
		icon.className = "shortcut-icon";
		const img = document.createElement("img");
		img.src = faviconFor(s.url);
		img.alt = "";
		img.addEventListener("error", () => {
			icon.textContent = (s.name || s.url).charAt(0).toUpperCase();
		});
		icon.appendChild(img);

		const label = document.createElement("span");
		label.className = "shortcut-label";
		label.textContent = s.name || new URL(normalizeUrl(s.url)).hostname.replace(/^www\./, "");

		a.append(icon, label);
		container.appendChild(a);
	});
}

/* ------------------------------------------------------------------ *
 *  Apply settings to the page
 * ------------------------------------------------------------------ */

function applySettings() {
	const body = document.body;
	const root = body.style;

	// Appearance
	root.setProperty("--accent", settings.accent);
	root.setProperty("--text-color", settings.textColor);
	root.setProperty("--font", `"${settings.fontFamily}", sans-serif`);
	root.setProperty("--overlay-dim", settings.overlayDim / 100);
	root.setProperty("--bg-blur", settings.bgBlur + "px");
	root.setProperty("--bg-scale", (1 + settings.bgBlur * 0.012).toFixed(3));
	root.setProperty("--clock-scale", settings.clockSize / 100);

	// Positions / visibility via data attributes + classes
	body.dataset.clockPos = settings.clockPosition;
	body.dataset.searchPos = settings.searchPosition;
	body.classList.toggle("focus-mode", settings.focusMode);
	body.classList.toggle("twinkle", settings.twinkle);

	toggleEl("clock", settings.showClock);
	toggleEl("greeting", settings.showGreeting && !settings.focusMode);
	toggleEl("searchBar", settings.showSearch && !settings.focusMode);
	toggleEl("shortcuts", settings.showShortcuts && settings.shortcuts.length > 0 && !settings.focusMode);

	// Background
	if (bgVideo) {
		bgVideo.muted = settings.muteVideo;
		bgVideo.defaultMuted = settings.muteVideo;
		if (settings.pauseVideo) bgVideo.pause();
		else bgVideo.play().catch(() => {});
		if (settings.background !== "shuffle") loadBackgroundVideo();
	}

	renderClock();
	renderGreeting();
	renderSearchEngineBadge();
	renderShortcuts();
	ensureStars();
}

function toggleEl(id, visible) {
	const el = document.getElementById(id);
	if (el) el.classList.toggle("hidden", !visible);
}

/* ------------------------------------------------------------------ *
 *  Twinkling stars overlay (pure CSS dots)
 * ------------------------------------------------------------------ */

function ensureStars() {
	let layer = document.getElementById("stars");
	if (!settings.twinkle) {
		if (layer) layer.remove();
		return;
	}
	if (layer) return;
	layer = document.createElement("div");
	layer.id = "stars";
	for (let i = 0; i < 60; i++) {
		const s = document.createElement("span");
		s.style.left = Math.random() * 100 + "%";
		s.style.top = Math.random() * 60 + "%";
		s.style.animationDelay = Math.random() * 4 + "s";
		s.style.transform = `scale(${0.4 + Math.random()})`;
		layer.appendChild(s);
	}
	document.body.appendChild(layer);
}

/* ------------------------------------------------------------------ *
 *  Settings panel UI
 * ------------------------------------------------------------------ */

function buildSettingsPanel() {
	const body = document.getElementById("settingsBody");
	body.innerHTML = "";

	SCHEMA.forEach((section) => {
		const sec = document.createElement("section");
		sec.className = "settings-section";

		const h = document.createElement("h3");
		h.innerHTML = `<span class="material-symbols-outlined">${section.icon}</span>${section.title}`;
		sec.appendChild(h);

		section.items.forEach((item) => sec.appendChild(renderControl(item)));
		body.appendChild(sec);
	});
}

function renderControl(item) {
	if (item.type === "shortcuts") return renderShortcutsEditor();

	const row = document.createElement("label");
	row.className = "setting-row";

	const text = document.createElement("span");
	text.className = "setting-label";
	text.textContent = item.label;
	row.appendChild(text);

	let control;
	switch (item.type) {
		case "toggle": {
			control = document.createElement("input");
			control.type = "checkbox";
			control.className = "switch";
			control.checked = !!settings[item.key];
			control.addEventListener("change", () => setSetting(item.key, control.checked));
			break;
		}
		case "select": {
			control = document.createElement("select");
			item.options.forEach((o) => {
				const opt = document.createElement("option");
				opt.value = o.value;
				opt.textContent = o.label;
				control.appendChild(opt);
			});
			control.value = settings[item.key];
			control.addEventListener("change", () => setSetting(item.key, control.value));
			break;
		}
		case "range": {
			const wrap = document.createElement("span");
			wrap.className = "range-wrap";
			const range = document.createElement("input");
			range.type = "range";
			range.min = item.min;
			range.max = item.max;
			range.step = item.step;
			range.value = settings[item.key];
			const out = document.createElement("span");
			out.className = "range-value";
			out.textContent = settings[item.key] + (item.unit || "");
			range.addEventListener("input", () => {
				out.textContent = range.value + (item.unit || "");
				setSetting(item.key, Number(range.value));
			});
			wrap.append(range, out);
			control = wrap;
			break;
		}
		case "color": {
			control = document.createElement("input");
			control.type = "color";
			control.value = settings[item.key];
			control.addEventListener("input", () => setSetting(item.key, control.value));
			break;
		}
		case "text": {
			control = document.createElement("input");
			control.type = "text";
			control.className = "text-input";
			control.placeholder = item.placeholder || "";
			control.value = settings[item.key];
			control.addEventListener("input", () => setSetting(item.key, control.value));
			break;
		}
	}

	if (control) row.appendChild(control);
	return row;
}

function renderShortcutsEditor() {
	const wrap = document.createElement("div");
	wrap.className = "shortcuts-editor";

	const list = document.createElement("div");
	list.className = "shortcut-list";

	function refresh() {
		list.innerHTML = "";
		settings.shortcuts.forEach((s, i) => {
			const item = document.createElement("div");
			item.className = "shortcut-edit-row";
			const label = document.createElement("span");
			label.textContent = s.name || s.url;
			const del = document.createElement("button");
			del.className = "icon-btn material-symbols-outlined";
			del.textContent = "delete";
			del.title = "Remove";
			del.addEventListener("click", () => {
				settings.shortcuts.splice(i, 1);
				saveSettings();
				applySettings();
				refresh();
			});
			item.append(label, del);
			list.appendChild(item);
		});
	}
	refresh();

	const form = document.createElement("div");
	form.className = "shortcut-add";
	const nameInput = document.createElement("input");
	nameInput.type = "text";
	nameInput.placeholder = "Name";
	nameInput.className = "text-input";
	const urlInput = document.createElement("input");
	urlInput.type = "text";
	urlInput.placeholder = "example.com";
	urlInput.className = "text-input";
	const add = document.createElement("button");
	add.className = "ghost-btn";
	add.innerHTML = `<span class="material-symbols-outlined">add</span>Add`;
	add.addEventListener("click", () => {
		const url = urlInput.value.trim();
		if (!url) return;
		settings.shortcuts.push({ name: nameInput.value.trim(), url });
		saveSettings();
		applySettings();
		refresh();
		nameInput.value = "";
		urlInput.value = "";
	});
	urlInput.addEventListener("keyup", (e) => { if (e.key === "Enter") add.click(); });

	form.append(nameInput, urlInput, add);
	wrap.append(list, form);
	return wrap;
}

function openSettings() {
	document.getElementById("settingsPanel").classList.add("open");
	document.getElementById("settingsOverlay").classList.add("open");
	document.getElementById("settingsPanel").setAttribute("aria-hidden", "false");
}

function closeSettings() {
	document.getElementById("settingsPanel").classList.remove("open");
	document.getElementById("settingsOverlay").classList.remove("open");
	document.getElementById("settingsPanel").setAttribute("aria-hidden", "true");
}

function initSettingsUI() {
	document.getElementById("settingsToggle").addEventListener("click", openSettings);
	document.getElementById("settingsClose").addEventListener("click", closeSettings);
	document.getElementById("settingsOverlay").addEventListener("click", closeSettings);

	document.getElementById("resetSettings").addEventListener("click", () => {
		if (!confirm("Reset all settings to defaults?")) return;
		settings = { ...DEFAULTS, shortcuts: [] };
		saveSettings();
		buildSettingsPanel();
		applySettings();
	});

	document.getElementById("exportSettings").addEventListener("click", () => {
		const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = "night-city-settings.json";
		a.click();
		URL.revokeObjectURL(a.href);
	});

	const importFile = document.getElementById("importFile");
	document.getElementById("importSettings").addEventListener("click", () => importFile.click());
	importFile.addEventListener("change", () => {
		const file = importFile.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const data = JSON.parse(reader.result);
				settings = sanitizeSettings(data);
				saveSettings();
				buildSettingsPanel();
				applySettings();
			} catch {
				alert("Could not read that settings file.");
			}
		};
		reader.readAsText(file);
		importFile.value = "";
	});
}

function initKeyboard() {
	document.addEventListener("keydown", (e) => {
		const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
		if (e.key === "Escape") {
			closeSettings();
			return;
		}
		if (typing) return;
		if (e.key === "s" || e.key === "S") {
			e.preventDefault();
			openSettings();
		} else if (e.key === "/") {
			e.preventDefault();
			const input = document.getElementById("searchInput");
			if (input && !settings.focusMode && settings.showSearch) input.focus();
		}
	});
}
