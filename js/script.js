let shortcut_data = [];
let create_shortcut;
const videoUrl = "img/bg.mp4";

$(document).ready(function () {
	const sw = screen.width;
	const scale = sw / 2560;
	$("body").css("--scale", scale);

	if ($("#bgVdo").length === 0) {
		const videoElement = $('<video id="bgVdo" autoplay muted loop playsinline></video>');
		videoElement.attr("src", videoUrl);
		$("body").prepend(videoElement);
	}

	activateClock();
	handleSearch();
	handleCustomBackground();
});

function activateClock() {
	const time_element = $("#time");
	const today_element = $("#today");

	function updateClock() {
		let date = new Date();
		let hh = date.getHours();
		let mm = date.getMinutes();
		let ss = date.getSeconds();
		let session = "AM";

		if (hh >= 12) session = "PM";
		if (hh == 0) hh = 12;
		if (hh > 12) hh -= 12;

		hh = hh < 10 ? "0" + hh : hh;
		mm = mm < 10 ? "0" + mm : mm;
		ss = ss < 10 ? "0" + ss : ss;

		time_element.text(`${hh}:${mm}:${ss} ${session}`);

		const dayArray = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		const monthArray = ["January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"];
		const todayStr = `${dayArray[date.getDay()]}, ${monthArray[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

		if (today_element.text() !== todayStr) {
			today_element.text(todayStr);
		}

		setTimeout(updateClock, 1000);
	}

	updateClock();
}

function handleSearch() {
	const search_trigger = $("#searchTrigger");
	const search_input = $("#searchInput");

	search_input.keyup((e) => {
		if (e.keyCode === 13) {
			search_trigger.click();
		}
	});

	search_trigger.click(() => {
		const query = search_input.val();
		if (query) {
			chrome.search.query({ text: query }, function (results) {
				if (results && results.length > 0) {
					window.location.href = results[0].url;
				}
			});
		} else {
			search_input.attr("placeholder", "Search...");
			setTimeout(() => search_input.attr("placeholder", "Search"), 2000);
		}
	});
}
