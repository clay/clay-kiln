import _ from 'lodash';
import speakingurl from 'speakingurl';
import striptags from 'striptags';
import { decode } from 'he';
import { getComponentInstance as getInstance, getComponentVersion } from 'clayutils';
import { componentRoute, getComponentName } from '../lib/utils/references';

let builtInTransformers = {};

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

  return decode(striptags(str.replace('&nbsp;', ' ')));
}

/**
 * transform a full url into a path we can query mediaplay with
 * @param {string} data
 * @returns {string}
 */
export function mediaplayUrl(data) {
  const path = data.replace(/^.*?imgs\//, ''); // remove domain and everything up to imgs/

  // remove rendition stuff
  let barePath = path.replace(/\.w\d+/, ''); // remove width

  barePath = barePath.replace(/\.nocrop/, ''); // remove nocrop
  barePath = barePath.replace(/\.h\d+/, ''); // remove height
  barePath = barePath.replace('.2x', ''); // remove resolution

  return barePath;
}

/**
 * transform a component uri into a path we can query amphora with (to get the component data)
 * @param {string} data
 * @returns {string}
 */
export function getComponentInstance(data) {
  const name = getComponentName(data),
    instance = getInstance(data),
    version = getComponentVersion(data);

  let path = componentRoute + name;

  if (instance) {
    // this allows us to get default component data as well as instance data
    path += '/instances/' + instance;
  }

  if (version) {
    path += '@' + version;
  }

  return path;
}

/**
 * transform rich text into a hyphen-delineated slug
 * @param {string} data
 * @returns {string}
 */
export function toSlug(data) {
  // remove EVERYTHING from the slug, then run it through speakingurl
  return speakingurl(toPlainText(stripUnicode(data)), {
    custom: {
      _: '-' // convert underscores to hyphens
    }
  });
}

/**
 * Use the provided format with the data field to create a url. Converts data
 * to lower case, hyphen-delineated text.
 * @param {string} data
 * @param {string} format the format to use, with a placeholder of '$DATAFIELD'
 * @returns {string}
 */
export function formatUrl(data, format) {
  var datafield = toPlainText(data).trim().toLowerCase().replace(/[^\w]/g, '-')
    .replace(/--+/g, '-');

  if (_.isString(format) && !_.isEmpty(format)) {
    return format.replace(/\$DATAFIELD/g, datafield);
  } else {
    return '';
  }
}

export function init() {
  // set up transformers
  window.kiln = window.kiln || {};
  window.kiln.transformers = window.kiln.transformers || {};
  // note: all transformers should be references from window.kiln.transformers,
  // they are exported only for testing
  builtInTransformers.mediaplayUrl = mediaplayUrl;
  builtInTransformers.getComponentInstance = getComponentInstance;
  builtInTransformers.toSlug = toSlug;
  builtInTransformers.formatUrl = formatUrl;

  // attach to global, unless they're already defined by custom transformers
  _.defaults(window.kiln.transformers, builtInTransformers);
}
