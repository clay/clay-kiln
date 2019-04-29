---
id: snackbar
title: Snackbar
sidebar_label: Snackbar
---

The Snackbar is a UI element that alerts the user when they have completed a task, such as publishing or unpublishing a page, adding a user, etc. It appears in the bottom left corner of the screen for a few seconds before disappearing.  The contents, and a few other properties can be set when they are created.
![snackbar](/clay-kiln/img/snackbar.png)

When showing the snackbar the following properties can be set:
* ***action*** - the string that will appear as the "action" message, defaults to blank string
* ***duration*** - time in milliseconds the snackbar is shown in this container. Defaults to 5000
* ***message*** - the string that will appear in the snackbar
* ***onActionClick*** - function that will be called when the action string is clicked, defaults to a non-function, i.e. nothing will be called
* ***position*** - The position of snackbars relative to the container. One of 'left', 'center' or 'right'.  Defaults to 'left'
* ***queueSnackbars*** - Whether or not snackbars should be queued and shown one after the other. False by default, creating a new snackbar while one is visible will cause the visible one to immediately transition out for the new one. Set to true to ensure that each snackbar is shown for its complete duration.
* ***transition*** - The show/hide transition of snackbars in the container. One of 'slide' or 'fade'. Defaults to 'slide'

The contents and properties of the snackbar are set in the Vuex Store and are changed by dispatching an action to the $store like so. Any property not included will be set to its default value.
```
this.$store.dispatch('showSnackbar', {
  message: 'Error publishing layout',
  action: 'Retry',
  onActionClick: () => this.publishLayout(),
  duration: 3000,
  position: 'right',
  queueSnackbars: true,
  transition: 'fade'
});
```
