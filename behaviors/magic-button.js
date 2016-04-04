const _ = require('lodash'),
  site = require('../services/site'),
  dom = require('../services/dom'),
  getInput = require('../services/get-input'),
  transformers = {
    // this is an object of available transforms
    // components can specify which transform they want to use in their schemae
    mediaplayUrl: function (data) {
      const path = data.replace(/^.*?imgs\//, ''), // remove domain and everything up to imgs/
        barePath = path.replace(/\.w\d+\.h\d+\.2x/, ''); // remove rendition

      return barePath;
    }
  };

/**
 * get value from field
 * @param {string} field name
 * @returns {string} value
 * @throws Error if field isn't found in the DOM
 */
function getFieldData(field) {
  const fieldEl = document.querySelector(`[rv-field="${field}"]`);

  if (fieldEl) {
    return fieldEl.value;
  } else {
    throw new Error(`Field "${field}" not found!`);
  }
}

/**
 * set value into field
 * @param {string} field name
 * @param {*} data
 * @throws Error if field isn't found in the DOM
 */
function setFieldData(field, data) {
  const fieldEl = document.querySelector(`[rv-field="${field}"]`);

  if (fieldEl && fieldEl.tagName === 'INPUT') {
    fieldEl.value = data;
  } else if (fieldEl && fieldEl.classList.contains('wysiwyg-input')) {
    fieldEl.innerText = data;
  } else {
    throw new Error(`Field "${field}" not found!`);
  }
}

/**
 * get data from an API
 * @param {string} endpoint
 * @returns {Promise}
 */
function getAPI(endpoint) {
  return fetch(endpoint).then(res => res.json());
}

/**
 * get a slice of the data, if the property is set
 * @param {string} property
 * @returns {*}
 */
function getProperty(property) {
  return function (data) {
    if (property && property.length) {
      return _.get(data, property);
    } else {
      return data;
    }
  };
}

/**
 * do magic on click ☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆
 * @param {MouseEvent} e
 * @param {object} bindings
 * @returns {Promise}
 */
function doMagic(e, bindings) {
  const el = e.target.tagName === 'BUTTON' ? e.target : e.target.parentNode,
    currentField = el.getAttribute('data-magic-currentField'),
    field = el.getAttribute('data-magic-field'),
    transform = el.getAttribute('data-magic-transform'),
    url = el.getAttribute('data-magic-url'),
    property = el.getAttribute('data-magic-property');

  let data, transformed;

  // make sure to cancel the actual event
  e.stopPropagation();
  e.preventDefault();

  if (field && field.length) {
    data = getFieldData(field);
  } else {
    data = '';
  }

  if (transform && transform.length) {
    transformed = transformers[transform](data);
  } else {
    // if a transform isn't specified, just use the data from the field directly
    transformed = data;
  }

  return getAPI(url + transformed)
    .then(getProperty(property))
    .then(function (res) {
      _.set(bindings, currentField + '.data.value', res); // set data into rivets
      setFieldData(currentField, res); // set data into field itself
    });
}

/**
 * Create magic button.
 * @param {{name: string, bindings: {}}} result
 * @param {object} args  described in detail below:
 * @param {string} [args.field] grab the value of this field
 * @param {string} [args.transform] key of the transform to apply to the value
 * @param {string} args.url to get data from
 * @param {string} [args.property] to get from the returned data
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    el = result.el,
    input = getInput(el),
    button = dom.create(`<button class="magic-button" rv-on-click="${name}.doMagic" data-magic-currentField="${name}" data-magic-field="${args.field}" data-magic-transform="${args.transform}" data-magic-url="${args.url}" data-magic-property="${args.property}">
      <img src="${site.get('assetPath')}/media/components/clay-kiln/magic-button.svg" alt="Magic Button">
    </button>`);

  // add the button right before the input
  dom.insertBefore(input, button);

  // add the click handler
  result.bindings.doMagic = doMagic;

  return result;
};
