// some little helpers to make writing validators easier.
// these are exported through the api for use in custom validators
import _ from 'lodash';
import { rawExpand } from '../forms/inputs';
import { fieldProp, inputProp } from '../utils/references';

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
 * get a input config from a field's schema, if it contains that specific input
 * note: if a complex-list item contains a input, the returned config will contain a `_path` property
 * note: in complex-lists, this will return the _first_ instance of the input
 * @param  {string}  input
 * @param  {object}  fieldSchema
 * @param {string} [path] if recursing through complex-lists
 * @return {object|null}
 */
export function getInput(input, fieldSchema, path) { // eslint-disable-line
  if (_.isObject(fieldSchema) && _.has(fieldSchema, fieldProp)) {
    const expanded = rawExpand(fieldSchema[fieldProp]);

    let listBehavior, rootInput;

    if (expanded[inputProp] === input) {
      rootInput = expanded;
    } else if (expanded[inputProp] === 'complex-list') {
      // recurse, in case there are nested lists
      _.find(_.get(expanded, 'props', []), (prop) => {
        const foundChild = getInput(input, prop, prop.prop);

        if (foundChild) {
          foundChild._path = foundChild._path ? `${prop.prop}.${foundChild._path}` : prop.prop;
          listBehavior = foundChild;
          return true;
        } else {
          return false;
        }
      });
    }

    return listBehavior || rootInput || null;
  } else {
    return null; // _version, _description, _component, _componentList, etc
  }
}

/**
 * get specific validation from a field's schema, if it contains that specific validation
 * note: if a complex-list item contains a field with that validation, the returned config will contain a `_path` property
 * note: in complex-lists, this will return the _first_ instance of the input that has this validation
 * @param  {string}  name
 * @param  {object}  fieldSchema
 * @param {string} [path] if recursing through complex-lists
 * @return {object|null}
 */
export function getValidation(name, fieldSchema, path) { // eslint-disable-line
  if (_.isObject(fieldSchema) && _.has(fieldSchema, fieldProp)) {
    const expanded = rawExpand(fieldSchema[fieldProp]);

    let listBehavior, rootInput;

    if (name === 'conditional-required' && _.isObject(_.get(expanded, 'validate.required'))) {
      rootInput = expanded;
    } else if (_.has(expanded, `validate.${name}`)) {
      rootInput = expanded;
    } else if (expanded[inputProp] === 'complex-list') {
      // recurse, in case there are nested lists
      _.find(_.get(expanded, 'props', []), (prop) => {
        const foundChild = getValidation(name, prop, prop.prop);

        if (foundChild) {
          foundChild._path = foundChild._path ? `${prop.prop}.${foundChild._path}` : prop.prop;
          listBehavior = foundChild;
          return true;
        } else {
          return false;
        }
      });
    }

    return listBehavior || rootInput || null;
  } else {
    return null; // _version, _description, _component, _componentList, etc
  }
}

/**
 * determine if a field's schema contains an input with specific validation
 * note: this will return true if the field contains n-number of complex-lists
 * whose fields contain the validation
 * @param  {string}  name
 * @param  {object}  fieldSchema
 * @return {Boolean}
 */
export function hasValidation(name, fieldSchema) {
  return !!getValidation(name, fieldSchema);
}

/**
 * determine if a field's schema contains a specific input
 * note: this will return true if the field contains n-number of complex-lists
 * whose fields contain the input
 * @param  {string}  input
 * @param  {object}  fieldSchema
 * @return {Boolean}
 */
export function hasInput(input, fieldSchema) {
  return !!getInput(input, fieldSchema);
}

/**
 * get props of a complex-list
 * @param  {object} fieldSchema
 * @return {array}
 */
export function getListProps(fieldSchema) {
  if (hasInput('complex-list', fieldSchema)) {
    const expanded = rawExpand(fieldSchema[fieldProp]);

    return _.get(expanded, 'props');
  } else {
    return null;
  }
}
