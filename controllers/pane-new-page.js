const edit = require('../services/edit'),
  dom = require('@nymag/dom'),
  progress = require('../services/progress');

module.exports = function () {
  function constructor(el) {
    this.el = el;
    this.form = dom.find(el, '.select-page-type');
  }

  function createPageByType(pageType) {
    return edit.createPage(pageType)
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
      '.create-article-page click': 'onNewArticle',
      '.create-sponsored-post click': 'onNewSponsoredPost'
    },

    onNewArticle: function (e) {
      e.preventDefault();
      createPageByType('new');
    },

    onNewSponsoredPost: function (e) {
      e.preventDefault();
      createPageByType('new-sponsored');
    }
  };
  return constructor;
};
