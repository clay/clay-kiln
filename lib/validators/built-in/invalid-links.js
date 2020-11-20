import _ from 'lodash';
import {
  forEachComponent, forEachField, labelComponent, getPreviewText
} from '../helpers';

export const label = 'Invalid Links',
  description = 'There are invalid links on the page',
  type = 'error';


/**
 * @param {string} url: The href value of a link.
 * @returns {boolean} true if link is hash (same-page) link, else false.
 */
const isHash = (url) => (/^#/u).test(url);

/**
 * @param {string} url: The href value of a link.
 * @returns {boolean} true if link is valid URL, else false.
 */
const isValid = (url) => {
  try {
    new URL(url);
  } catch (err) {
    return false;
  }

  return true;
};

/**
 * Collects all invalid links from the page state and returns
 * an array of validation errors.
 *
 * @param {Object} state
 * @returns {Object[]} An array of validation errors.
 */
export function validate(state) {
  const errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    const val = field.value;

    if (_.isString(val)) {
      [...val.matchAll(/href="([^"]+)"[^>]*>([^<]*)/gu)]
        .map(match => [match[1], match[2]])
        .filter(([linkUrl]) => !isHash(linkUrl))
        .filter(([linkUrl]) => !isValid(linkUrl))
        .map(([, linkText]) => ({
          uri,
          field: _.head(field.path.split('.')),
          location: labelComponent(uri),
          preview: getPreviewText(linkText, 0, 7)
        }))
        .forEach(err => errors.push(err));
    }
  }));

  return errors;
}
