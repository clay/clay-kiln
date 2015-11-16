const pane = require('../services/pane'),
  edit = require('../services/edit'),
  rules = require('../validators'),
  validation = require('../services/publish-validation');

module.exports = function () {
  function constructor(el) {
    this.el = el;
  }

  constructor.prototype = {
    events: {
      '.publish-now click': 'onPublishNow'
    },

    onPublishNow: function () {
      return validation.validate(rules).then(function (errors) {
        if (errors.length) {
          pane.close();
          pane.openValidationErrors(errors);
        } else {
          return edit.publishPage().then(function () {
            alert('published!'); // eslint-disable-line
          });
        }
      });
    }
  };
  return constructor;
};
