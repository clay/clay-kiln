// some little helpers to make writing validators easier.
// these are exported through the api for use in custom validators
import _ from 'lodash';
import striptags from 'striptags';
import { decode } from 'he';
import { isComponent } from 'clayutils';
import { rawExpand } from '../forms/inputs';
import label from '../utils/label';
import {
  refProp, fieldProp, inputProp, componentListProp, componentProp, getComponentName
} from '../utils/references';
import { isEmpty, compare } from '../utils/comparators';

/**
 * iterate through components, calling a function on all non-empty components
 * optionally: only call the function on specific types of components
 * @param  {object}   state
 * @param  {Function} fn called with componentData, uri
 * @param  {string|array}   [nameFilter]
 */
export function forEachComponent(state, fn, nameFilter) {
  _.forOwn(_.get(state, 'components', {}), (componentData, uri) => {
    if (_.isEmpty(componentData)) {
      return; // component has been removed from the store, so it's an empty object
    }

    if (_.isArray(nameFilter)) {
      // if the component matches any of the names, run the function
      _.each(nameFilter, (name) => {
        if (uri.match(new RegExp(`components\/${name}(?:\/|$)`))) {
          fn(componentData, uri);
        }
      });
    } else if (_.isString(nameFilter) && uri.match(new RegExp(`components\/${nameFilter}(?:\/|$)`))) {
      // if the component matches the (single) type passed in, run the function
      fn(componentData, uri);
    } else if (!nameFilter) {
      // if no filter was passed in, run the funtion
      fn(componentData, uri);
    }
  });
}

/**
 * get schema from state
 * @param  {object} state
 * @param  {string} name or uri
 * @return {object}
 */
export function getSchema(state, name) {
  if (_.isString(state)) {
    throw new Error('You must pass in state to getSchema() as the first argument!');
  }

  // if it's actually a full uri, get the name
  if (isComponent(name)) {
    name = getComponentName(name);
  }

  return _.get(state, `schemas[${name}]`, {});
}

/**
 * call field fn with field object,
 * recursively calling itself for complex-list items
 * @param  {object}   schema
 * @param  {*}   data
 * @param  {string}   name
 * @param  {string}   path (in complex-lists, this will have the item's index)
 * @param  {Function} fn
 */
function recursivelyCallField({
  schema, data, name, path, fn
}) {
  let fieldObj = {
    name,
    path,
    schema,
    validate: _.get(schema, `${fieldProp}.validate`)
  };

  if (_.has(schema, fieldProp) && _.get(schema, `${fieldProp}.${inputProp}`) === 'complex-list') {
    // complex-list, so recursively look at fields inside it
    fieldObj.type = 'complex-list';
    fieldObj.value = data || [];
    // complex list items, or empty array
    // note: complex lists that don't have default data (and were never set) get normalized to `[]` here
    fn(fieldObj);
    // once the complex-list itself is called, iterate through any items it may contain
    _.each(fieldObj.value, (item, index) => {
      _.each(_.get(schema, `${fieldProp}.props`, []), (listProp) => {
        const prop = listProp.prop;

        recursivelyCallField({
          schema: listProp,
          data: _.get(item, prop, null),
          name: prop,
          path: `${path}.${index}.${prop}`,
          fn
        });
      });
    });
  } else if (_.has(schema, fieldProp) && (_.has(schema, `${fieldProp}.${inputProp}`) || _.isString(schema[fieldProp]))) {
    // regular editable field
    fieldObj.type = 'editable-field';
    fieldObj.value = data;
    // field data, or null
    // note: fields that don't have default data (and were never set) get normalized to `null` here
    fn(fieldObj);
  } else {
    // non-editable field (no `input` set)
    // note: these may be set by model.js, pubsub, or other means. they can still be validated against
    fieldObj.type = 'non-editable-field';
    fieldObj.value = data;
    // field data, or null
    // note: non-editable fields might have weird-looking data (e.g. component lists, props, etc that weren't specced out in the schema correctly)
    // note: fields that don't have default data (and were never set) get normalized to `null` here
    fn(fieldObj);
  }
}

/**
 * iterate through fields, calling a function on each field
 * note: fields inside complex-lists will be called AFTER the complex-list field
 * note: fields inside complex-lists will have indices in their paths
 * @param {object} state
 * @param  {object}   componentData
 * @param  {string}   uri
 * @param  {Function} fn called with field object { type, name, schema, path, value }
 * note: field.type is 'complex-list', 'editable-field', 'component-list', 'component-prop', or 'non-editable-field'
 */
