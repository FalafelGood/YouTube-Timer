// A.M.D.G.
let defaultDailyTime = 60*60 // Default is 3,600 seconds or 1 hour
let dailyTime = undefined;
let timeRemaining = undefined;
let clockInterval = undefined;
let prevTab = undefined;

console.log("Background is live");

// Configure default time on install
chrome.runtime.onInstalled.addListener( async () => {
    console.log("onInstalled(): setting things up");
    chrome.storage.sync.set({"dailyTime": defaultDailyTime, "timeRemaining": defaultDailyTime});
    chrome.tabs.create({
        url: "settings.html"
    })
});


// Get time limits from storage
chrome.storage.sync.get({"dailyTime": dailyTime}).then((obj) => {
    if (Object.keys(obj).length == 0) {
        console.log("dailyTime is undefined! -- Setting it to the default value")
        dailyTime = defaultDailyTime
        timeRemaining = dailyTime;
    } else {
        dailyTime = obj.dailyTime;
        timeRemaining = dailyTime;
    }
});


// Listen for any changes to time limits through settings
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.dailyTime) {
        dailyTime = changes.dailyTime.newValue
        timeRemaining = dailyTime;
    }
});


// Style: use async-await with promises rather than callbacks wherever possible
function getCurrentTab() {
    return new Promise((resolve, reject) => {
        const queryOptions = { active: true, lastFocusedWindow: true };
        chrome.tabs.query(queryOptions, ([tab]) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(tab);
            }
        });
    });
}


function activateClock() {
    console.log("activateClock(): Attempting clock activation")
    if (!clockInterval) {
        clockInterval = setInterval(async () => {
            timeRemaining--;
            await chrome.storage.sync.set({"timeRemaining": timeRemaining});
            if (timeRemaining <= 0) {
                console.log("  activateClock(): timeRemaining <= 0; Blocking current tab")
                clearInterval(clockInterval);
                const tab = await getCurrentTab();
                console.log(tab)
                chrome.tabs.sendMessage(tab.id, {type: "block"});
            };
            console.log(`seconds left: ${timeRemaining}`);
        }, 1000);
    }
}


function stopClock() {
    clearInterval(clockInterval);
    clockInterval = undefined;
}


function isYouTube(tab) {
    if (!tab) return false;
    return (tab.url && tab.url.includes("youtube.com"));
}


async function pauseVideo(tab) {
    // Todo, build YouTube check into pauseVideo
    await chrome.scripting.executeScript({
        target: {"tabId": tab.id},
        func: () => {
            console.log("Inside script!");
            const player = document.querySelector('#movie_player');
            const video = player.querySelector('video');
            console.log(video);
            if (video) {
                video.pause();
            }
        }
    })
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("onUpdated():");
    if (!changeInfo.url) return; // bounce unless the url was changed.
    main(tab);
})


chrome.windows.onFocusChanged.addListener(async () => {
    console.log("onFocusChanged():");
    const tab = await getCurrentTab();
    main(tab);
})


chrome.tabs.onActivated.addListener( async ({ tabId }) => {
    console.log("onActivated():")
    const tab = await chrome.tabs.get(tabId); // Get tab from tabId
    main(tab);
})


function main(tab) {
    // This try block is here because "tab" is not guarenteed to have a url
    try {
        if (prevTab == undefined) {
            prevTab = tab;
        } else if (prevTab.url != tab.url) {
            if (isYouTube(prevTab)) {
                console.log("Pausing previous tab")
                pauseVideo(prevTab);
            }
        }
    } catch (error) {
        console.log("main(): no URL found... Carrying on!")
    }
    if (isYouTube(tab)) {
        if (timeRemaining <= 0) {
            const tabId = tab.id;
            chrome.tabs.sendMessage(tabId, {type: "block"});
            return;
        };
        console.log("  main(): on video page");
        activateClock();
    } else {
        console.log("  main(): not a video page");
        stopClock();
    }
    prevTab = tab;
}


