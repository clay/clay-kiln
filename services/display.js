'use strict';
var _ = require('lodash'),
  references = require('./references');

/**
 * determines if a field (or group of fields) should display
 * note: if this returns false, createField() won't traverse the schema past this point
 * @param  {string} [display]
 * @param  {{}} [schema]
 * @return {bool}
 */
function shouldDisplay(display, schema) {
  if (_.isObject(display)) {
    schema = display;
    display = 'modal';
  } else {
    schema = schema || {};
    display = display || 'modal';
  }

  var displayVal = schema[references.displayProperty];

  if (display === 'meta' && displayVal === 'meta') {
    // meta will display if it's meta
    return true;
  } else if (display === 'inline' && displayVal === 'inline') {
    // inline will display if it's inline
    return true;
  } else if (display === 'modal' && displayVal !== 'inline' && displayVal !== 'meta') {
    // modal will display by default if it's not inline or meta
    return true;
  } else {
    // don't display if it doesn't match any of the above
    return false;
  }
}

module.exports = shouldDisplay;