export function forEachField(state, componentData, uri, fn) {
  const schema = getSchema(state, uri);

  if (_.isEmpty(componentData) || _.isEmpty(schema)) {
    // don't run validation against empty components or components without fields
    return;
  }

  _.forOwn(schema, (fieldSchema, fieldName) => {
    let fieldObj = {
      name: fieldName,
      schema: fieldSchema
    };

    if (_.includes(['_version', '_description', '_devDescription', '_groups', '_confirmRemoval'], fieldName)) {
      // don't run field validation if the field is a reserved field (version, description, etc)
      return;
    }

    // set the field type
    if (_.has(fieldSchema, componentListProp)) {
      const val = _.get(componentData, fieldName, []);

      // component list
      fieldObj.type = 'component-list';
      fieldObj.path = fieldName;
      fieldObj.value = _.isArray(val) ? val.map(child => child[refProp]) : val;
      fieldObj.validate = _.get(fieldSchema, `${componentListProp}.validate`);
      // array of refs, string alias for a page area, or empty array
      fn(fieldObj);
    } else if (_.has(fieldSchema, componentProp)) {
      // component prop
      fieldObj.type = 'component-prop';
      fieldObj.path = fieldName;
      fieldObj.value = _.isObject(_.get(componentData, fieldName)) ? _.get(componentData, fieldName)[refProp] : null;
      fieldObj.validate = _.get(fieldSchema, `${componentProp}.validate`);
      // child ref, or null
      fn(fieldObj);
    } else {
      // possibly-recursive field
      recursivelyCallField({
        schema: fieldSchema,
        data: _.get(componentData, fieldName, null),
        name: fieldName,
        path: fieldName,
        fn
      });
    }
  });
}

/**
 * get the plaintext value of a string
 * @param  {string} val
 * @return {string}
 */
export function getPlaintextValue(val) {
  let str = new String(val);

  return decode(striptags(str));
}

/**
 * generate a component label from a uri
 * @param  {string} uri
 * @return {string}
 */
export function labelComponent(uri) {
  return label(getComponentName(uri));
}

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
 * determine whether a conditional-required field should be required
 * note: exported for testing
 * @param  {object} field         { type, name, path, schema, value }
 * @param  {object} componentData
 * @return {boolean}
 */
export function shouldBeRequired(field, componentData) {
  const compareField = _.get(field, 'validate.required.field'),
    compareOperator = _.get(field, 'validate.required.operator'),
    compareValue = _.get(field, 'validate.required.value'),
    compareValues = _.get(field, 'validate.required.values'),
    path = _.get(field, 'path'),
    pathArray = path.split('.');

  let comparePath;

  if (pathArray.length > 1) {
    // iterate up through the path, checking to see if the parent item (for complex lists)
    // has the field in question
    _.findLast(pathArray, (pathPart, pathIndex) => {
      if (pathPart.match(/\d+/)) {
        const subPath = pathArray.slice(0, pathIndex + 1).join('.');

        if (_.has(componentData, `${subPath}.${compareField}`)) {
          comparePath = `${subPath}.${compareField}`;

          return true;
        } else {
          return false;
        };
      } else {
        return false;
      }
    });
  } else {
    comparePath = compareField;
  }

  if (!_.isEmpty(compareValues)) {
    return _.some(compareValues, v => compare({ data: _.get(componentData, comparePath), operator: compareOperator, value: v }));
  }

  return compare({ data: _.get(componentData, comparePath), operator: compareOperator, value: compareValue });
}

/**
 * determine if a field passes built-in validation
 * @param  {object}  field         { type, name, path, schema, value }
 * @param  {object}  componentData
 * @param {string} [type] if you only want to validate against a specific thing
 * @return {Boolean}
 */
export function isValid(field, componentData, type) { // eslint-disable-line
  const validate = _.get(field, 'validate'),
    fieldValue = _.get(field, 'value'),
    isFieldEmpty = isEmpty(fieldValue),
    strValue = _.isString(fieldValue) && getPlaintextValue(fieldValue);

  let length;

  if (!_.isObject(validate)) {
    return true; // if no built-in validation rules, return true
  }

  // if we're dealing with strings or arrays, we'll want to check min/max against the length
  // (if it's numbers, dates, or other things, we want to check min/max against the value directly)
  if (strValue || _.isArray(fieldValue)) {
    length = (strValue || fieldValue).length;
  }

  // you can run isValid() against a specific type, or simply against all options specified in the `validate` object
  if (type) {
    // run against a specific kind of validation
    switch (type) {
      case 'required': return !(validate.required === true && isFieldEmpty);
      case 'conditional-required': return !(_.isObject(validate.required) && shouldBeRequired(field, componentData) && isFieldEmpty);
      case 'pattern': return !(!isFieldEmpty && validate.pattern && !strValue.match(new RegExp(validate.pattern, 'ig')));
      case 'min': return !(!isFieldEmpty && validate.min && (length || fieldValue) < validate.min);
      case 'max': return !(!isFieldEmpty && validate.max && (length || fieldValue) > validate.max);
      default: throw new Error(`Unsupported validation type: ${type}`);
    }
  } else {
    // run against all options specified in the `validate` object
    // validate required fields first, then the rest of the built-in validation rules
    return !(validate.required === true && isFieldEmpty // regular required
      || _.isObject(validate.required) && shouldBeRequired(field, componentData) && isFieldEmpty // conditional-required
      || !isFieldEmpty && validate.pattern && !strValue.match(new RegExp(validate.pattern, 'ig')) // pattern validation
      || !isFieldEmpty && validate.min && (length || fieldValue) < validate.min // minimum length / value
      || !isFieldEmpty && validate.max && (length || fieldValue) > validate.max); // maximum length / value
  }
}

// DEPRECATED HELPERS - will be removed in kiln 6.x

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

    let listBehavior,
      rootInput;

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

    let listBehavior,
      rootInput;

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
