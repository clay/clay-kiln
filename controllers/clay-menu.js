const openPeoplePane = require('../services/pane/people');

module.exports = function () {
  function Constructor() {}

  Constructor.prototype = {
    events: {
      '.people click': 'onPeopleClick'
      // todo: add more click handlers when we add more settings buttons
    },

    onPeopleClick: function () {
      return openPeoplePane();
    }
  };
  return Constructor;
};
