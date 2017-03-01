import _ from 'lodash';
import striptags from 'striptags';
import { getComponentName } from '../../utils/references';
import labelComponent from '../../utils/label';
import { getPreviewText } from './helpers';

export const label = 'Beyoncé',
  description = 'Beyoncé should always be spelled with an accent mark',
  type = 'warning';

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    _.forOwn(component, (val, key) => {
      // note: only check for beyonce in text outside of tags,
      // so things like urls work
      if (_.isString(val) && _.includes(striptags(val).toLowerCase(), 'beyonce')) {
        const text = striptags(val),
          index = text.toLowerCase().indexOf('beyonce');

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
