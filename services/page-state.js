var _ = require('lodash'),
  edit = require('./edit'),
  db = require('./edit/db'),
  references = require('./references'),
  dom = require('./dom');

/**
 * get canonical url from clay-meta-url component (if it exists)
 * @returns {Promise}
 */
function getCanonicalUrl() {
  var canonical = dom.find('[' + references.referenceAttribute + '*="clay-meta-url"]'),
    ref = canonical && canonical.getAttribute(references.referenceAttribute);

  if (ref) {
    return edit.getDataOnly(ref)
      .then(function (data) {
        if (_.isString(data.url) && data.url.length) {
          return data.url;
        } else {
          return null;
        }
      })
      .catch(function () {
        return null;
      });
  } else {
    return null;
  }
}

/**
 * see if there's a published canonical url with an actual url
 * @returns {Promise}
 */
function hasCanonicalUrl() {
  return getCanonicalUrl().then(function (url) {
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
 * @param {string} ref e.g. domain.com/pages/pageid@scheduled
 * @returns {Promise}
 */
function getScheduled(ref) {
  return edit.getDataOnly(ref).then(function (data) {
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
  var pageRef = document.documentElement.getAttribute(references.referenceAttribute);

  return Promise.all([
    getScheduled(pageRef + '@scheduled'),
    hasCanonicalUrl()
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
  var el = dom.find('.kiln-toolbar-inner .publish');

  if (isScheduled) {
    el.classList.add('scheduled');
  } else {
    el.classList.remove('scheduled');
  }
}

module.exports.get = getPageState;
module.exports.toggleScheduled = toggleScheduled;
