# TODO items
---

### Features

* Add a failsafe in background.js in case something breaks.
* Warn the user when time is getting low.
* Modify the timer so it only runs when a video is actually being played.
* Add a "failsafe" in background.js that will stop the timer in case the other listeners don't pick up on a tab switch / activation.
* Modify code so time-limit resets when the date tracks over
* Put the timer as an element in the YouTube page

### Bugs
* Check if tabs still exist before trying to access them
* Switching tabs doesn't always stop the timer...
    * Hypothesis: onUpdate doesn't necessarily trigger on the current Tab.
    * we can add an event listener for windows.onFocusChanged! This will allow us to check if we're switching windows, which is a seperate use-case to reloading a tab.

### Code quality

* Add more console.logs to make it easier to diagnose what's going wrong.
* See if I can put the event listener code into a seperate function... Seems like there's considerable overlap

### Cosmetic

* Add a little "light" to the YouTube timer to indicate when it's live

### Misc


# Completed items
---
