// some little helpers to make writing validators easier.
// these are exported through the api for use in custom validators
import _ from 'lodash';
import { rawExpand } from '../forms/behaviors';
import { fieldProp, behaviorKey } from '../utils/references';

/**
 * get the text to preview
 * @param  {string} text  without htmltags
 * @param  {number} index of the matched string
 * @param {number} length of the matched string
 * @return {string}
 */
export function getPreviewText(text, index, length) {
  const cutStart = 20,
    cutEnd = 20; // don't add ellipses if we're this close to the start or end

  let previewText = text,
    endIndex = index;

  if (index > cutStart) {
    previewText = `…${text.substr(index - cutStart)}`;
    endIndex = index - (index - cutStart) + 1;
  }

  if (previewText.length > endIndex + cutEnd) {
    previewText = `${previewText.substr(0, endIndex + cutEnd + length)}…`;
  }

  return previewText;
}

/**
 * get a behavior config from a field's schema, if it contains that specific behavior
 * note: if a complex-list item contains a behavior, the returned config will contain a `_path` property
 * note: in complex-lists, this will return the _first_ instance of the behavior
 * @param  {string}  behavior
 * @param  {object}  fieldSchema
 * @param {string} [path] if recursing through complex-lists
 * @return {object|null}
 */
export function getBehavior(behavior, fieldSchema, path) { // eslint-disable-line
  if (_.isObject(fieldSchema) && _.has(fieldSchema, fieldProp)) {
    const expanded = rawExpand(fieldSchema[fieldProp]);

    let listBehavior,
      rootBehavior = _.find(expanded, (behaviorConfig) => {
        if (behaviorConfig[behaviorKey] === behavior) {
          return true;
        } else if (behaviorConfig[behaviorKey] === 'complex-list') {
          // recurse, in case there are nested lists
          return !!_.find(_.get(behaviorConfig, 'args.props'), (prop) => {
            const foundChild = getBehavior(behavior, prop, prop.prop);

            if (foundChild) {
              foundChild._path = foundChild._path ? `${prop.prop}.${foundChild._path}` : prop.prop;
              listBehavior = foundChild;
              return true;
            } else {
              return false;
            }
          });
        } else {
          return false;
        }
      });

    return listBehavior || rootBehavior || null;
  } else {
    return null; // _version, _description, _component, _componentList, etc
  }
}

/**
 * determine if a field's schema contains a specific behavior
 * note: this will return true if the field contains n-number of complex-lists
 * whose fields contain the behavior
 * @param  {string}  behavior
 * @param  {object}  fieldSchema
 * @return {Boolean}
 */
export function hasBehavior(behavior, fieldSchema) {
  return !!getBehavior(behavior, fieldSchema);
}

/**
 * get props of a complex-list
 * @param  {object} fieldSchema
 * @return {array}
 */
export function getListProps(fieldSchema) {
  if (hasBehavior('complex-list', fieldSchema)) {
    const expanded = rawExpand(fieldSchema[fieldProp]);

    return _.get(_.find(expanded, (behavior) => behavior[behaviorKey] === 'complex-list'), 'args.props');
  } else {
    return null;
  }
}
