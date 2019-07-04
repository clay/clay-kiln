import _ from 'lodash';
import {
  forEachComponent, forEachField, getPlaintextValue, getPreviewText, labelComponent
} from '../helpers';

export const label = 'TKs',
  description = 'There are TKs in your article. Make sure they\'re intentional',
  type = 'warning';

export function validate(state) {
  let errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    // note: only check for tk in text outside of tags,
    // so things like urls work (also only check editable fields, not refs)
    if (field.type === 'editable-field' && _.isString(field.value) && _.includes(getPlaintextValue(field.value).toLowerCase(), 'tk')) {
      const text = getPlaintextValue(field.value),
        index = text.toLowerCase().indexOf('tk');

      errors.push({
        uri,
        field: _.head(field.path.split('.')), // todo: deep complex-list paths in the ui
        location: labelComponent(uri),
        preview: getPreviewText(text, index, 2)
      });
    }
  }));

  return errors;
}
