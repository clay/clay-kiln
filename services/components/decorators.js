var _ = require('lodash'),
  edit = require('../edit'),
  groups = require('./groups'),
  dom = require('@nymag/dom'),
  promises = require('../promises');

// array of all decorators, added to global
window.kiln = window.kiln || {}; // create global kiln if it doesn't exist
window.kiln.decorators = window.kiln.decorators || [];

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

  return promises.props({
    componentData: edit.getData(ref),
    pageData: edit.getDataOnly(dom.pageUri())
  }).then(function (resolved) {
    // add the data for this specific field or group
    options.data = groups.get(ref, resolved.componentData, path);
    // add full component data, just in case decorators need to reference other fields
    options.componentData = resolved.componentData;
    // add page data, just in case decorators need to reference the page (e.g. for decorators running against the layout)
    options.pageData = resolved.pageData;
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
