const moment = require('moment'),
  pane = require('../services/pane'),
  edit = require('../services/edit'),
  progress = require('../services/progress'),
  dom = require('@nymag/dom'),
  state = require('../services/page-state'),
  db = require('../services/edit/db'),
  site = require('../services/site'),
  _ = require('lodash'),
  Routable = require('routable');

/**
 * schedule page and layout publishing in parallel
 * @param {number} timestamp
 * @returns {Promise}
 */
function schedulePageAndLayout(timestamp) {
  var pageUri = dom.pageUri();

  return edit.getLayout().then(function (layout) {
    return Promise.all([
      edit.schedulePublish({
        at: timestamp,
        publish: db.uriToUrl(pageUri)
      }),
      edit.schedulePublish({
        at: timestamp,
        publish: db.uriToUrl(layout)
      })
    ]);
  });
}

/**
 * unschedule page and layout publishing in parallel
 * @returns {Promise}
 */
function unschedulePageAndLayout() {
  var pageUri = dom.pageUri();

  return edit.getLayout().then(function (layout) {
    return Promise.all([
      edit.unschedulePublish(pageUri),
      edit.unschedulePublish(layout)
    ]);
  });
}

/**
 * get available routes from the toolbar
 * @returns {array}
 */
function getAvailableRoutes() {
  var toolbar = dom.find('.kiln-toolbar'),
    routes = toolbar && _.isString(toolbar.getAttribute('data-routes')) && toolbar.getAttribute('data-routes').split(',');

  return routes || [];
}

/**
 * test to see if a url is routable on the current site
 * @param {string} val
 * @param {array} routes
 * @returns {boolean}
 */
function isValidUrl(val, routes) {
  return !!_.find(routes, function (route) {
    var r = new Routable(route);

    return r.test(val) || r.test('/' + val); // test with and without the beginning slash
  });
}

module.exports = function () {
  function Constructor(el) {
    this.form = dom.find(el, '.schedule');
    this.customUrlForm = dom.find(el, '.custom-url-form');
    this.routes = getAvailableRoutes();
  }

  Constructor.prototype = {
    events: {
      '.publish-now click': 'onPublishNow',
      '.unpublish click': 'onUnpublish',
      '.schedule-input input': 'onScheduleInput',
      '.flatpickr-input input': 'onScheduleInput', // firefox
      '.schedule submit': 'onSchedule',
      '.unschedule click': 'onUnschedule',
      '.custom-url-input input': 'onCustomUrlInput',
      '.custom-url-form submit': 'onCustomUrl'
    },

    onPublishNow: function () {
      pane.close();
      progress.start('publish');

      return unschedulePageAndLayout().then(function () {
        // publish page and layout immediately
        return Promise.all([edit.publishPage(), edit.publishLayout()])
          .then(function (promises) {
            var url = promises[0];

            progress.done();
            progress.open('publish', `Published! <a href="${url}" target="_blank">View Page</a>`);
            state.toggleButton('scheduled', false);
            state.toggleButton('published', true);
          })
          .catch(function () {
            // note: the Error passed into this doesn't have a message, so we use a custom one
            progress.done('error');
            progress.open('error', 'Server errored when publishing, please try again.', true);
          });
      });
    },

    onUnpublish: function () {
      var pageUri = dom.pageUri();

      pane.close();
      progress.start('publish');

      return unschedulePageAndLayout()
        .then(edit.unpublishPage)
        .then(function () {
          progress.done();
          // per #304, reload the page at the page url, not the published url
          window.location.href = db.uriToUrl(pageUri) + '.html?edit=true';
        })
        .catch(function () {
          // note: the Error passed into this doesn't have a message, so we use a custom one
          progress.done('error');
          progress.open('error', 'Server errored when unpublishing, please try again.', true);
        });
    },

    onScheduleInput: function () {
      var form = this.form,
        date = dom.find(form, 'input[type=date]').value,
        time = dom.find(form, 'input[type=time]').value,
        submit = dom.find(form, '.schedule-publish');

      // only enable the schedule button if both date and time are set
      if (date && time) {
        submit.removeAttribute('disabled');
      } else {
        submit.setAttribute('disabled', true);
      }
    },

    onSchedule: function (e) {
      var form = this.form,
        pageUri = dom.pageUri(),
        date = dom.find(form, 'input[type=date]').value,
        time = dom.find(form, 'input[type=time]').value,
        // firefox uses a nonstandard AM/PM format, rather than the accepted W3C standard that other browsers use
        // therefore, check for AM/PM
        datetime = _.includes(time, 'M') ? moment(date + ' ' + time, 'YYYY-MM-DD h:mm A') : moment(date + ' ' + time, 'YYYY-MM-DD HH:mm'),
        timestamp = datetime.valueOf();

      // close publish pane and start progress bar
      pane.close();
      progress.start('schedule');

      // stop form from submitting normally
      e.preventDefault();

      // only schedule one thing at a time
      return unschedulePageAndLayout().then(function () {
        // schedule layout and page publishing in parallel
        return schedulePageAndLayout(timestamp)
          .then(function () {
            progress.done();
            state.openDynamicSchedule(timestamp, db.uriToUrl(pageUri));
          })
          .catch(function () {
            // note: the Error passed into this doesn't have a message, so we use a custom one
            progress.done('error');
            progress.open('error', 'Server errored when scheduling, please try again.', true);
          });
      });
    },

    onUnschedule: function () {
      pane.close();
      progress.start('schedule');

      return unschedulePageAndLayout()
        .then(function () {
          progress.done();
          progress.open('schedule', 'Unscheduled!', true);
          state.toggleButton('scheduled', false);
        })
        .catch(function () {
          // note: the Error passed into this doesn't have a message, so we use a custom one
          progress.done('error');
          progress.open('error', 'Server errored when unscheduling, please try again.', true);
        });
    },

    onCustomUrlInput: function (e) {
      var input = e.currentTarget,
        val = input.value,
        routes = this.routes;

      // validate that what the user typed in is routable
      // note: if it's empty string, catch it early (removing custom urls is totally valid)
      // note: if it's a full url, assume the user knows what they're doing and say it's valid
      if (val === '' || val.match(/^http/i) || isValidUrl(val, routes)) {
        input.setCustomValidity('');
      } else {
        input.setCustomValidity('Custom URL must match an available route!');
      }
    },

    onCustomUrl: function (e) {
      var val = dom.find(this.customUrlForm, 'input').value,
        url;

      e.preventDefault(); // stop form submit

      // make sure we're not adding the site prefix twice!
      // handle both /paths and http://full-urls
      if (val.match(/^http/i)) {
        // full url
        url = val;
      } else if (val.match(/^\/\S/i)) {
        // already starts with a slash
        url = db.uriToUrl(site.get('prefix') + val);
      } else if (val.match(/^\S/i)) {
        // add the slash ourselves
        url = db.uriToUrl(site.get('prefix') + '/' + val);
      } else if (val === '') {
        // unset custom url
        url === '';
      }

      pane.close();
      progress.start('save');

      return db.get(dom.pageUri())
        .then(function (page) {
          page.customUrl = url;
          return db.save(dom.pageUri(), page);
        })
        .then(function () {
          progress.done();
          if (url) {
            // if we're saving, say that
            progress.open('page', 'Saved custom page url', true);
          } else {
            // if we're explicitly removing a custom url, say that
            progress.open('page', 'Removed custom page url', true);
          }
        })
        .catch(function () {
          progress.done('error');
          progress.open('error', 'Server errored when saving page url, please try again.', true);
        });
    }
  };
  return Constructor;
};
