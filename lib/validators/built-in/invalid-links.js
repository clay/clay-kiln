import _ from 'lodash';
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
 * Confirms that a URL loosely matches one of the following formats:
 * - {protocol}://{domain}/*
 * - mailto:{address}
 * - #{anchor}
 *
 * Note: We cannot use a try/catch on 'new URL' here because some browsers
 * will automatically encode spaces. Kiln prepends values with "https://" when
 * an explicit protocol is not provided. These two behaviors combined result
 * in almost *any* value getting coerced to something that will pass validation.
 *
 * @param {string} url: The href value of a link.
 * @returns {boolean} true if link is valid URL, else false.
 */
const isValid = (url) => (
  (/^\w+:\/\/[^\s/$.?#].[^\s]*$/u).test(url) // {protocol}://{domain}/*
  || (/^mailto:[^\s]+$/u).test(url) // mailto:{address}
  || (/^#[^\s+]/u).test(url) // #{anchor}
);

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
  }), COMPONENTS);

  return errors;
}
