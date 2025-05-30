// A.M.D.G.
let timeRemaining = 1*30*60;
let clockInterval = undefined;

console.log("Background is live");

chrome.storage.sync.set({"timeRemaining": timeRemaining}).then(() => {
    console.log(`YouTube time is set for ${timeRemaining}s.`);
});

// Copied from developer.chrome.com/docs/extensions/reference/api/tabs
function getCurrentTab(callback) {
    let queryOptions = { active: true, lastFocusedWindow: true };
    chrome.tabs.query(queryOptions, ([tab]) => {
      if (chrome.runtime.lastError)
      console.error(chrome.runtime.lastError);
      // `tab` will either be a `tabs.Tab` instance or `undefined`.
      callback(tab);
    });
  }


function activateClock() {
    if (!clockInterval) {
        clockInterval = setInterval(() => {
            timeRemaining--;
            chrome.storage.sync.set({"timeRemaining": timeRemaining}).then(() => {
                /* Do nothing */
            });
            if (timeRemaining == 0) {
                clearInterval(clockInterval);
                // Send a message to block current tab
                getCurrentTab((tab) => {
                    console.log("Getting current tab within activateClock")
                    console.log(tab)
                    chrome.tabs.sendMessage(tab.id, {type: "block"});
                })
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
            // TODO
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
    chrome.tabs.get(tabId, (tab) => {
        if (tab.url && tab.url.includes("youtube.com/watch")) {
            if (timeRemaining <= 0) {
                // TODO
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