import _ from 'lodash';
import * as validUrl from 'valid-url';
import {
  forEachComponent, forEachField, labelComponent, getPreviewText
} from '../helpers';

export const label = 'Invalid Links',
  description = 'There are invalid links on the page',
  type = 'error';

// This is the list of components that will run through this validator.
const COMPONENTS = [
  'clay-paragraph',
  'clay-subheader'
];

/**
 * @param {string} url: The href value of a link.
 * @returns {boolean} true if link is hash (same-page) link, else false.
 */
const isHash = (url) => (/^#/u).test(url);

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
        .filter(([linkUrl]) => !validUrl.isUri(linkUrl))
        .map(([, linkText]) => ({
          uri,
          field: _.head(field.path.split('.')),
          location: labelComponent(uri),
          preview: getPreviewText(linkText, 0, 7)
        }))
        .forEach(err => errors.push(err));
    }
  }), COMPONENTS);

  return errors;
}
