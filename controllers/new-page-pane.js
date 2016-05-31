const edit = require('../services/edit'),
  progress = require('../services/progress');

module.exports = function () {
  function constructor() {
  }

  function createPageByType(id) {
    return edit.createPage(id)
      .then(function (url) {
        location.href = url;
      })
      .catch(function () {
        progress.done('error');
        progress.open('error', 'Issue with opening page.', true);
      });
  }

  constructor.prototype = {
    events: {
      '.primary-action click': 'onNewPageClick'
    },

    onNewPageClick: function (e) {
      var id = e.target.getAttribute('data-page-id');

      e.preventDefault();
      createPageByType(id);
    }
  };
  return constructor;
};
