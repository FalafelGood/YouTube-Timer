// A.M.D.G.
const dailyTimeEl = document.getElementById("daily-time");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const saveBtn = document.getElementById("save");

saveBtn.addEventListener("click", () => {
    const hours = hoursEl.value;
    const minutes = minutesEl.value;
    const dailyTime = 60*60*hours + 60*minutes;
    chrome.storage.sync.set({"dailyTime": dailyTime, "timeRemaining": dailyTime});
    dailyTimeEl.innerText = `${hours}h:${minutes}m`
    alert("Settings are updated!");
})