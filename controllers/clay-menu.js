const openDirectory = require('../services/pane/directory');

module.exports = function () {
  function Constructor() {}

  Constructor.prototype = {
    events: {
      '.directory click': 'onDirectoryClick'
      // todo: add more click handlers when we add more settings buttons
    },

    onDirectoryClick: function () {
      return openDirectory();
    }
  };
  return Constructor;
};
