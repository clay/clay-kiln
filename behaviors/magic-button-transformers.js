import _ from 'lodash';
import speakingurl from 'speakingurl';
import striptags from 'striptags';
import { decode } from 'he';
import { getComponentName, getComponentInstance, getComponentVersion } from '../lib/utils/references';

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

export default {
  // this is an object of available transforms
  // components can specify which transform they want to use in their schemae
  /**
   * transform a full url into a path we can query mediaplay with
   * @param {string} data
   * @returns {string}
   */
  mediaplayUrl(data) {
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
  getComponentInstance(data) {
    const name = getComponentName(data),
      instance = getComponentInstance(data),
      version = getComponentVersion(data);

    let path = '/components/' + name;

    if (instance) {
      // this allows us to get default component data as well as instance data
      path += '/instances/' + instance;
    }

    if (version) {
      path += '@' + version;
    }

    return path;
  },

  /**
   * transform rich text into a hyphen-delineated slug
   * @param {string} data
   * @returns {string}
   */
  toSlug(data) {
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
  formatUrl(data, format) {
    var datafield = toPlainText(data).toLowerCase().replace(/[^\w]/g, '-').replace(/--+/g, '-');

    if (_.isString(format) && !_.isEmpty(format)) {
      return format.replace(/\$DATAFIELD/g, datafield);
    } else {
      return '';
    }
  }
};
