const _ = require('lodash'),
  site = require('../services/site'),
  dom = require('@nymag/dom'),
  getInput = require('../services/field-helpers').getInput,
  transformers = {
    // this is an object of available transforms
    // components can specify which transform they want to use in their schemae
    mediaplayUrl: function (data) {
      const path = data.replace(/^.*?imgs\//, ''); // remove domain and everything up to imgs/

      // remove rendition stuff
      let barePath = path.replace(/\.w\d+/, ''); // remove width

      barePath = barePath.replace(/\.h\d+/, ''); // remove height
      barePath = barePath.replace('.2x', ''); // remove resolution

      return barePath;
    },
    articleUrl: (function () {
      const articleSelector = '[data-uri*="/article/instances/"]',
        getCanoncialUrlQuery = '?publishable=canonicalUrl';

      /**
       * @returns {string}
       */
      function getArticleUri() {
        return _.get(document.querySelector(articleSelector), 'dataset.uri');
      }

      /**
       * takes uri and adds the current page's port
       * @param {string} uri
       * @returns {string}
       */
      function addPagePort(uri) {
        const firstSlash = uri.indexOf('/'),
          pagePort = window.location.port;

        return uri.substr(0, firstSlash) + (pagePort ? ':' + pagePort : '') + uri.substr(firstSlash);
      }

      /**
       * @param {string} str
       * @returns {string}
       */
      function appendQuery(str) {
        return str + getCanoncialUrlQuery;
      }

      return () => appendQuery(addPagePort(getArticleUri()));
    }())
  };

/**
 * get value from field
 * @param {string} field name
 * @returns {string} value
 * @throws Error if field isn't found in the DOM
 */
function getFieldData(field) {
  const fieldEl = document.querySelector(`[rv-field="${field}"]`);

  if (fieldEl && fieldEl.tagName === 'INPUT') {
    return fieldEl.value;
  } else if (fieldEl && fieldEl.classList.contains('wysiwyg-input')) {
    return fieldEl.textContent; // note: magic button won't preserve rich text styling when grabbing the data
  } else {
    throw new Error(`Field "${field}" not found!`);
  }
}

/**
 * set value into field
 * @param {object} bindings
 * @param {string} field name
 * @param {*} data
 * @throws Error if field isn't found in the DOM
 */
function setFieldData(bindings, field, data) {
  const fieldEl = document.querySelector(`[rv-field="${field}"]`);

  if (!data || !data.length) {
    return; // don't set anything
  }

  // set the data into rivets, so it saves
  _.set(bindings, field + '.data.value', data);

  // also set the data into the actual field DOM,
  // so it appears to the user
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
 * @returns {Promise|undefined}
 */
function doMagic(e, bindings) {
  const el = e.currentTarget,
    currentField = el.getAttribute('data-magic-currentField'),
    field = el.getAttribute('data-magic-field'),
    transform = el.getAttribute('data-magic-transform'),
    url = el.getAttribute('data-magic-url'),
    property = el.getAttribute('data-magic-property');

  let data, transformed;

  // make sure to cancel the actual event
  e.stopPropagation();
  e.preventDefault();

  if (!el.classList.contains('magic-button')) {
    return;
  }

  if (!_.isEmpty(field)) {
    data = getFieldData(field);
  } else {
    data = '';
  }

  if (!_.isEmpty(transform)) {
    transformed = transformers[transform](data);
  } else {
    // if a transform isn't specified, just use the data from the field directly
    transformed = data;
  }

  if (!_.isEmpty(url)) {
    // do an api call!
    return getAPI(url + transformed)
      .then(getProperty(property))
      .then(res => setFieldData(bindings, currentField, res));
  } else {
    // just set the data
    return setFieldData(bindings, currentField, transformed);
  }
}

/**
 * Create magic button.
 * @param {{name: string, bindings: {}}} result
 * @param {object} args  described in detail below:
 * @param {string} [args.field] grab the value of this field
 * @param {string} [args.transform] key of the transform to apply to the value
 * @param {string} [args.url] to get data from
 * @param {string} [args.property] to get from the returned data
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    el = result.el,
    field = args.field || '',
    transform = args.transform || '',
    url = args.url || '',
    property = args.property || '',
    input = getInput(el),
    button = dom.create(`<a class="magic-button" rv-on-click="${name}.doMagic" data-magic-currentField="${name}" data-magic-field="${field}" data-magic-transform="${transform}" data-magic-url="${url}" data-magic-property="${property}">
      <img class="magic-button-inner" src="${site.get('assetPath')}/media/components/clay-kiln/magic-button.svg" alt="Magic Button">
    </a>`);

  // add the button right before the input
  dom.insertBefore(input, button);

  // add the click handler
  result.bindings.doMagic = doMagic;

  return result;
};
