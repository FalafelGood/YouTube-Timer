# TODO items
---

### Features

* Warn the user when time is getting low.
* Modify the timer so it only runs when a video is actually being played.
* Modify code so time-limit resets when the date tracks over
* Put the timer as an element in the YouTube page

### Bugs

* Quitting chrome and opening it again resets the time limit. This is because background.js reruns.
* (Bug) Check if tabs still exist before trying to access them

### Code quality

### Cosmetic

* Add a little "light" to the YouTube timer to indicate when it's live

### Misc


# Completed items
---

* (Bug) Switching tabs doesn't always stop the timer...
    * Hypothesis: onUpdate doesn't necessarily trigger on the current Tab.
    * we can add an event listener for windows.onFocusChanged! This will allow us to check if we're switching windows, which is a seperate use-case to reloading a tab.

* (Code quality) Add more console.logs to make it easier to diagnose what's going wrong.
* (Code quality) see if I can put the event listener code into a seperate function... Seems like there's considerable overlap