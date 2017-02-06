import _ from 'lodash';

const site = require('../services/site'),
  dom = require('@nymag/dom'),
  references = require('../services/references'),
  getInput = require('../services/field-helpers').getInput,
  speakingurl = require('speakingurl'),
  he = require('he'),
  striptags = require('striptags'),
  promises = require('../services/promises'),
  transformers = {
    // this is an object of available transforms
    // components can specify which transform they want to use in their schemae
    /**
     * transform a full url into a path we can query mediaplay with
     * @param {string} data
     * @returns {string}
     */
    mediaplayUrl: function (data) {
      const path = data.replace(/^.*?imgs\//, ''); // remove domain and everything up to imgs/

      // remove rendition stuff
      let barePath = path.replace(/\.w\d+/, ''); // remove width

      barePath = barePath.replace(/\.nocrop/, ''); // remove nocrop
      barePath = barePath.replace(/\.h\d+/, ''); // remove height
      barePath = barePath.replace('.2x', ''); // remove resolution

      return barePath;
    },

    /**
     * transform a component uri into a path we can query amphora with (to get the component data)
     * @param {string} data
     * @returns {string}
     */
    getComponentInstance: function (data) {
      const name = references.getComponentNameFromReference(data),
        instance = references.getInstanceIdFromReference(data);

      let path = '/components/' + name;

      if (instance) {
        // this allows us to get default component data as well as instance data
        path += '/instances/' + instance;
      }

      return path;
    },

    /**
     * transform rich text into a hyphen-delineated slug
     * @param {string} data
     * @returns {string}
     */
    toSlug: function (data) {
      // remove EVERYTHING from the slug, then run it through speakingurl
      return speakingurl(toPlainText(stripUnicode(data)), {
        custom: {
          _: '-' // convert underscores to hyphens
        }
      });
    },

    /**
     * Use the provided format with the data field to create a url. Converts data
     * to lower case, hyphen-delineated text.
     * @param {string} data
     * @param {string} format the format to use, with a placeholder of '$DATAFIELD'
     * @returns {string}
     */
    formatUrl: function (data, format) {
      var datafield = toPlainText(data).toLowerCase().replace(/[^\w]/g, '-').replace(/--+/g, '-');

      if (_.isString(format) && !_.isEmpty(format)) {
        return format.replace(/\$DATAFIELD/g, datafield);
      } else {
        return '';
      }
    }
  };

/**
 * Removes all unicode from string
 * @param {string} str
 * @returns {string}
 */
function stripUnicode(str) {
  return str.replace(/[^A-Za-z 0-9\.,\?!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]~]*/g, '');
}

/**
 * remove all html stuff from a string
 * @param {string} str
 * @returns {string}
 */
function toPlainText(str) {
  // coerce all text into a string. Undefined stuff is just an empty string
  if (!_.isString(str)) {
    return '';
  }
  return he.decode(striptags(str.replace('&nbsp;', ' ')));
}

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
 * get a component ref from the page, if it exists
 * @param {string} name
 * @returns {string}
 */
