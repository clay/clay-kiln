var edit = require('../services/edit'),
  dom = require('../services/dom'),
  progress = require('../services/progress');

module.exports = function () {
  function constructor(el) {
    this.el = el;
    this.form = dom.find(el, '.select-page-type');
  }

  constructor.prototype = {
    events: {
      '.create-article-page click': 'onNewArticle'
    },

    onNewArticle: function (e) {
      e.preventDefault();

      return edit.createPage()
        .then(function (url) {
          location.href = url;
        })
        .catch(function () {
          progress.done('error');
          progress.open('error', 'Issue with opening page.', true);
        });
    }
  };
  return constructor;
};
