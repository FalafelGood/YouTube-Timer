// A.M.D.G.
const dailyTimeEl = document.getElementById("daily-time");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const saveBtn = document.getElementById("save");
const parentBtn = document.getElementById("parent-btn")
let currentParentalControls = false;

// Set parental controls if previously set.
chrome.storage.sync.get(["parentalControls"]).then((obj) => {
    if (obj.parentalControls) {
        console.log(obj);
        parentBtn.checked = true
        currentParentalControls = true
    }
})

saveBtn.addEventListener("click", () => {
    if (!currentParentalControls) {
        const hours = hoursEl.value;
        const minutes = minutesEl.value;
        const dailyTime = 60*60*hours + 60*minutes;
        chrome.storage.sync.set({"dailyTime": dailyTime, "timeRemaining": dailyTime});
        dailyTimeEl.innerText = `${hours}h:${minutes}m`
        alert("Settings are updated!");
    } else {
        alert("Parental controls must be disabled")
    }
})


function promptForConfirmation() {

    const confirmEnable = window.confirm(`\n${"-".repeat(30)} WARNING: ${"-".repeat(30)}\n\n Enabling parental controls means you have to enter a password to change your YouTube Timer settings. No password recovery is available at this time! If you forget your password, you will have to reinstall this plugin to make further changes. Would you like to proceed?`);

    return confirmEnable
}


function promptForPassword() {
    const password = window.prompt("Enter a password", "Anything but 1234");
    if (!password) return null;
    const password2 = window.prompt("Verify your password by entering it again", "Seriously, don't use 1234!");
    if (password2 === password) {
        return password;
    } else {
        return null;
    }
}


function setParentalControlsTrue() {
    currentParentalControls = true;
    chrome.storage.sync.set({"parentalControls": true});
    parentBtn.checked = true;
}


function setParentalControlsFalse() {
    currentParentalControls = false;
    chrome.storage.sync.set({"parentalControls": false});
    parentBtn.checked = false;
}


parentBtn.addEventListener("click", async () => {
    console.log("Click!")
    if (!currentParentalControls) {
        const confirmEnable = promptForConfirmation();
        if (confirmEnable) {
            const password = promptForPassword();
            if (password) {
                chrome.storage.sync.set({"password": password});
                alert("Your password has been set!");
                setParentalControlsTrue();
            } else {
                alert("The passwords did not match. Please try again.");
                setParentalControlsFalse();
            }
        } else {
            setParentalControlsFalse();
        }
    } else {
        parentBtn.checked = true;
        if (currentParentalControls) {
            const obj = await chrome.storage.sync.get(["password"])
            const attempt = window.prompt("Enter your password", "password");
            if (attempt == obj.password) {
                setParentalControlsFalse();
            } else {
                alert("The passwords did not match.")
                setParentalControlsTrue();
            }
        }
    }
})

