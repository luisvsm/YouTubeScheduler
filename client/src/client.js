var schedule = [];
var scheduleURL = "https://schedule.quarantineshow.com/schedule.json";

var WebsiteLink = document.getElementById("WebsiteLink");
var DonationLink = document.getElementById("DonationLink");
var StreamTitle = document.getElementById("StreamTitle");
var StreamDescription = document.getElementById("StreamDescription");
var UpNextTitle = document.getElementById("UpNextTitle");
var UpNextCountDown = document.getElementById("UpNextCountDown");

// 120 seconds * MS
var RefreshCooldown = 120 * 1000;

var defaultVideo = {
    Note: "",
    VideoID: "2gHKDHmgVlU",
    StreamTitle: "Default Title",
    StreamDescription: "This is the default Video, give luis some copy to put in here :)",
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
    lastEndTime = undefined;
    updateNowPlaying();
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
function updateNowPlaying() {
    var nowPlaying = getNowPlaying();

    //We don't need to update anything, just early out.
    if (lastEndTime == nowPlaying.EndTime)
        return;

    var nextPlaying = getNextPlaying();

    lastEndTime = nowPlaying.EndTime;
    StreamTitle.innerText = nowPlaying.StreamTitle;
    StreamDescription.innerText = nowPlaying.StreamDescription;

    UpNextTitle.innerText = nextPlaying.StreamTitle
    UpNextCountDown.innerText = "Not working yet :)"

    if (nowPlaying.WebsiteLink == "" || nowPlaying.WebsiteLink == undefined) {
        WebsiteLink.href = "#";

        if (!WebsiteLink.classList.contains('hidden'))
            WebsiteLink.classList.add('hidden');
    } else {
        WebsiteLink.href = nowPlaying.WebsiteLink;

        if (WebsiteLink.classList.contains('hidden'))
            WebsiteLink.classList.remove('hidden');
    }


    if (nowPlaying.DonationLink == "" || nowPlaying.DonationLink == undefined) {
        DonationLink.href = "#";

        if (!DonationLink.classList.contains('hidden'))
            DonationLink.classList.add('hidden');
    } else {
        DonationLink.href = nowPlaying.DonationLink;

        if (DonationLink.classList.contains('hidden'))
            DonationLink.classList.remove('hidden');
    }

    playVideo(nowPlaying.VideoID);
}

var prevPlayedVideo;
function playVideo(videoID) {
    if (videoID != prevPlayedVideo) {
        player.loadVideoById({
            'videoId': videoID
        });
    }
    player.playVideo();
    prevPlayedVideo = videoID;
}

function startEverything() {
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
    startEverything();
};

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    console.log("onPlayerReady", event);
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