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
 * Confirms that a URL loosely matches one of the following formats:
 * - {protocol}://{domain}/*
 * - mailto:{address}
 * - #{anchor}
 * - /{path}
 *
 * Note: We cannot use a try/catch on 'new URL' here because some browsers
 * will automatically encode spaces. Kiln prepends values with "https://" when
 * an explicit protocol is not provided. These two behaviors combined result
 * in almost *any* value getting coerced to something that will pass validation.
 *
 * Same-site links that start with "/" pass validation because they may be the
 * result of an import process or exist historically (even though Kiln does
 * not allow their creation manually).
 *
 * Links relative to the current page (ie. not starting with "/") do not pass.
 *
 * @param {string} url: The href value of a link.
 * @returns {boolean} true if link is valid URL, else false.
 */
const isValid = (url) => (
  (/^\w+:\/\/[^\s/$.?#].[^\s]*$/u).test(url) // {protocol}://{domain}/*
  || (/^mailto:[^\s]+$/u).test(url) // mailto:{address}
  || (/^#[^\s]+$/u).test(url) // #{anchor}
  || (/^\/[^\s]+$/u).test(url) // same-site links (legacy)
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
    if (_.isString(field.value)) {
      const frag = document.createDocumentFragment();

      frag.appendChild(document.createElement('div'));
      frag.firstChild.innerHTML = field.value;
      frag.querySelectorAll('a')
        .forEach((a) => {
          if (!isValid(a.href)) {
            errors.push({
              uri,
              field: _.head(field.path.split('.')),
              location: labelComponent(uri),
              preview: getPreviewText(a.text, 0, 7)
            });
          }
        });
    }
  }), COMPONENTS);

  return errors;
}
