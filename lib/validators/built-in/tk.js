import _ from 'lodash';
import striptags from 'striptags';
import { getComponentName, refProp } from '../../utils/references';
import labelComponent from '../../utils/label';
import { getPreviewText } from '../helpers';

export const label = 'TKs',
  description = 'There are TKs in your article. Make sure they\'re intentional',
  type = 'warning';

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    _.forOwn(component, (val, key) => {
      if (key !== refProp && _.isString(val) && _.includes(val.toLowerCase(), 'tk')) {
        const text = striptags(val),
          index = text.toLowerCase().indexOf('tk');

        result.push({
          uri,
          field: key,
          location: labelComponent(getComponentName(uri)),
          preview: getPreviewText(text, index, 2)
        });
      }
    });

    return result;
  }, []);
}
