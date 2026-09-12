const videoUrls = ["img/bg.mp4", "img/bg_2.mp4"];

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const monthNames = ["January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"];

const pad = (n) => (n < 10 ? "0" + n : "" + n);

document.addEventListener("DOMContentLoaded", () => {
	document.body.style.setProperty("--scale", screen.width / 2560);
	initBackground();
	initClock();
	initSearch();
});

function initBackground() {
	if (document.getElementById("bgVdo")) return;

	const index = ((parseInt(localStorage.getItem("videoIndex")) || 0) + 1) % videoUrls.length;
	localStorage.setItem("videoIndex", index);

	const video = document.createElement("video");
	video.id = "bgVdo";
	video.autoplay = true;
	video.loop = true;
	video.playsInline = true;
	video.muted = true;
	video.defaultMuted = true; // reflects the `muted` attribute so autoplay policy allows playback
	video.setAttribute("muted", "");
	video.src = videoUrls[index];
	document.body.prepend(video);
	video.play().catch(() => {});
}

function initClock() {
	const timeEl = document.getElementById("time");
	const todayEl = document.getElementById("today");
	let lastDate = "";

	function tick() {
		const now = new Date();
		let h = now.getHours();
		const session = h >= 12 ? "PM" : "AM";
		h = h % 12 || 12;

		timeEl.textContent = `${pad(h)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${session}`;

		const dateStr = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
		if (dateStr !== lastDate) {
			todayEl.textContent = dateStr;
			lastDate = dateStr;
		}
	}

	tick();
	setInterval(tick, 1000);
}

function initSearch() {
	const trigger = document.getElementById("searchTrigger");
	const input = document.getElementById("searchInput");

	const runSearch = () => {
		const query = input.value.trim();
		if (query) {
			chrome.search.query({ text: query });
		} else {
			input.placeholder = "Search...";
			setTimeout(() => (input.placeholder = "Search"), 2000);
		}
	};

	trigger.addEventListener("click", runSearch);
	input.addEventListener("keyup", (e) => {
		if (e.key === "Enter") runSearch();
	});
}
