var pane = require('../services/pane'),
  edit = require('../services/edit'),
  rules = require('../validators'),
  validation = require('../services/publish-validation'),
  progress = require('../services/progress');

module.exports = function () {
  function constructor(el) {
    this.el = el;
  }

  constructor.prototype = {
    events: {
      '.publish-now click': 'onPublishNow'
    },

    onPublishNow: function () {
      pane.close();
      progress.start('publish');

      return validation.validate(rules).then(function (errors) {
        if (errors.length) {
          progress.done('error');
          pane.openValidationErrors(errors);
        } else {
          return edit.publishPage()
            .then(function (url) {
              progress.done();
              progress.open('publish', `Published! <a href="${url}" target="_blank">View Article</a>`);
            })
            .catch(function () {
              // note: the Error passed into this doesn't have a message, so we use a custom one
              progress.done('error');
              progress.open('error', `A server error occured. Please try again.`, true);
            });
        }
      });
    }
  };
  return constructor;
};
