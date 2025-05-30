// A.M.D.G.
const timeEl = document.querySelector(".time");
let time = undefined;

console.log("popup.js is live");
console.log(timeEl);

// Take seconds remaining and format it into hh:mm:ss
function formatTime(secondsRemaining) {
    // Credit: https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
    const date = new Date(null);
    date.setSeconds(secondsRemaining);
    const result = date.toISOString().slice(11,19);
    return result;
}

chrome.storage.sync.get(["timeRemaining"]).then((res) => {
    console.log("Initial time is " + res.timeRemaining);
    time = res.timeRemaining;
    timeEl.innerText = formatTime(time);
})

chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log("change noted in popup.js");
    time = changes.timeRemaining.newValue;
    console.log(time);
    timeEl.innerText = formatTime(time);
});