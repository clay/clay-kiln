import _ from 'lodash';
import { inputProp } from '../utils/references';
import htmlTags from 'html-tags';
import logger from '../utils/log';
import KilnInput from '../../inputs/kiln-input';

const log = logger(__filename);

// hash of all inputs, added to global
window.kiln = window.kiln || {}; // note: this is here for testing. it should already exist when this file is imported
window.kiln.inputs = window.kiln.inputs || {};
window.kiln.kilnInput = KilnInput;

export function convertNativeTagName(name) {
  // make sure we're not overwriting a native html tag
  // note: vue doesn't like the name 'text' for some reason,
  // even though it's not a native html tag name
  if (_.includes(htmlTags, name) || name === 'text') {
    return `input-${name}`;
  } else {
    return name;
  }
}

/**
 * add a input to the hash. used by edit.js to add internal inputs
 * @param {string}   name
 * @param {Function} vueComponent vue component
 */
export function add(name, vueComponent) {
  name = convertNativeTagName(name);

  // note: this WILL overwrite inputs already in the hash,
  // allowing people to use custom versions of our core inputs
  window.kiln.inputs[name] = vueComponent;
}

/**
 * fail gracefully when people specify inputs that don't exist
 * e.g. still add the other fields in a form, but warn them
 * @param  {object} input expanded input definition
 * @return {boolean}
 */
function omitMissingInput(input) {
  const name = input[inputProp],
    found = window.kiln.inputs[name];

  if (!found) {
    log.warn('Input "' + name + '" not found. Make sure you add it!', { action: 'omitMissingInput', input });
  }

  return found ? input : {};
}

/**
 * convert the input name to `input-${name}` if it conflicts with
 * a native html tag name, because vue components aren't allowed to conflict
 * with native html tag names
 * @param  {object} input
 * @return {object}
 */
function mungeNativeTagNames(input) {
  if (input[inputProp]) {
    input[inputProp] = convertNativeTagName(input[inputProp]);
  }
  return input;
}

/**
 * find and expand an attached button, if the input has one
 * note: attached buttons may be strings or objects with { name: buttonName }
 * @param  {object} input
 * @return {object}
 */
function expandAttachedButton(input) {
  // we need to clone the input config anyway, so we don't mutate the schema in the store
  const inputConfig = _.cloneDeep(input),
    attachedButton = inputConfig.attachedButton;

  if (attachedButton && _.isString(attachedButton)) {
    return _.assign(inputConfig, { attachedButton: { name: attachedButton }});
  } else {
    // no button, or button's already an object
    return inputConfig;
  }
}

/**
 * get expanded input object
 * used by expand(), but also used in validation helpers
 * @param  {string|object} input
 * @return {object}
 */
export function rawExpand(input) {
  if (_.isString(input) && input.length) {
    // _has: text
    return { [inputProp]: input };
  } else if (_.isPlainObject(input) && _.isString(input[inputProp])) {
    /* _has:
     *   input: text
     *   help: some descriptive text
     */
    return expandAttachedButton(input);
  } else {
    log.debug('Unknown input format!', { action: 'rawExpand', input });
    return {};
  }
}

/**
 * get an object with the expanded input, for use in forms
 * note: as opposed to rawExpand, this will munge the names so they can be used in forms,
 * and omit them gracefully if they're missing
 * @param  {*} input
 * @return {object}           {input: string, args: object}
 */
export function expand(input) {
  return omitMissingInput(mungeNativeTagNames(rawExpand(input)));
}
