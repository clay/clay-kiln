const _ = require('lodash'),
  site = require('../services/site'),
  dom = require('@nymag/dom'),
  references = require('../services/references'),
  getInput = require('../services/field-helpers').getInput,
  speakingurl = require('speakingurl'),
  he = require('he'),
  striptags = require('striptags'),
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
    component = el.getAttribute('data-magic-component'),
    transform = el.getAttribute('data-magic-transform'),
    property = el.getAttribute('data-magic-property');

  let url = el.getAttribute('data-magic-url'),
    data, transformed;

  // make sure to cancel the actual event
  e.stopPropagation();
  e.preventDefault();

  if (!el.classList.contains('magic-button')) {
    return;
  }

  // if they specify a field to pull data from, get the data
  // if they specify a component to pull data from, find it on the page
  if (!_.isEmpty(field)) {
    data = getFieldData(field);
  } else if (!_.isEmpty(component)) {
    data = findComponent(component);
  } else {
    data = '';
    // note: to keep things sane when using transforms and api calls,
    // we're treating "empty" data as emptystring (no matter what type the data might be)
  }

  if (!_.isEmpty(transform)) {
    transformed = transformers[transform](data);
  } else {
    // if a transform isn't specified, just use the data from the field directly
    transformed = data;
  }

  if (!_.isEmpty(url)) {
    // we allow a single special token in urls, `$SITE_PREFIX`, which tells us
    // to use the prefix of the current site (with proper port and protocol for api calls)
    url = url.replace('$SITE_PREFIX', site.addPort(site.addProtocol(site.get('prefix'))));
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
 *
 * ☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆
 *
 * Magic buttons are extremely powerful, but can be a little confusing to configure.
 * This is what they generally look like:
 *
 * 1. specify a `field` or `component`. The button will grab the value or ref, respectively
 * 2. specify a `transform`. Transforms are useful when doing api calls with that data
 * 3. specify a `url` to do the api call against. It will do a GET request to `url + transformed data`
 * 4. specify a `property` to grab from the result of that api call. You can use _.get() syntax, e.g. `foo.bar[0].baz`
 *
 * All of these arguments are optional!
 *
 * Here are some examples:
 *
 * (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "just grab the primary headline"
 * field: primaryHeadline
 *
 * (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a caption from mediaplay"
 * field: url
 * transform: mediaplayUrl (strips out stuff that ambrose does't want in the api call)
 * url: [ambrose api for images]
 * property: metadata.credit
 *
 * (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the url of the first mediaplay-image on this page"
 * component: mediaplay-image
 * transform: getComponentInstance (this transforms the full component uri into a ref we can pop onto the end of our site prefix)
 * url: $SITE_PREFIX (this is a ~ special token ~ that evaluates to the prefix of current site, so you can do api calls against your own clay instance)
 * property: url
 *
 * ☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆
 *
 * @param {{name: string, bindings: {}}} result
 * @param {object} args  described in detail below:
 * @param {string} [args.field] grab the value of this field
 * @param {string} [args.component] find the first component on the page that matches this name
 * @param {string} [args.transform] key of the transform to apply to the value
 * @param {string} [args.url] to get data from
 * @param {string} [args.property] to get from the returned data
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    el = result.el,
    field = args.field || '',
    component = args.component || '',
    transform = args.transform || '',
    url = args.url || '',
    property = args.property || '',
    input = getInput(el),
    button = dom.create(`<a class="magic-button" rv-on-click="${name}.doMagic" data-magic-currentField="${name}" data-magic-field="${field}" data-magic-component="${component}" data-magic-transform="${transform}" data-magic-url="${url}" data-magic-property="${property}">
      <img class="magic-button-inner" src="${site.get('assetPath')}/media/components/clay-kiln/magic-button.svg" alt="Magic Button">
    </a>`);

  // add the button right before the input
  dom.insertBefore(input, button);

  // add the click handler
  result.bindings.doMagic = doMagic;

  return result;
};
