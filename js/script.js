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

const WIDGET_TYPES = { both: "Time + weather", weather: "Weather", time: "Time" };

function uid() {
	return Math.random().toString(36).slice(2, 10);
}

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
	linksNewTab: false,
	showLinkLabels: true,
	linkSize: 100,

	// Widgets
	showWidgets: true,
	widgets: [],
	widgetPosition: "top-left",
	tempUnit: "celsius",

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
	showSettingsButton: true,
};

let settings = loadSettings();

function loadSettings() {
	try {
		return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)));
	} catch {
		return sanitizeSettings({});
	}
}

function sanitizeLink(s) {
	if (!s || typeof s.url !== "string" || !s.url.trim()) return null;
	return { name: typeof s.name === "string" ? s.name : "", url: s.url };
}

function sanitizeShortcut(s) {
	if (s && Array.isArray(s.items)) {
		return {
			name: typeof s.name === "string" && s.name ? s.name : "Folder",
			items: s.items.map(sanitizeLink).filter(Boolean),
		};
	}
	return sanitizeLink(s);
}

function isValidTz(tz) {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

function sanitizeWidget(w) {
	if (!w || typeof w.name !== "string" || !Number.isFinite(w.lat) || !Number.isFinite(w.lon)) return null;
	return {
		id: typeof w.id === "string" ? w.id : uid(),
		name: w.name,
		sub: typeof w.sub === "string" ? w.sub : "",
		lat: w.lat,
		lon: w.lon,
		tz: typeof w.tz === "string" && isValidTz(w.tz) ? w.tz : "UTC",
		type: Object.hasOwn(WIDGET_TYPES, w.type) ? w.type : "both",
	};
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
	merged.shortcuts = merged.shortcuts.map(sanitizeShortcut).filter(Boolean);
	merged.widgets = merged.widgets.map(sanitizeWidget).filter(Boolean);
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
			{ key: "showLinkLabels", label: "Show labels", type: "toggle" },
			{ key: "linksNewTab", label: "Open links in new tab", type: "toggle" },
			{ key: "linkSize", label: "Icon size", type: "range", min: 60, max: 160, step: 5, unit: "%" },
			{ key: "shortcuts", type: "shortcuts" },
		],
	},
	{
		title: "Widgets",
		icon: "widgets",
		items: [
			{ key: "showWidgets", label: "Show widgets", type: "toggle" },
			{
				key: "widgetPosition", label: "Position", type: "select", options: [
					{ value: "top-left", label: "Top left" },
					{ value: "top-center", label: "Top center" },
					{ value: "top-right", label: "Top right" },
					{ value: "center-left", label: "Center left" },
					{ value: "center-right", label: "Center right" },
					{ value: "bottom-left", label: "Bottom left" },
				],
			},
			{
				key: "tempUnit", label: "Temperature", type: "select", options: [
					{ value: "celsius", label: "Celsius (°C)" },
					{ value: "fahrenheit", label: "Fahrenheit (°F)" },
				],
			},
			{ key: "widgets", type: "widgets" },
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
			{ key: "showSettingsButton", label: "Show settings button", type: "toggle" },
			{ type: "keys" },
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
	setInterval(renderWidgets, WEATHER_TTL);
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
	updateWidgetClocks();
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

function linkLabel(s) {
	if (s.name) return s.name;
	try {
		return new URL(normalizeUrl(s.url)).hostname.replace(/^www\./, "");
	} catch {
		return s.url;
	}
}

function openLink(s) {
	const url = normalizeUrl(s.url);
	if (settings.linksNewTab) window.open(url, "_blank", "noopener");
	else window.location.href = url;
}

let openFolderRef = null;

function initShortcuts() {
	document.addEventListener("click", (e) => {
		if (openFolderRef && !e.target.closest("#folderPopup, #shortcuts .folder")) closeFolder();
	});
	document.getElementById("folderPopupEdit").addEventListener("click", () => openSettings("Quick links"));
	renderShortcuts();
}

function createLinkIcon(s) {
	const icon = el("div", "shortcut-icon");
	const img = el("img");
	img.src = faviconFor(s.url);
	img.alt = "";
	img.addEventListener("error", () => {
		icon.textContent = linkLabel(s).charAt(0).toUpperCase();
	});
	icon.appendChild(img);
	return icon;
}

function createLinkTile(s, i) {
	const a = el("a", "shortcut");
	a.href = normalizeUrl(s.url);
	if (settings.linksNewTab) {
		a.target = "_blank";
		a.rel = "noopener noreferrer";
	}
	a.title = `${linkLabel(s)}${i < 9 ? `  [${i + 1}]` : ""}\n${a.href}`;
	a.append(createLinkIcon(s), el("span", "shortcut-label", linkLabel(s)));
	return a;
}

function createFolderTile(folder, i) {
	const tile = el("button", "shortcut folder");
	tile.type = "button";
	tile.title = `${folder.name} (${folder.items.length})${i < 9 ? `  [${i + 1}]` : ""}`;

	const icon = el("div", "shortcut-icon folder-icon");
	if (!folder.items.length) {
		icon.classList.add("empty");
		icon.appendChild(el("span", "material-symbols-outlined", "folder"));
	}
	folder.items.slice(0, 4).forEach((l) => {
		const img = el("img");
		img.alt = "";
		img.src = faviconFor(l.url);
		img.addEventListener("error", () => img.replaceWith(el("span", "mini-letter", linkLabel(l).charAt(0).toUpperCase())));
		icon.appendChild(img);
	});

	tile.append(icon, el("span", "shortcut-label", folder.name));
	tile.addEventListener("click", (e) => {
		e.stopPropagation();
		toggleFolder(folder, tile);
	});
	return tile;
}

function renderShortcuts() {
	closeFolder();
	const container = document.getElementById("shortcuts");
	container.innerHTML = "";
	settings.shortcuts.forEach((s, i) => {
		container.appendChild(s.items ? createFolderTile(s, i) : createLinkTile(s, i));
	});

	const add = el("button", "shortcut add-tile");
	add.type = "button";
	add.title = "Add quick link";
	add.append(el("div", "shortcut-icon material-symbols-outlined", "add"), el("span", "shortcut-label", "Add"));
	add.addEventListener("click", () => openSettings("Quick links"));
	container.appendChild(add);
}

function toggleFolder(folder, tile) {
	if (openFolderRef === folder) {
		closeFolder();
		return;
	}
	openFolderRef = folder;
	const popup = document.getElementById("folderPopup");
	document.getElementById("folderPopupTitle").textContent = folder.name;
	const grid = document.getElementById("folderPopupGrid");
	grid.innerHTML = "";
	folder.items.forEach((l, i) => grid.appendChild(createLinkTile(l, i)));
	if (!folder.items.length) grid.appendChild(el("div", "empty-hint", "Empty folder. Drag links into it in Settings."));

	popup.classList.add("open");
	const r = tile.getBoundingClientRect();
	const half = popup.offsetWidth / 2 + 12;
	popup.style.left = Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half) + "px";
	popup.style.bottom = window.innerHeight - r.top + 12 + "px";
	document.querySelectorAll("#shortcuts .folder").forEach((t) => t.classList.toggle("active-folder", t === tile));
}

function closeFolder() {
	openFolderRef = null;
	document.getElementById("folderPopup").classList.remove("open");
	document.querySelectorAll("#shortcuts .active-folder").forEach((t) => t.classList.remove("active-folder"));
}

/* ------------------------------------------------------------------ *
 *  Widgets (weather + world clocks, via Open-Meteo - no API key)
 * ------------------------------------------------------------------ */

const WEATHER_TTL = 15 * 60 * 1000;
const WEATHER_CACHE_KEY = "ncWeather";
const weatherInflight = new Map();
const tzFormatters = new Map();
const offsetFormatters = new Map();
let weatherCache = loadWeatherCache();
let widgetClocks = [];

function loadWeatherCache() {
	try {
		return JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY)) || {};
	} catch {
		return {};
	}
}

