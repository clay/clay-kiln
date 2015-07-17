module.exports = {
  /**
   *
   * NOTE: copying lodash's standard name for optionally passing in `this` reference
   *
   * @param {Element} el
   * @param {object} events
   * @param {object} controller  `this` reference, aka controller reference
   */
  add: function (el, events, controller) {
    var i, event, eventName, indexOfLastSpace, elList;

    // loop through the defined events
    for (event in events) {
      if (events.hasOwnProperty(event)) {
        indexOfLastSpace = event.lastIndexOf(' ');

        if (indexOfLastSpace === -1) {
          // event is defined on the component el, e.g. 'click'
          el.addEventListener(event, controller[events[event]].bind(controller));
        } else {
          // event is defined on a child el, e.g. 'div a click'
          eventName = event.substring(indexOfLastSpace + 1);
          elList = el.querySelectorAll(event.substring(0, indexOfLastSpace)); // get all child els that match

          // loop through child els (could be just one!) and add event listeners
          for (i = 0; i < elList.length; i++) {
            elList[i].addEventListener(eventName, controller[events[event]].bind(controller));
          }
        }
      }
    }
  },

  /**
   * Dispatch a custom event.
   * @param {Event|string} event
   * @param {Element} [el=document]
   */
  dispatch: function (event, el) {
    event = typeof event === 'string' ? new Event(event) : event;
    el = el || document;
    el.dispatchEvent(event);
  },

  // Shared event names.
  references: {
    editing: 'editing',
    saved: 'saved'
  }
};
