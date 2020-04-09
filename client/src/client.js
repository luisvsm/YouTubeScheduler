var schedule = [];
var scheduleURL = "https://schedule.quarantineshow.com/schedule.json";

var WebsiteLink = document.getElementById("WebsiteLink");
var DonationLink = document.getElementById("DonationLink");
var DonationLinkText = document.getElementById("DonationLinkText");
var WebsiteLinkText = document.getElementById("WebsiteLinkText");
var StreamTitle = document.getElementById("StreamTitle");
var StreamDescription = document.getElementById("StreamDescription");
var UpNextTitle = document.getElementById("UpNextTitle");
var UpNextCountDown = document.getElementById("UpNextCountDown");


// 120 seconds * MS
var RefreshCooldown = 120 * 1000;

var defaultVideo = {
    Note: "",
    VideoID: "2gHKDHmgVlU",
    StreamTitle: "The Quarantine Show",
    StreamDescription: "is currently offline - enjoy some nature live-streams while we schedule our future",
    DonationLink: "",
    WebsiteLink: ""
}

function fetchRemoteSchedule() {
    const request = new Request(scheduleURL, {
        method: 'GET'
    });

    fetch(request).then((response) => {
        return response.json();
    }).then((data) => {
        console.log("Fetched remote data:", data);
        readSchedule(data);
    }).catch((error) => {
        console.log("Error fetching remote schedule: ", error);
    });
}

function readSchedule(newSchedule) {
    schedule = [];

    for (let i = 0; i < newSchedule.length; i++) {
        if (newSchedule[i].EndTime > Date.now()) {
            schedule.push(newSchedule[i])
        }
    }

    schedule.sort(function (a, b) { return a.EndTime - b.EndTime });
    updateNowPlaying(true);
}

function getNowPlaying() {
    for (let i = 0; i < schedule.length; i++) {
        if (schedule[i].EndTime > Date.now()) {
            return schedule[i];
        }
    }

    return defaultVideo;
}

function getNextPlaying() {
    for (let i = 0; i < schedule.length; i++) {
        if (schedule[i].EndTime > Date.now()) {
            if (schedule.length > i + 1) {
                return schedule[i + 1];
            }
            else {
                return defaultVideo;
            }
        }
    }

    return defaultVideo;
}

var lastEndTime;

// Thank you Internet friend for a few minutes saved :)
// https://gist.github.com/vankasteelj/74ab7793133f4b257ea3
var pad = function (num, size) { return ('000' + num).slice(size * -1); };
var time, hours, minutes, seconds, milliseconds;
function sec2time(timeInSeconds) {
    time = parseFloat(timeInSeconds).toFixed(3);
    hours = Math.floor(time / 60 / 60);
    minutes = Math.floor(time / 60) % 60;
    seconds = Math.floor(time - minutes * 60);

    return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2);
}

function updateNowPlaying(forceUpdate = false) {
    var nowPlaying = getNowPlaying();

    UpNextCountDown.innerText = sec2time((nowPlaying.EndTime - (Date.now())) / 1000);

    //We don't need to update anything, just early out.
    if (!forceUpdate && lastEndTime == nowPlaying.EndTime)
        return;

    var nextPlaying = getNextPlaying();

    lastEndTime = nowPlaying.EndTime;
    StreamTitle.innerText = nowPlaying.StreamTitle;
    StreamDescription.innerText = nowPlaying.StreamDescription;

    UpNextTitle.innerText = nextPlaying.StreamTitle

    if (nowPlaying.WebsiteLink == "" || nowPlaying.WebsiteLink == undefined) {
        WebsiteLink.href = "#";

        if (!WebsiteLink.classList.contains('hidden')) {
            WebsiteLink.classList.add('hidden');

            if (WebsiteLinkText != undefined)
                WebsiteLinkText.classList.remove('hidden');
        }
    } else {
        WebsiteLink.href = nowPlaying.WebsiteLink;

        if (WebsiteLink.classList.contains('hidden')) {
            WebsiteLink.classList.remove('hidden');

            if (WebsiteLinkText != undefined)
                WebsiteLinkText.classList.remove('hidden');
        }

    }

    if (nowPlaying.DonationLink == "" || nowPlaying.DonationLink == undefined) {
        DonationLink.href = "#";

        if (!DonationLink.classList.contains('hidden')) {
            DonationLink.classList.add('hidden');

            if (DonationLinkText != undefined)
                DonationLinkText.classList.add('hidden');
        }
    } else {
        DonationLink.href = nowPlaying.DonationLink;

        if (DonationLink.classList.contains('hidden')) {
            DonationLink.classList.remove('hidden');

            if (DonationLinkText != undefined)
                DonationLinkText.classList.remove('hidden');
        }
    }

    playVideo(nowPlaying.VideoID);
}

var prevPlayedVideo;

startEverything();

function getQueryVariable(getVar, url) {
    var questionMarkPos = url.indexOf("?");
    // Clean website out
    if (questionMarkPos >= 0) {
        url = url.substring(questionMarkPos)
    }
    // Check if we need to URL parse
    if (url.includes("=")) {
        var urlParams = new URLSearchParams(url);
        return urlParams.get(getVar);
    } else {
        return url;
    }
}

function playVideo(videoID) {
    if (player == undefined || player.getVideoUrl == undefined || player.loadVideoById == undefined) {
        return;
    }

    playingVideoID = getQueryVariable("v", player.getVideoUrl());
    if (videoID != playingVideoID) {
        player.loadVideoById({
            'videoId': videoID
        });
        player.playVideo();
    }
    prevPlayedVideo = videoID;
}

function startEverything() {
    updateNowPlaying(true);
    fetchRemoteSchedule();
    setInterval(fetchRemoteSchedule, RefreshCooldown);
    setInterval(updateNowPlaying, 1000);
}

// ----------- YouTube Player Code ----------------
var $ = document.querySelector.bind(document);

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
// after the API code downloads.
var player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('YouTubeEmbed', {
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    console.log("onPlayerReady", event);
    updateNowPlaying(true);
}

// 5. The API calls this function when the player's state changes.
// The function indicates that when playing a video (state=1),
// the player should play for six seconds and then stop.

function onPlayerStateChange(event) {
    console.log("onPlayerStateChange", event);
}

function onPlayerError(error) {
    console.log("error", error);
}