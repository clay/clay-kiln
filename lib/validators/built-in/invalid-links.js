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
          if (a.className === 'kiln-link-invalid') {
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
