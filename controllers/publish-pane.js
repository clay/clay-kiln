var pane = require('../services/pane'),
  edit = require('../services/edit'),
  rules = require('../validators'),
  validation = require('../services/publish-validation'),
  progress = require('../services/progress'),
  toolbar = require('./kiln-toolbar');

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
              toolbar.updatePublishButton({ published: true });
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
