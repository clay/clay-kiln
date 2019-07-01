import _ from 'lodash';
import {
  forEachComponent, forEachField, getPlaintextValue, getPreviewText, labelComponent
} from '../helpers';

export const label = 'Beyoncé',
  description = 'Beyoncé should always be spelled with an accent mark',
  type = 'warning';

export function validate(state) {
  let errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    // note: only check for beyonce in text outside of tags,
    // so things like urls work
    if (field.type === 'editable-field' && _.isString(field.value) && _.get(field, 'schema._has.type') !== 'url' && _.includes(getPlaintextValue(field.value).toLowerCase(), 'beyonce')) {
      const text = getPlaintextValue(field.value),
        index = text.toLowerCase().indexOf('beyonce');

      errors.push({
        uri,
        field: _.head(field.path.split('.')), // todo: deep complex-list paths in the ui
        location: labelComponent(uri),
        preview: getPreviewText(text, index, 7)
      });
    }
  }));

  return errors;
}
