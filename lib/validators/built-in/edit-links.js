import _ from 'lodash';
import striptags from 'striptags';
import { getComponentName } from '../../utils/references';
import labelComponent from '../../utils/label';
import { getPreviewText } from '../helpers';

export const label = 'Edit Mode Links',
  description = 'There are internal links to Clay pages in edit mode',
  type = 'error';

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    _.forOwn(component, (val, key) => {
      if (_.isString(val) && val.match(/href=".*?[\?\&]edit=true"/)) {
        const linkText = val.match(/href=".*?[\?\&]edit=true".*?>(.*?)/)[1],
          text = striptags(val),
          index = text.indexOf(linkText);

        result.push({
          uri,
          field: key,
          location: labelComponent(getComponentName(uri)),
          preview: getPreviewText(text, index, 7)
        });
      }
    });

    return result;
  }, []);
}
