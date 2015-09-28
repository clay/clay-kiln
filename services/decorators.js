var _ = require('lodash'),
  edit = require('./edit'),
  groups = require('./groups');

// array of all decorators, added to global
window.kiln = window.kiln || {}; // create global kiln if it doesn't exist
window.kiln.decorators = [];

/**
 * get the schema, then run through the decorators
 * @param {Element} el
 * @param {string} ref
 * @param {string} path
 * @returns {Promise}
 */
function decorate(el, ref, path) {
  var options = {
    ref: ref,
    path: path
  };

  if (!el || !ref || !path) {
    throw new Error('el, ref, and path are required to decorate elements!');
  }

  return edit.getData(ref).then(function (data) {

    // add the data for this specific field or group
    options.data = groups.get(ref, data, path);
    // iterate through all the decorators, calling the ones that need to run
    return _.map(window.kiln.decorators, function (decorator) {
      if (decorator.when(el, options)) {
        return decorator.handler(el, options);
      }
    });
  });
}

/**
 * add a new decorator
 * @param {{ when: function, handler: function }} newDecorator
 */
function addDecorator(newDecorator) {
  if (!newDecorator || !_.isFunction(newDecorator.when) || !_.isFunction(newDecorator.handler)) {
    throw new Error('New decorator must have .when and .handler methods!');
  } else {
    window.kiln.decorators.push(newDecorator);
  }
}

module.exports = decorate;
module.exports.add = addDecorator;

// testing
module.exports.set = function (value) {
  window.kiln.decorators = value;
};
