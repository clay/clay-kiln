var _ = require('lodash'),
  edit = require('./edit'),
  references = require('./references'),
  dom = require('./dom');

/**
 * check if an endpoint 404s/errors. doesn't care about the endpoint's actual data
 * @param {string} ref
 * @returns {Promise}
 */
function endpointExists(ref) {
  return edit.getDataOnly(ref)
    .then(function () {
      // endpoint exists!
      return true;
    })
    .catch(function () {
      // endpoint 404s, or has some other error
      return false;
    });
}

/**
 * see if there's a published canonical url with an actual url
 * @returns {Promise}
 */
function hasCanonicalUrl() {
  var canonical = dom.find('[' + references.referenceAttribute + '*="clay-meta-url"]'),
    ref = canonical && canonical.getAttribute(references.referenceAttribute);

  if (ref) {
    return edit.getDataOnly(ref)
      .then(function (data) {
        return _.isString(data.url) && !!data.url.length;
      })
      .catch(function () {
        return false;
      });
  } else {
    return false;
  }
}

/**
 * get scheduled/published state of the page
 * used when toolbar inits and when publish pane is opened
 * @returns {Promise}
 */
function getPageState() {
  var pageRef = document.documentElement.getAttribute(references.referenceAttribute);

  return Promise.all([
    endpointExists(pageRef + '@scheduled'),
    hasCanonicalUrl()
  ]).then(function (promises) {
    return {
      scheduled: promises[0],
      published: promises[1]
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
