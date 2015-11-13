const edit = require('../services/edit'),
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
      console.log('publishing')
      return validation.validate(rules).then(function (errors) {
        if (errors.length) {
          alert('there are errors'); // eslint-disable-line
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