function saveWeatherCache() {
	const cutoff = Date.now() - 24 * 60 * 60 * 1000;
	for (const k of Object.keys(weatherCache)) {
		if (!(weatherCache[k].t > cutoff)) delete weatherCache[k];
	}
	localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherCache));
}

async function geocode(query) {
	const name = query.split(",")[0].trim();
	const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`);
	if (!res.ok) throw new Error(res.status);
	const data = await res.json();
	return (data.results || []).filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
}

function placeSub(r) {
	return [r.admin1, r.country].filter(Boolean).join(", ");
}

function getWeather(w) {
	const unit = settings.tempUnit;
	const key = `${w.lat.toFixed(3)},${w.lon.toFixed(3)},${unit}`;
	const hit = weatherCache[key];
	if (hit && Date.now() - hit.t < WEATHER_TTL) return Promise.resolve(hit.d);
	if (weatherInflight.has(key)) return weatherInflight.get(key);

	const params = new URLSearchParams({
		latitude: w.lat,
		longitude: w.lon,
		current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m",
		daily: "temperature_2m_max,temperature_2m_min",
		timezone: "auto",
		forecast_days: 1,
		temperature_unit: unit,
		wind_speed_unit: unit === "fahrenheit" ? "mph" : "kmh",
	});
	const p = fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
		.then((r) => {
			if (!r.ok) throw new Error(r.status);
			return r.json();
		})
		.then((j) => {
			const c = j.current;
			const d = {
				temp: c.temperature_2m,
				feels: c.apparent_temperature,
				hum: c.relative_humidity_2m,
				code: c.weather_code,
				isDay: !!c.is_day,
				wind: c.wind_speed_10m,
				hi: j.daily.temperature_2m_max[0],
				lo: j.daily.temperature_2m_min[0],
			};
			weatherCache[key] = { t: Date.now(), d };
			saveWeatherCache();
			return d;
		})
		.catch((err) => {
			if (hit) return hit.d;
			throw err;
		})
		.finally(() => weatherInflight.delete(key));
	weatherInflight.set(key, p);
	return p;
}

// WMO weather codes -> [material icon, description]
function weatherInfo(code, isDay) {
	if (code === 0) return [isDay ? "clear_day" : "clear_night", "Clear"];
	if (code <= 2) return [isDay ? "partly_cloudy_day" : "partly_cloudy_night", code === 1 ? "Mostly clear" : "Partly cloudy"];
	if (code === 3) return ["cloud", "Overcast"];
	if (code <= 48) return ["foggy", "Fog"];
	if (code <= 57) return ["rainy", "Drizzle"];
	if (code <= 67) return ["rainy", "Rain"];
	if (code <= 77) return ["weather_snowy", "Snow"];
	if (code <= 82) return ["rainy", "Showers"];
	if (code <= 86) return ["weather_snowy", "Snow showers"];
	return ["thunderstorm", "Thunderstorm"];
}

function formatTzTime(tz, now) {
	const key = `${tz}|${settings.hour24}`;
	if (!tzFormatters.has(key)) {
		tzFormatters.set(key, new Intl.DateTimeFormat("en-US", {
			timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: settings.hour24 ? "h23" : "h12",
		}));
	}
	let s = tzFormatters.get(key).format(now);
	if (!settings.hour24 && !settings.showAmPm) s = s.replace(/\s*[AP]M$/i, "");
	return s;
}

function tzOffsetMinutes(tz, date) {
	if (!offsetFormatters.has(tz)) {
		offsetFormatters.set(tz, new Intl.DateTimeFormat("en-US", {
			timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric",
		}));
	}
	const t = Math.floor(date.getTime() / 60000) * 60000;
	const p = Object.fromEntries(offsetFormatters.get(tz).formatToParts(t).map((x) => [x.type, x.value]));
	return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t) / 60000);
}

function tzRelative(tz, now) {
	const diff = tzOffsetMinutes(tz, now) + now.getTimezoneOffset();
	const there = new Date(now.getTime() + diff * 60000);
	const dayDiff = Math.round(
		(new Date(there.getFullYear(), there.getMonth(), there.getDate()) -
			new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
	const day = dayDiff > 0 ? "Tomorrow" : dayDiff < 0 ? "Yesterday" : "Today";
	if (!diff) return `${day}, same as you`;
	const abs = Math.abs(diff);
	return `${day}, ${diff > 0 ? "+" : "-"}${Math.floor(abs / 60)}${abs % 60 ? ":" + pad(abs % 60) : ""}h`;
}

function updateWidgetClocks() {
	if (!widgetClocks.length) return;
	const now = new Date();
	widgetClocks.forEach(({ tz, timeEl, relEl }) => {
		timeEl.textContent = formatTzTime(tz, now);
		relEl.textContent = tzRelative(tz, now);
	});
}

function renderWidgets() {
	const container = document.getElementById("widgets");
	container.innerHTML = "";
	widgetClocks = [];
	settings.widgets.forEach((w) => container.appendChild(createWidget(w)));
	updateWidgetClocks();
}

function createWidget(w) {
	const card = el("div", `widget widget-${w.type}`);
	const place = w.sub ? `${w.name}, ${w.sub}` : w.name;
	card.title = place;

	const main = el("div", "widget-main");
	main.appendChild(el("div", "widget-city", w.name));
	const figures = el("div", "widget-figures");

	if (w.type !== "weather") {
		const relEl = el("div", "widget-line");
		const timeEl = el("div", "widget-time");
		main.appendChild(relEl);
		figures.appendChild(timeEl);
		widgetClocks.push({ tz: w.tz, timeEl, relEl });
	}

	if (w.type !== "time") {
		const wxLine = el("div", "widget-line", "Loading weather\u2026");
		const icon = el("span", "material-symbols-outlined", "cloud");
		const value = el("span", "", "--\u00b0");
		const temp = el("div", "widget-temp");
		temp.append(icon, value);
		main.appendChild(wxLine);
		figures.appendChild(temp);

		getWeather(w).then((d) => {
			const [glyph, desc] = weatherInfo(d.code, d.isDay);
			const wind = settings.tempUnit === "fahrenheit" ? "mph" : "km/h";
			icon.textContent = glyph;
			value.textContent = `${Math.round(d.temp)}\u00b0`;
			wxLine.textContent = `${desc} \u00b7 H ${Math.round(d.hi)}\u00b0 L ${Math.round(d.lo)}\u00b0`;
			card.title = `${place}\n${desc}, feels like ${Math.round(d.feels)}\u00b0\nHumidity ${d.hum}% \u00b7 Wind ${Math.round(d.wind)} ${wind}`;
		}).catch(() => {
			icon.textContent = "cloud_off";
			wxLine.textContent = "Weather unavailable";
		});
	}

	card.append(main, figures);
	return card;
}

/* ------------------------------------------------------------------ *
 *  DOM helpers + toast
 * ------------------------------------------------------------------ */

function el(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

function iconBtn(icon, title, onClick) {
	const b = el("button", "icon-btn material-symbols-outlined", icon);
	b.type = "button";
	b.title = title;
	b.setAttribute("aria-label", title);
	b.addEventListener("click", onClick);
	return b;
}

function textButton(className, icon, text, onClick) {
	const b = el("button", className);
	b.type = "button";
	b.append(el("span", "material-symbols-outlined", icon), document.createTextNode(text));
	b.addEventListener("click", onClick);
	return b;
}

function textInput(placeholder, value = "") {
	const i = el("input", "text-input");
	i.type = "text";
	i.placeholder = placeholder;
	i.value = value;
	i.spellcheck = false;
	return i;
}

function shake(node) {
	node.classList.remove("shake");
	void node.offsetWidth;
	node.classList.add("shake");
	setTimeout(() => node.classList.remove("shake"), 500);
}

let toastTimer = null;

function toast(message, action) {
	let box = document.getElementById("toast");
	if (!box) {
		box = el("div");
		box.id = "toast";
		box.setAttribute("role", "status");
		document.body.appendChild(box);
	}
	const hide = () => box.classList.remove("show");
	box.innerHTML = "";
	box.appendChild(el("span", "", message));
	if (action) {
		const b = el("button", "toast-action", action.label);
		b.type = "button";
		b.addEventListener("click", () => {
			action.run();
			hide();
		});
		box.appendChild(b);
	}
	box.classList.add("show");
	clearTimeout(toastTimer);
	toastTimer = setTimeout(hide, action ? 6000 : 2500);
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
	root.setProperty("--link-scale", settings.linkSize / 100);

	// Positions / visibility via data attributes + classes
	body.dataset.clockPos = settings.clockPosition;
	body.dataset.searchPos = settings.searchPosition;
	body.dataset.widgetPos = settings.widgetPosition;
	body.classList.toggle("focus-mode", settings.focusMode);
	body.classList.toggle("twinkle", settings.twinkle);
	body.classList.toggle("no-link-labels", !settings.showLinkLabels);

	toggleEl("clock", settings.showClock);
	toggleEl("greeting", settings.showGreeting && !settings.focusMode);
	toggleEl("searchBar", settings.showSearch && !settings.focusMode);
	toggleEl("shortcuts", settings.showShortcuts && !settings.focusMode);
	toggleEl("widgets", settings.showWidgets && settings.widgets.length > 0 && !settings.focusMode);
	toggleEl("settingsToggle", settings.showSettingsButton);

	// Background
	if (bgVideo) {
		bgVideo.muted = settings.muteVideo;
		bgVideo.defaultMuted = settings.muteVideo;
		if (settings.pauseVideo) bgVideo.pause();
		else bgVideo.play().catch(() => {});
		if (settings.background !== "shuffle") loadBackgroundVideo();
	}
renderWidgets();
	
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

const COLLAPSED_KEY = "ncCollapsed";

function getCollapsed() {
	try {
		return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY)) || []);
	} catch {
		return new Set();
	}
}

function setCollapsed(title, collapsed) {
	const set = getCollapsed();
	if (collapsed) set.add(title);
	else set.delete(title);
	localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...set]));
}

function buildSettingsPanel() {
	const body = document.getElementById("settingsBody");
	body.innerHTML = "";
	const collapsed = getCollapsed();

	SCHEMA.forEach((section) => {
		const sec = el("section", "settings-section");
		sec.dataset.section = section.title;
		if (collapsed.has(section.title)) sec.classList.add("collapsed");

		const h = document.createElement("h3");
		h.tabIndex = 0;
		h.setAttribute("role", "button");
		h.append(
			el("span", "material-symbols-outlined", section.icon),
			el("span", "section-title", section.title),
			el("span", "material-symbols-outlined chevron", "expand_more"),
		);
		const toggle = () => {
			sec.classList.toggle("collapsed");
			setCollapsed(section.title, sec.classList.contains("collapsed"));
		};
		h.addEventListener("click", toggle);
		h.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				toggle();
			}
		});

		const content = el("div", "section-content");
		section.items.forEach((item) => content.appendChild(renderControl(item)));
		sec.append(h, content);
		body.appendChild(sec);
	});
}

function renderControl(item) {
	if (item.type === "shortcuts") return renderShortcutsEditor();
	if (item.type === "widgets") return renderWidgetsEditor();
	if (item.type === "keys") return renderKeysInfo();

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

let refreshLinkEditor = () => {};
let refreshWidgetEditor = () => {};

function clearDropMarks(root) {
	root.querySelectorAll(".drop-before, .drop-after, .drop-into")
		.forEach((n) => n.classList.remove("drop-before", "drop-after", "drop-into"));
}

function dropRatio(e, node) {
	const r = node.getBoundingClientRect();
	return (e.clientY - r.top) / r.height;
}

function folderSelect(selected) {
	const sel = el("select", "mini-select");
	sel.title = "Folder";
	sel.appendChild(new Option("Top level", ""));
	settings.shortcuts.forEach((s, i) => {
		if (s.items) sel.appendChild(new Option(`Folder: ${s.name}`, String(i)));
	});
	sel.value = selected ? String(settings.shortcuts.indexOf(selected)) : "";
	return sel;
}

function folderArray(value) {
	const f = value === "" ? null : settings.shortcuts[Number(value)];
	return f && f.items ? f.items : settings.shortcuts;
}

function rowIcon(item) {
	if (item.items) return el("span", "material-symbols-outlined row-icon", "folder");
	const img = el("img", "row-favicon");
	img.alt = "";
	img.src = faviconFor(item.url);
	img.addEventListener("error", () => img.replaceWith(el("span", "row-letter", linkLabel(item).charAt(0).toUpperCase())));
	return img;
}

function renderShortcutsEditor() {
	const wrap = el("div", "shortcuts-editor");
	const list = el("div", "shortcut-list");
	let editing = null;
	let dragged = null;

	const commit = () => {
		saveSettings();
		applySettings();
		refreshLinkEditor();
	};

	const startEdit = (item) => {
		editing = item;
		refresh();
	};

	function detachDragged() {
		dragged.arr.splice(dragged.arr.indexOf(dragged.item), 1);
		return dragged.item;
	}

	function dropZone(e, row, target, arr) {
		if (!dragged || dragged.item === target) return null;
		const movingFolder = !!dragged.item.items;
		if (movingFolder && arr !== settings.shortcuts) return null;
		const y = dropRatio(e, row);
		if (target.items && !movingFolder && y > 0.25 && y < 0.75) return "into";
		return y < 0.5 ? "before" : "after";
	}

	function bindDrop(node, getZone, onDrop) {
		node.addEventListener("dragover", (e) => {
			const zone = getZone(e);
			if (!zone) return;
			e.preventDefault();
			clearDropMarks(list);
			node.classList.add("drop-" + zone);
		});
		node.addEventListener("dragleave", () => node.classList.remove("drop-before", "drop-after", "drop-into"));
		node.addEventListener("drop", (e) => {
			const zone = getZone(e);
			clearDropMarks(list);
			if (!zone) return;
			e.preventDefault();
			onDrop(zone);
			commit();
		});
	}

	function itemRow(item, arr) {
		if (item === editing) return editForm(item, arr);

		const row = el("div", "shortcut-edit-row" + (item.items ? " is-folder" : ""));
		row.draggable = true;
		const name = item.items ? item.name : linkLabel(item);
		const label = el("span", "row-label", item.items ? `${item.name} (${item.items.length})` : name);
		label.title = item.items ? "Double-click to rename" : normalizeUrl(item.url);
		label.addEventListener("dblclick", () => startEdit(item));

		const del = iconBtn("delete", "Remove", () => {
			const idx = arr.indexOf(item);
			arr.splice(idx, 1);
			commit();
			toast(`Removed "${name}"`, {
				label: "Undo",
				run: () => {
					arr.splice(idx, 0, item);
					commit();
				},
			});
		});
		del.classList.add("danger");

		row.append(
			el("span", "material-symbols-outlined drag-handle", "drag_indicator"),
			rowIcon(item),
			label,
			iconBtn("edit", "Edit", () => startEdit(item)),
			del,
		);

		row.addEventListener("dragstart", (e) => {
			dragged = { item, arr };
			row.classList.add("dragging");
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", name);
		});
		row.addEventListener("dragend", () => {
			dragged = null;
			row.classList.remove("dragging");
			clearDropMarks(list);
		});
		bindDrop(row, (e) => dropZone(e, row, item, arr), (zone) => {
			const moved = detachDragged();
			if (zone === "into") item.items.push(moved);
			else arr.splice(arr.indexOf(item) + (zone === "after" ? 1 : 0), 0, moved);
		});
		return row;
	}

	function editForm(item, arr) {
		const form = el("div", "shortcut-edit-form");
		const isFolder = !!item.items;
		const nameIn = textInput(isFolder ? "Folder name" : "Name (optional)", item.name);
		form.appendChild(nameIn);

		let urlIn = null;
		let folderSel = null;
		if (!isFolder) {
			urlIn = textInput("example.com", item.url);
			folderSel = folderSelect(settings.shortcuts.find((s) => s.items === arr));
			form.append(urlIn, folderSel);
		}

		const save = () => {
			if (urlIn && !urlIn.value.trim()) {
				shake(urlIn);
				urlIn.focus();
				return;
			}
			item.name = nameIn.value.trim() || (isFolder ? "Folder" : "");
			if (urlIn) {
				item.url = urlIn.value.trim();
				const dest = folderArray(folderSel.value);
				if (dest !== arr) {
					arr.splice(arr.indexOf(item), 1);
					dest.push(item);
				}
			}
			editing = null;
			commit();
		};
		const cancel = () => {
			editing = null;
			refresh();
		};

		const actions = el("div", "form-actions");
		actions.append(textButton("ghost-btn", "check", "Save", save), textButton("ghost-btn", "close", "Cancel", cancel));
		form.appendChild(actions);
		form.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && e.target.tagName === "INPUT") save();
			else if (e.key === "Escape") {
				e.stopPropagation();
				cancel();
			}
		});
		requestAnimationFrame(() => nameIn.focus());
		return form;
	}

	function refresh() {
		list.innerHTML = "";
		if (!settings.shortcuts.length) list.appendChild(el("div", "empty-hint", "No quick links yet. Add one below."));
		settings.shortcuts.forEach((item) => {
			list.appendChild(itemRow(item, settings.shortcuts));
			if (!item.items) return;
			const kids = el("div", "folder-children");
			item.items.forEach((child) => kids.appendChild(itemRow(child, item.items)));
			if (!item.items.length) {
				const hint = el("div", "empty-hint drop-target", "Empty \u2014 drag links here");
				bindDrop(hint, () => (dragged && !dragged.item.items ? "into" : null), () => item.items.push(detachDragged()));
				kids.appendChild(hint);
			}
			list.appendChild(kids);
		});

		const prev = targetSel.value;
		const fresh = folderSelect(null);
		targetSel.replaceWith(fresh);
		targetSel = fresh;
		if ([...fresh.options].some((o) => o.value === prev)) fresh.value = prev;
	}

	const form = el("div", "shortcut-add");
	const nameInput = textInput("Name (optional)");
	const urlInput = textInput("example.com");
	urlInput.dataset.autofocus = "";
	let targetSel = folderSelect(null);

	const addLink = () => {
		const url = urlInput.value.trim();
		if (!url) {
			shake(urlInput);
			urlInput.focus();
			return;
		}
		folderArray(targetSel.value).push({ name: nameInput.value.trim(), url });
		nameInput.value = "";
		urlInput.value = "";
		commit();
		urlInput.focus();
	};
	const addFolder = () => {
		const name = nameInput.value.trim() || "New folder";
		settings.shortcuts.push({ name, items: [] });
		nameInput.value = "";
		commit();
		toast(`Folder "${name}" created. Drag links onto it.`);
	};
	[nameInput, urlInput].forEach((i) => i.addEventListener("keydown", (e) => {
		if (e.key === "Enter") addLink();
	}));

	const actions = el("div", "form-actions");
	actions.append(
		targetSel,
		textButton("ghost-btn", "add_link", "Add link", addLink),
		textButton("ghost-btn", "create_new_folder", "Folder", addFolder),
	);
	form.append(nameInput, urlInput, actions);

	refreshLinkEditor = refresh;
	refresh();
	wrap.append(list, form, el("div", "editor-tip", "Drag to reorder. Drop a link onto a folder to move it inside."));
	return wrap;
}

function renderWidgetsEditor() {
	const wrap = el("div", "widgets-editor");
	const list = el("div", "shortcut-list");
	let dragged = null;

	const commit = () => {
		saveSettings();
		applySettings();
		refreshWidgetEditor();
	};

	const typeSelect = (value) => {
		const sel = el("select", "mini-select");
		Object.entries(WIDGET_TYPES).forEach(([v, l]) => sel.appendChild(new Option(l, v)));
		sel.value = value;
		return sel;
	};

	function refresh() {
		list.innerHTML = "";
		if (!settings.widgets.length) list.appendChild(el("div", "empty-hint", "No widgets yet. Add a city below."));
		settings.widgets.forEach((w) => {
			const row = el("div", "shortcut-edit-row");
			row.draggable = true;

			const label = el("span", "row-label");
			label.append(el("span", "", w.name), el("small", "row-sub", w.sub || w.tz));

			const type = typeSelect(w.type);
			type.addEventListener("change", () => {
				w.type = type.value;
				saveSettings();
				applySettings();
			});

			const del = iconBtn("delete", "Remove", () => {
				const idx = settings.widgets.indexOf(w);
				settings.widgets.splice(idx, 1);
				commit();
				toast(`Removed ${w.name}`, {
					label: "Undo",
					run: () => {
						settings.widgets.splice(idx, 0, w);
						commit();
					},
				});
			});
			del.classList.add("danger");

			row.append(el("span", "material-symbols-outlined drag-handle", "drag_indicator"), label, type, del);

			row.addEventListener("dragstart", (e) => {
				dragged = w;
				row.classList.add("dragging");
				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData("text/plain", w.name);
			});
			row.addEventListener("dragend", () => {
				dragged = null;
				row.classList.remove("dragging");
				clearDropMarks(list);
			});
			row.addEventListener("dragover", (e) => {
				if (!dragged || dragged === w) return;
				e.preventDefault();
				clearDropMarks(list);
				row.classList.add(dropRatio(e, row) < 0.5 ? "drop-before" : "drop-after");
			});
			row.addEventListener("drop", (e) => {
				clearDropMarks(list);
				if (!dragged || dragged === w) return;
				e.preventDefault();
				const after = dropRatio(e, row) >= 0.5;
				settings.widgets.splice(settings.widgets.indexOf(dragged), 1);
				settings.widgets.splice(settings.widgets.indexOf(w) + (after ? 1 : 0), 0, dragged);
				commit();
			});
			list.appendChild(row);
		});
	}

	const form = el("div", "shortcut-add");
	const cityInput = textInput("City, e.g. Tokyo");
	cityInput.dataset.autofocus = "";
	const typeSel = typeSelect("both");
	const suggestions = el("div", "geo-suggestions");

	const addPlace = (r) => {
		settings.widgets.push({
			id: uid(),
			name: r.name,
			sub: placeSub(r),
			lat: r.latitude,
			lon: r.longitude,
			tz: r.timezone && isValidTz(r.timezone) ? r.timezone : "UTC",
			type: typeSel.value,
		});
		cityInput.value = "";
		suggestions.innerHTML = "";
		commit();
		toast(`Added ${r.name}`);
	};

	const search = async () => {
		const q = cityInput.value.trim();
		if (!q) {
			shake(cityInput);
			cityInput.focus();
			return;
		}
		addBtn.disabled = true;
		suggestions.innerHTML = "";
		suggestions.appendChild(el("div", "empty-hint", "Searching\u2026"));
		try {
			const results = await geocode(q);
			suggestions.innerHTML = "";
			if (!results.length) {
				suggestions.appendChild(el("div", "empty-hint", `No places found for "${q}".`));
			} else if (results.length === 1) {
				addPlace(results[0]);
			} else {
				suggestions.appendChild(el("div", "empty-hint", "Pick a match:"));
				results.forEach((r) => {
					const b = el("button", "suggestion");
					b.type = "button";
					b.append(el("span", "", r.name), el("small", "", placeSub(r)));
					b.addEventListener("click", () => addPlace(r));
					suggestions.appendChild(b);
				});
			}
		} catch {
			suggestions.innerHTML = "";
			suggestions.appendChild(el("div", "empty-hint", "Couldn't reach the location service."));
		} finally {
			addBtn.disabled = false;
		}
	};

	const addBtn = textButton("ghost-btn", "add_location_alt", "Add", search);
	cityInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") search();
	});
	form.append(cityInput, typeSel, addBtn);

	refreshWidgetEditor = refresh;
	refresh();
	wrap.append(list, form, suggestions, el("div", "editor-tip", "Weather by Open-Meteo, refreshed every 15 min. Hover a widget for details."));
	return wrap;
}

function renderKeysInfo() {
	const list = el("div", "keys-list");
	[
		["S", "Open settings"],
		["/", "Focus search"],
		["1\u20139", "Open quick link / folder"],
		["F", "Toggle focus mode"],
		["Esc", "Close folder / settings"],
	].forEach(([k, d]) => {
		const row = el("div", "keys-row");
		row.append(el("kbd", "", k), el("span", "", d));
		list.appendChild(row);
	});
	return list;
}

function openSettings(section) {
	closeFolder();
	document.getElementById("settingsPanel").classList.add("open");
	document.getElementById("settingsOverlay").classList.add("open");
	document.getElementById("settingsPanel").setAttribute("aria-hidden", "false");

	if (typeof section !== "string") return;
	const sec = [...document.querySelectorAll(".settings-section")].find((s) => s.dataset.section === section);
	if (!sec) return;
	sec.classList.remove("collapsed");
	setCollapsed(section, false);
	sec.scrollIntoView({ behavior: "smooth", block: "start" });
	const target = sec.querySelector("[data-autofocus]");
	if (target) setTimeout(() => target.focus({ preventScroll: true }), 320);
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
		settings = sanitizeSettings({});
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
		if (e.key === "Escape") {
			if (openFolderRef) closeFolder();
			else closeSettings();
			return;
		}
		const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
		if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
		const settingsOpen = document.getElementById("settingsPanel").classList.contains("open");
		const key = e.key.toLowerCase();

		if (key === "s") {
			e.preventDefault();
			openSettings();
		} else if (key === "/") {
			e.preventDefault();
			const input = document.getElementById("searchInput");
			if (input && !settings.focusMode && settings.showSearch) input.focus();
		} else if (key === "f") {
			setSetting("focusMode", !settings.focusMode);
			buildSettingsPanel();
			toast(settings.focusMode ? "Focus mode on" : "Focus mode off");
		} else if (/^[1-9]$/.test(key) && !settingsOpen && settings.showShortcuts && !settings.focusMode) {
			const n = Number(key) - 1;
			const items = openFolderRef ? openFolderRef.items : settings.shortcuts;
			const target = items[n];
			if (!target) return;
			e.preventDefault();
			if (target.items) toggleFolder(target, document.querySelectorAll("#shortcuts .shortcut")[n]);
			else openLink(target);
		}
	});
}
