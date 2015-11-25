var moment = require('moment'),
  references = require('../services/references'),
  pane = require('../services/pane'),
  edit = require('../services/edit'),
  rules = require('../validators'),
  validation = require('../services/publish-validation'),
  progress = require('../services/progress'),
  dom = require('../services/dom'),
  state = require('../services/page-state');

module.exports = function () {
  function constructor(el) {
    this.el = el;
    this.form = dom.find(el, '.schedule');
    this.pageUri = document.documentElement.getAttribute(references.referenceAttribute);
  }

  constructor.prototype = {
    events: {
      '.publish-now click': 'onPublishNow',
      '.unpublish click': 'onUnpublish',
      '.schedule submit': 'onSchedule'
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
    },

    onUnpublish: function () {
      pane.close();
      progress.start('publish');

      return edit.unpublishPage()
      .then(function () {
        progress.done();
        progress.open('publish', `Unpublished!`, true);
      })
      .catch(function () {
        // note: the Error passed into this doesn't have a message, so we use a custom one
        progress.done('error');
        progress.open('error', `A server error occured. Please try again.`, true);
      });
    },

    onSchedule: function (e) {
      var form = this.form,
        pageUri = this.pageUri,
        date = dom.find(form, 'input[type=date]').value,
        time = dom.find(form, 'input[type=time]').value,
        datetime = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm'),
        timestamp = datetime.valueOf(), // todo: switch this to .unix() e.g. seconds when amphora changes
        relative = datetime.fromNow();

      // close publish pane and start progress bar
      pane.close();
      progress.start('schedule');

      // stop form from submitting normally
      e.preventDefault();

      return edit.schedulePublish({
        at: timestamp,
        publish: pageUri
      })
      .then(function () {
        progress.done();
        progress.open('schedule', `Publishing scheduled ` + relative, true);
        state.toggleScheduled(true);
      })
      .catch(function () {
        // note: the Error passed into this doesn't have a message, so we use a custom one
        progress.done('error');
        progress.open('error', `A server error occured. Please try again.`, true);
      });
    }
  };
  return constructor;
};
