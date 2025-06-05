// A.M.D.G.
(() => {
    let timeRemaining = undefined;
    // let blockYouTube = false;

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (changes.timeRemaining) {
            timeRemaining = changes.timeRemaining.newValue;
            console.log(timeRemaining);
        }
        // if (timeRemaining <= 0) {
        //     blockYouTube = true;
        // }
    });

    chrome.runtime.onMessage.addListener((message, obj) => {
        console.log("Recieved message from background:");
        console.log(message);
        console.log(obj);
        // if (message.type == "block") {
        //     console.log("blocking page")
        //     blockPage(obj.id);
        // }
        if (message.type == "reload") {
            window.location.replace("http://")
        }
    })

    // function blockPage(tabId) {
    //     // alert("Your YouTube time is up!");
    //     document.body.innerHTML = "<h1>Blocked! Go pray :P</h1>";
    // }

})();