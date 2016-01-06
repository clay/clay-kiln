var moment = require('moment'),
  pane = require('../services/pane'),
  edit = require('../services/edit'),
  rules = require('../validators'),
  validation = require('../services/publish-validation'),
  progress = require('../services/progress'),
  dom = require('../services/dom'),
  state = require('../services/page-state'),
  db = require('../services/edit/db');

module.exports = function () {
  function constructor(el) {
    this.el = el;
    this.form = dom.find(el, '.schedule');
  }

  constructor.prototype = {
    events: {
      '.publish-now click': 'onPublishNow',
      '.unpublish click': 'onUnpublish',
      '.schedule submit': 'onSchedule',
      '.unschedule click': 'onUnschedule'
    },

    onPublishNow: function () {
      var pageUri = dom.pageUri();

      pane.close();
      progress.start('publish');

      return validation.validate(rules).then(function (errors) {
        if (errors.length) {
          progress.done('error');
          pane.openValidationErrors(errors);
        } else {
          return edit.unschedulePublish(pageUri).then(function () {
            return edit.publishPage()
              .then(function (url) {
                progress.done();
                progress.open('publish', `Published! <a href="${url}" target="_blank">View Page</a>`);
                state.toggleScheduled(false);
              })
              .catch(function () {
                // note: the Error passed into this doesn't have a message, so we use a custom one
                progress.done('error');
                progress.open('error', `Server errored when publishing, please try again.`, true);
              });
          });
        }
      });
    },

    onUnpublish: function () {
      var pageUri = dom.pageUri();

      pane.close();
      progress.start('publish');

      return edit.unschedulePublish(pageUri)
        .then(edit.unpublishPage)
        .then(function () {
          progress.done();
          // per #304, reload the page at the page url, not the published url
          window.location.href = db.uriToUrl(pageUri) + '.html?edit=true';
        })
        .catch(function () {
          // note: the Error passed into this doesn't have a message, so we use a custom one
          progress.done('error');
          progress.open('error', `Server errored when unpublishing, please try again.`, true);
        });
    },

    onSchedule: function (e) {
      var form = this.form,
        pageUri = dom.pageUri(),
        date = dom.find(form, 'input[type=date]').value,
        time = dom.find(form, 'input[type=time]').value,
        datetime = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm'),
        timestamp = datetime.valueOf();

      // close publish pane and start progress bar
      pane.close();
      progress.start('schedule');

      // stop form from submitting normally
      e.preventDefault();

      return validation.validate(rules).then(function (errors) {
        // first, validate the page client-side
        if (errors.length) {
          progress.done('error');
          pane.openValidationErrors(errors);
        } else {
          // only schedule one thing at a time
          return edit.unschedulePublish(pageUri).then(function () {
            return edit.schedulePublish({
              at: timestamp,
              publish: db.uriToUrl(pageUri)
            })
            .then(function () {
              progress.done();
              progress.open('schedule', `Publishing scheduled ` + state.formatTime(timestamp, true));
              state.toggleScheduled(true);
            })
            .catch(function () {
              // note: the Error passed into this doesn't have a message, so we use a custom one
              progress.done('error');
              progress.open('error', `Server errored when scheduling, please try again.`, true);
            });
          });
        }
      });
    },

    onUnschedule: function () {
      var pageUri = dom.pageUri();

      pane.close();
      progress.start('schedule');

      return edit.unschedulePublish(pageUri)
        .then(function () {
          progress.done();
          progress.open('schedule', `Unscheduled!`, true);
          state.toggleScheduled(false);
        })
        .catch(function () {
          // note: the Error passed into this doesn't have a message, so we use a custom one
          progress.done('error');
          progress.open('error', `Server errored when unscheduling, please try again.`, true);
        });
    }
  };
  return constructor;
};
