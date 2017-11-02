import _ from 'lodash';
import striptags from 'striptags';
import { getComponentName, refProp } from '../../utils/references';
import labelComponent from '../../utils/label';
import { getPreviewText } from '../helpers';

export const label = 'TKs',
  description = 'There are TKs in your article. Make sure they\'re intentional',
  type = 'warning';

function isUri(str) {
  return !!/^[^\s]+[\/.][^\s]+$/.exec(str);
}

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    _.forOwn(component, (val, key) => {
      const text = _.isString(val) && !isUri(val) && striptags(val);

      if (key !== refProp && text && _.includes(text.toLowerCase(), 'tk')) {
        const index = text.toLowerCase().indexOf('tk');

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
