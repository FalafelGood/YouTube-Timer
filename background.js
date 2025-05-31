// A.M.D.G.
let timeRemaining = 10;
let clockInterval = undefined;

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


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("onUpdate triggered")
    if (tab.url && tab.url.includes("youtube.com/watch")) {
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
})


chrome.tabs.onActivated.addListener(({ tabId }) => {
    console.log("onActivated triggered")
    console.log(tabId);
    // Get tab corresponding to tabId
    chrome.tabs.get(tabId, (tab) => {
        if (tab.url && tab.url.includes("youtube.com/watch")) {
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
    })
})