function findComponent(name) {
  const firstComponent = dom.find('[data-uri*="/components/' + name + '/"]');

  if (firstComponent) {
    return firstComponent.getAttribute(references.referenceAttribute);;
  } else {
    return '';
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
 * note: we export this and then use the exported method, so we can stub it in our tests
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
 * get the initial data from a field or component
 * @param {string} field
 * @param {string} component
 * @returns {string}
 */
function getData(field, component) {
  // if they specify a field to pull data from, get the data
  // if they specify a component to pull data from, find it on the page
  if (!_.isEmpty(field)) {
    return getFieldData(field);
  } else if (!_.isEmpty(component)) {
    return findComponent(component);
  } else {
    return '';
    // note: to keep things sane when using transforms and api calls,
    // we're treating "empty" data as emptystring (no matter what type the data might be)
  }
}

/**
 * apply transforms, call urls, and grab properties
 * @param {string} data
 * @param {object} options
 * @returns {Promise}
 */
function doMoreMagic(data, options) {
  var transform = options.transform,
    url = options.url,
    property = options.property,
    transformed, promise;

  if (!_.isEmpty(transform)) {
    transformed = transformers[transform](data, options.transformArg);
  } else {
    // if a transform isn't specified, just use the data from the field directly
    transformed = data;
  }

  if (!_.isEmpty(url)) {
    // we allow a single special token in urls, `$SITE_PREFIX`, which tells us
    // to use the prefix of the current site (with proper port and protocol for api calls)
    url = url.replace('$SITE_PREFIX', site.addPort(site.addProtocol(site.get('prefix'))));
    // do an api call!
    promise = module.exports.getAPI(url + transformed)
      .then(getProperty(property));
  } else {
    // just set the data
    promise = Promise.resolve(transformed);
  }

  return promise;
}

/**
 * do magic on click ☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆
 * @param {MouseEvent} e
 * @param {object} bindings
 * @param {Element} [testEl] for testing, we pass a stubbed element in rather than the event
 * note: when this function is called from the binding, testEl is undefined
 * @returns {Promise|undefined}
 */
function doMagic(e, bindings, testEl) {
  const el = testEl || e.currentTarget,
    currentField = el.getAttribute('data-magic-currentField'),
    field = el.getAttribute('data-magic-field'),
    component = el.getAttribute('data-magic-component'),
    transform = el.getAttribute('data-magic-transform'),
    transformArg = el.getAttribute('data-magic-transformArg'),
    property = el.getAttribute('data-magic-property'),
    moreMagicString = el.getAttribute('data-magic-moremagic') || '',
    // object-based element attribute values require escaping double quotes
    moreMagic = moreMagicString.length ? JSON.parse(moreMagicString.replace(/\"/g,'"')) : [];

  let url = el.getAttribute('data-magic-url'),
    data, promise;

  // make sure to cancel the actual event
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  if (!el.classList.contains('magic-button')) {
    return;
  }

  // get the initial data
  data = getData(field, component);

  // apply an optional transform, call an optional url
  promise = doMoreMagic(data, {
    transform: transform,
    transformArg: transformArg,
    url: url,
    property: property
  });

  // if there's more magic, iterate through each item transforming the returned value
  // note: each item in moreMagic is only allowed to have transform, url, and property
  // (not field, component, or moreMagic)
  if (moreMagic.length) {
    return promise.then(function (res) {
      return promises.reduce(moreMagic, doMoreMagic, res);
    }).then(finalRes => setFieldData(bindings, currentField, finalRes));
  } else {
    return promise.then(finalRes => setFieldData(bindings, currentField, finalRes));
  }
}

/**
 * Extract properties from the supplied args with appropriate defaults where necessary.
 *
 * @param {string} name
 * @param {object} args
 * @returns {object}
 */
function getMagicProperties(name, args) {
  var magicProps = {};

  magicProps.name = name;
  magicProps.field = args.field || '';
  magicProps.component = args.component || '';
  magicProps.transform = args.transform || '';
  magicProps.transformArg = args.transformArg || '';
  magicProps.url = args.url || '';
  magicProps.property = args.property || '';
  // object-based element attribute values require escaping double quotes
  magicProps.moreMagic = args.moreMagic ? JSON.stringify(args.moreMagic).replace(/"/g,'\"') : '';

  return magicProps;
}

/**
 * Create magic button.
 *
 * @param {{name: string, bindings: {}}} result
 * @param {object} args  described in detail below:
 * @param {string} [args.field] grab the value of this field
 * @param {string} [args.component] find the first component on the page that matches this name
 * @param {string} [args.transform] key of the transform to apply to the value
 * @param {string} [args.transformArg] optional argument to be passed to the transform
 * @param {string} [args.url] to get data from
 * @param {string} [args.property] to get from the returned data
 * @param {array} [args.moreMagic] an array of objects with optional transforms, urls, and properties
 * @returns {{}}
 */
module.exports = function (result, args) {
  var magicProps = getMagicProperties(result.name, args),
    el = result.el,
    input = getInput(el),
    button = dom.create(`<a class="magic-button" rv-on-click="${magicProps.name}.doMagic" data-magic-currentField="${magicProps.name}" data-magic-field="${magicProps.field}" data-magic-component="${magicProps.component}" data-magic-transform="${magicProps.transform}" data-magic-transformArg="${magicProps.transformArg}" data-magic-url="${magicProps.url}" data-magic-property="${magicProps.property}">
    <img class="magic-button-inner" src="${site.get('assetPath')}/media/components/clay-kiln/magic-button.svg" alt="Magic Button">
  </a>`);

  // magic that lives in an object isn't treated kindly by template strings with dom.create()
  // instead, add object-based magic once the dom element has been created
  if (magicProps.moreMagic) {
    button.setAttribute('data-magic-moremagic', magicProps.moreMagic);
  }

  // add the button right before the input
  dom.insertBefore(input, button);

  // add the click handler
  result.bindings.doMagic = doMagic;

  return result;
};

// for testing
module.exports.transformers = transformers;
module.exports.getAPI = getAPI;
module.exports.doMagic = doMagic;
