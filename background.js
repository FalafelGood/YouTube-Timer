// A.M.D.G.
let timeRemaining = 10*60;
let clockInterval = undefined;
let prevTab = undefined;

console.log("Background is live");

chrome.storage.sync.set({"timeRemaining": timeRemaining}).then(() => {
    console.log(`YouTube time is set for ${timeRemaining}s.`);
});


// Copied from developer.chrome.com/docs/extensions/reference/api/tabs
// function getCurrentTab(callback) {
//     let queryOptions = { active: true, lastFocusedWindow: true };
//     chrome.tabs.query(queryOptions, ([tab]) => {
//       if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
//       // `tab` will either be a `tabs.Tab` instance or `undefined`.
//       callback(tab);
//     });
// }

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
    if (!clockInterval) {
        clockInterval = setInterval(async () => {
            timeRemaining--;
            // Old way... Probably not good style
            // chrome.storage.sync.set({"timeRemaining": timeRemaining}).then(() => {
            //     /* Do nothing */
            // });
            await chrome.storage.sync.set({"timeRemaining": timeRemaining});
            if (timeRemaining == 0) {
                clearInterval(clockInterval);
                // Send a message to block current tab
                // getCurrentTab((tab) => {
                //     console.log("Getting current tab within activateClock")
                //     console.log(tab)
                //     chrome.tabs.sendMessage(tab.id, {type: "block"});
                // })
                const tab = await getCurrentTab();
                console.log("Got tab within activateClock")
                console.log(tab)
                chrome.tabs.sendMessage(tab.id, {type: "block"});
            };
            console.log(timeRemaining); // debug
        }, 1000);
    }
}


function stopClock() {
    clearInterval(clockInterval);
    clockInterval = undefined;
}

function isYouTube(tab) {
    return (tab.url && tab.url.includes("youtube.com"));
}

// Check and see if the video on a YouTube element is already playing.
// function isVideoPlaying(tab) {

// }


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
    console.log("onUpdate triggered");
    // Set prevTab if it hasn't been defined, else pause video on previous tab.
    if (prevTab == undefined) {
        prevTab = tab;
    } else if (prevTab.url != tab.url) {
        if (isYouTube(prevTab)) {
            console.log("Pausing previous tab")
            pauseVideo(prevTab);
        }
    }
    if (isYouTube(tab)) {
        if (timeRemaining <= 0) {
            chrome.tabs.sendMessage(tabId, {type: "block"});
            return;
        };
        console.log("We're on a video page!");
        activateClock();
    } else {
        console.log("We're not on a video page");
        stopClock();
    }
    prevTab = tab;
})


chrome.tabs.onActivated.addListener( async ({ tabId }) => {
    console.log("onActivated triggered")
    const tab = await chrome.tabs.get(tabId); // Get tab from tabId
    if (prevTab == undefined) {
        prevTab = tab;
    } else if (prevTab.url != tab.url) {
        if (isYouTube(prevTab)) {
            console.log("Pausing previous tab")
            pauseVideo(prevTab);
        }
    }
    if (isYouTube(tab)) {
        if (timeRemaining <= 0) {
            chrome.tabs.sendMessage(tabId, {type: "block"});
            return;
        };
        console.log("We're on a video page!");
        activateClock();
    } else {
        console.log("We're not on a video page")
        stopClock();
    }
    prevTab = tab;
})