import _ from 'lodash';
import { displayProp, fieldProp, behaviorKey, groupsProp, componentListProp, componentProp } from '../utils/references';

const deprecatedBehaviorStrings = [
  // behaviors names that are deprecated, they don't match 1:1 with new inputs
  'textarea' // now `text` + multiline argument
];

/**
 * determine if a field has old-style behaviors (rather than new-style inputs)
 * fields have behaviors if:
 * - their behaviors are an array
 * - their behaviors are an object with `fn: behaviorName`
 * - their behaviors are a string that matches a deprecated behavior name (e.g. textarea)
 * note: new-style inputs can look like strings or objects with `input: inputName`
 * @param  {object} schema
 * @return {boolean}
 */
function fieldHasBehaviors(schema) {
  if (schema[componentListProp] || schema[componentProp]) {
    // component lists have a different api, which doesn't need to be updated for kiln 5.x
    return false;
  } else if (schema[displayProp]) {
    // _display is completely deprecated in kiln 5.x
    return true;
  } else {
    const behaviors = schema[fieldProp];

    return _.isArray(behaviors) || _.isObject(behaviors) && behaviors[behaviorKey] || _.isString(behaviors) && _.includes(deprecatedBehaviorStrings, behaviors);
  }
}

/**
 * determine if a group has fields with old-style behaviors (rather than new-style inputs)
 * groups have behaviors if:
 * - they have _display
 * - they have any fields with old-style behaviors
 * @param  {object} schema
 * @param  {object} rootSchema
 * @return {boolean}
 */
function groupHasBehaviors(schema, rootSchema) {
  if (schema[displayProp]) {
    // _display is completely deprecated in kiln 5.x
    return true;
  } else {
    // if any fields have old-style behaviors, we consider the group to have behaviors
    return _.some(schema.fields, (field) => {
      const fieldSchema = rootSchema[field];

      return fieldHasBehaviors(fieldSchema);
    });
  }
}

/**
 * determine if a field or group is using the old (kiln 4.x) behaviors api
 * fields and groups with _display, array behaviors, `fn: behaviorName`, and other syntax
 * denote old behaviors that need to be converted to new inputs before we can create forms
 * @param {string} path
 * @param  {object}  schema
 * @return {boolean}
 */
export function hasBehaviors(path, schema) {
  const fieldSchema = _.get(schema, path),
    groupSchema = _.get(schema, `${groupsProp}.${path}`);

  if (fieldSchema) {
    return fieldHasBehaviors(fieldSchema);
  } else if (groupSchema) {
    return groupHasBehaviors(groupSchema, schema);
  } else if (path === 'settings' && !groupSchema) {
    // settings groups must be explicitly declared in the kiln 5.x api
    return true;
  } else {
    // not a field or group
    throw new Error(`Cannot determine API compatibility for '${path}':`, fieldSchema || groupSchema || 'Not a field or group!');
  }
}

export function convertBehaviorsToInput() {
  return;
}
