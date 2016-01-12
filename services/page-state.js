var _ = require('lodash'),
  moment = require('moment'),
  edit = require('./edit'),
  db = require('./edit/db'),
  dom = require('./dom');

/**
 * get canonical url from clay-meta-url component (if it exists)
 * @param {string} pageUri
 * @returns {Promise}
 */
function getCanonicalUrl(pageUri) {
  return edit.getDataOnly(pageUri).then(function (data) {
    if (_.isString(data.url) && data.url.length) {
      return data.url;
    } else {
      return null;
    }
  }).catch(function () {
    return null;
  });
}

/**
 * see if there's a published canonical url with an actual url
 * @param {string} pageUri
 * @returns {Promise}
 */
function hasCanonicalUrl(pageUri) {
  return getCanonicalUrl(pageUri).then(function (url) {
    if (url) {
      return db.getHead(db.urlToUri(url)).then(function (res) {
        if (res) {
          return {
            published: res,
            publishedUrl: url
          };
        } else {
          return {
            published: false,
            publishedUrl: null
          };
        }
      });
    } else {
      return {
        published: false,
        publishedUrl: null
      };
    }
  });
}

/**
 * see if a page is scheduled to publish
 * @param {string} scheduledUri e.g. domain.com/pages/pageid@scheduled
 * @returns {Promise}
 */
function getScheduled(scheduledUri) {
  // note: no caching here
  return db.get(scheduledUri).then(function (data) {
    return {
      scheduled: true,
      scheduledAt: data.at
    };
  }).catch(function () {
    return {
      scheduled: false,
      scheduledAt: null
    };
  });
}

/**
 * get scheduled/published state of the page
 * used when toolbar inits and when publish pane is opened
 * @returns {Promise}
 */
function getPageState() {
  var pageUri = dom.pageUri();

  return Promise.all([
    getScheduled(pageUri + '@scheduled'),
    hasCanonicalUrl(pageUri + '@published')
  ]).then(function (promises) {
    return {
      scheduled: promises[0].scheduled,
      scheduledAt: promises[0].scheduledAt,
      published: promises[1].published,
      publishedUrl: promises[1].publishedUrl
    };
  });
}

/**
 * update publish button when scheduled
 * @param {boolean} isScheduled
 */
function toggleScheduled(isScheduled) {
  var el = document.querySelector('.kiln-toolbar-inner .publish'),
    scheduledClass = 'scheduled';

  if (isScheduled) {
    el.classList.add(scheduledClass);
  } else {
    el.classList.remove(scheduledClass);
  }
}

/**
 * format timestamps in the past and future
 * @param {number} timestamp (unix timestamp)
 * @returns {string}
 */
function formatTime(timestamp) {
  var datetime = moment(timestamp);

  return datetime.calendar();
}

module.exports.get = getPageState;
module.exports.toggleScheduled = toggleScheduled;
module.exports.formatTime = formatTime;
