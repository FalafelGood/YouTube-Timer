// A.M.D.G.

let defaultDailyTime = 60*60 // Default is 3,600 seconds or 1 hour
let dailyTime = undefined;
let timeRemaining = undefined;
let clockInterval = undefined;
let prevTab = undefined; // The previously selected tab -- used to pause YT if the user switches tabs

const redirectRule = {
    id: 1,
    priority: 1,
    action: {
        type: "redirect",
        redirect: { extensionPath: '/pages/blocked.html'}
    },
    condition: {
        urlFilter: 'youtube.com',
        resourceTypes: ['main_frame'] // Specifies what types of network requests the rule should apply to. In this case we're asking this rule to apply to the primary HTML document.
    }
}

console.log("Background is live");

/* ------------ THINGS THAT RUN ON START-UP ------------- */

// Clear existing rules for the redirect:
// chrome.declarativeNetRequest.updateSessionRules({
//     "addRules": [],
//     "removeRuleIds": [1]
// });


// Configure default settings on install
chrome.runtime.onInstalled.addListener( async () => {
    console.log("onInstalled(): setting things up");
    chrome.storage.sync.set({
        "dailyTime": defaultDailyTime, 
        "timeRemaining": defaultDailyTime, 
        "parentalControls": false, 
        "password": undefined
    });
    chrome.tabs.create({
        url: "pages/settings.html"
    })

    // Set the login date:
    const now = new Date();
    const loginDate = now.toDateString();
    console.log(`onInstalled(): loginDate = ${loginDate}`)
    chrome.storage.sync.set({"loginDate": loginDate});

    // Probably not necessary, but good hygine just in case.
    clearRedirectRules();
});


// Get user's dailyTime setting from storage
console.log("Getting dailyTime and timeRemaining from storage")
chrome.storage.sync.get(["dailyTime", "timeRemaining"]).then((obj) => {
    if (obj.dailyTime == undefined) {
        console.log("dailyTime is undefined! -- Setting it to the default value")
        dailyTime = defaultDailyTime
        timeRemaining = dailyTime;
    } else {
        dailyTime = obj.dailyTime;
        timeRemaining = obj.timeRemaining;
        console.log(`debug: timeRemaining = ${timeRemaining}`)
        // timeRemaining = dailyTime; // TODO -- Redundent?
    }
});


// Reset timeRemaining if current date is different from login date:
chrome.storage.sync.get(["loginDate"]).then((obj) => {
    if (obj.loginDate) {
        const now = new Date();
        const currentDate = now.toDateString();
        console.log(`background.js: currentDate = ${currentDate}`)
        if (currentDate != obj.currentDate) {
            console.log(`Dates are not the same! Resetting timeRemaining to ${timeRemaining}`);
            chrome.storage.sync.set({"timeRemaining": timeRemaining});
            clearRedirectRules();
        }
    }
})

/* ------------ FUNCTIONS AND LISTENERS ------------- */

// Listen for any changes made to the daily time limit
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.dailyTime) {
        dailyTime = changes.dailyTime.newValue
        timeRemaining = dailyTime;
    }
});


function clearRedirectRules() {
    chrome.declarativeNetRequest.updateSessionRules({
    "addRules": [],
    "removeRuleIds": [1]
    });
}


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
            if (timeRemaining > 0) timeRemaining--;
            await chrome.storage.sync.set({"timeRemaining": timeRemaining});
            if (timeRemaining <= 0) {
                timeRemaining = 0;
                console.log("  activateClock(): timeRemaining <= 0; Blocking current tab")
                // Update session rules
                chrome.declarativeNetRequest.updateSessionRules({
                    "addRules": [redirectRule],
                    "removeRuleIds": [1]
                })
                clearInterval(clockInterval);
                const tab = await getCurrentTab();
                console.log(tab)
                chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("pages/blocked.html") })
                // redirect tab to /pages/blocked.html
                // chrome.tabs.sendMessage(tab.id, {type: "reload"});
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


// Injects and runs a script that pauses the YT video (if any) on the previous tab.
async function pauseVideo(tab) {
    try{
        await chrome.scripting.executeScript({
            target: {"tabId": tab.id},
            func: () => {
                console.log("pauseVideo()");
                const player = document.querySelector('#movie_player');
                const video = player.querySelector('video');
                console.log(video);
                if (video) {
                    video.pause();
                }
            }
        })
    } catch (error) {
        // Do nothing -- Previous tab no longer exists
    }
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("onUpdated():");
    // Most tab updates are unimportant. Our only concern is if the URL changes
    if (!changeInfo.url) return;
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
        if (timeRemaining >= 0) {
            console.log("  main(): on video page with time remaining -- calling clock");
            activateClock();
        }
    } else {
        console.log("  main(): not a video page");
        stopClock();
    }
    prevTab = tab;
}


