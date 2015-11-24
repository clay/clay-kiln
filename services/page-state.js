var edit = require('./edit'),
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
 * get scheduled/published state of the page
 * used when toolbar inits and when publish pane is opened
 * @returns {Promise}
 */
function getPageState() {
  var ref = document.documentElement.getAttribute(references.referenceAttribute);

  return Promise.all([
    endpointExists(ref + '@scheduled'),
    endpointExists(ref + '@published')
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
