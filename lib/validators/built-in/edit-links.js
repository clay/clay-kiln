import _ from 'lodash';
import {
  forEachComponent, forEachField, labelComponent, getPlaintextValue, getPreviewText
} from '../helpers';

export const label = 'Edit Mode Links',
  description = 'There are internal links to Clay pages in edit mode',
  type = 'error';

export function validate(state) {
  let errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    const val = field.value;

    if (_.isString(val) && val.match(/href=".*?[\?\&]edit=true"/)) {
      const linkText = val.match(/href=".*?[\?\&]edit=true".*?>(.*?)/)[1],
        text = getPlaintextValue(val),
        index = text.indexOf(linkText);

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
