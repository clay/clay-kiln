import _ from 'lodash';
import striptags from 'striptags';
import { getComponentName } from '../../utils/references';
import labelComponent from '../../utils/label';

export const label = 'Beyoncé',
  description = 'Beyoncé should always be spelled with an accent mark',
  type = 'warning';

/**
 * get the text to preview
 * @param  {string} text  without htmltags
 * @param  {number} index of the TK
 * @return {string}
 */
function getPreviewText(text, index) {
  const cutStart = 20,
    cutEnd = 20; // don't add ellipses if we're this close to the start or end

  let previewText = text,
    endIndex = index;

  if (index > cutStart) {
    previewText = `…${text.substr(index - cutStart)}`;
    endIndex = index - (index - cutStart) + 1;
  }

  if (previewText.length > endIndex + cutEnd) {
    previewText = `${previewText.substr(0, endIndex + cutEnd + 7)}…`;
  }

  return previewText;
}

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
          preview: getPreviewText(text, index)
        });
      }
    });

    return result;
  }, []);
}
