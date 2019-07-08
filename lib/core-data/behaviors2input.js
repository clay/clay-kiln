import _ from 'lodash';
import {
  displayProp,
  fieldProp,
  behaviorKey,
  groupsProp,
  componentListProp,
  componentProp,
  descProp,
  devDescProp,
  versionProp,
  placeholderProp,
  inputProp,
  pubProp,
  subProp,
  labelProp,
  revealProp,
  removeProp
} from '../utils/references';
import logger from '../utils/log';

const log = logger(__filename),
  deprecatedBehaviorStrings = [
    // behaviors names that are deprecated, they don't match 1:1 with new inputs
    'textarea', // now `text` + multiline argument
    'required',
    'conditional-required',
    'soft-maxlength'
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

    return _.isArray(behaviors) || _.isObject(behaviors) && !!behaviors[behaviorKey] || _.isString(behaviors) && _.includes(deprecatedBehaviorStrings, behaviors);
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

/**
 * determine if a schema has ANY old behaviors
 * @param  {object}  schema
 * @return {Boolean}
 */
export function hasAnyBehaviors(schema) {
  return _.isObject(schema) ? _.some(Object.keys(schema), prop => hasBehaviors(prop, schema)) : false;
}

/**
 * get expanded behavior config from behaviors string/object/array
 * @param  {string} name
 * @param  {string|array|object} behaviors
 * @return {object|null}
 */
function getBehavior(name, behaviors) {
  if (_.isString(behaviors) && behaviors === name) {
    return {}; // empty object, because no arguments
  } else if (_.isArray(behaviors)) {
    const found = _.find(behaviors, behavior => getBehavior(name, behavior));

    if (found && _.isString(found)) {
      return {};
    } else if (found && _.isObject(found)) {
      return _.omit(found, [behaviorKey]);
    } else {
      return null;
    }
  } else if (_.isObject(behaviors) && behaviors[behaviorKey] === name) {
    return _.omit(behaviors, [behaviorKey]); // arguments from the behavior config
  } else {
    return null;
  }
}

/**
 * return config for an inline wysiwyg behavior, if it exists
 * inline wysiwyg has _display: inline, and an unstyled wysiwyg behavior
 * @param  {object}  schema
 * @return {object|null}
 */
function getInlineWYSIWYG(schema) {
  const isInlineDisplay = schema[displayProp] === 'inline',
    wysiwyg = isInlineDisplay && getBehavior('wysiwyg', schema[fieldProp]),
    styled = _.isObject(wysiwyg) && wysiwyg.styled;

  return isInlineDisplay && !!wysiwyg && !styled ? wysiwyg : null;
}

/**
 * find the main input in a field
 * @param  {string|array|object} behaviors
 * @return {object|null}
 */
function findMainInput(behaviors) {
  let mainInput = null;

  _.each([
    // behaviors considered the "main" input
    'checkbox-group',
    'checkbox',
    'codemirror',
    'complex-list',
    'radio',
    'segmented-button-group',
    'segmented-button',
    'select',
    'simple-list',
    'text',
    'textarea',
    'wysiwyg'
  ], (name) => {
    const found = getBehavior(name, behaviors);

    if (found) {
      mainInput = {
        fn: name,
        args: found
      };

      return false; // exit loop early
    }
  });

  return mainInput;
}

/**
 * find the first attached button for a field
 * @param  {string|array|object} behaviors
 * @return {object|null}
 */
function findAttachedButton(behaviors) {
  let button = null;

  _.each([
    // behaviors considered attached buttons
    // note: this includes the custom behaviors we know about
    'lock',
    'magic-button',
    'mediaplay-picker'
  ], (name) => {
    const found = getBehavior(name, behaviors);

    if (found) {
      button = {
        fn: name,
        args: found
      };

      return false; // exit loop early
    }
  });

  return button;
}

/**
 * convert the main input into the new syntax
 * @param  {object} mainInput
 * @param  {string|array|object} behaviors
 * @param {string} prop for errors and logging
 * @return {object}
 */
function mungeMainInput(mainInput, behaviors, prop) { // eslint-disable-line
  let input = {},
    desc = getBehavior('description', behaviors),
    attachedButton;

  if (!mainInput && desc) {
    // this isn't an ediable field, but might have a description that we should convert
    input.help = desc.value;

    return input; // return the input early, as there's nothing else we need to do here
  }

  if (!mainInput && !desc) {
    log.warn(`No main input found for "${prop}", and no description attached. If this field is not editable, please add a description describing how it is generated.`, { action: 'mungeMainInput' });

    return input; // empty object
  }

  if (mainInput[behaviorKey] === 'complex-list') {
    // complex lists need to also munge their properties
    input[inputProp] = 'complex-list';
    input.props = _.map(mainInput.args.props, field => _.assign({}, convertField(field, field.prop), { prop: field.prop }));
  } else if (mainInput[behaviorKey] === 'textarea') {
    // textarea is now just text w/ multi-line
    input[inputProp] = 'text';
    input.type = 'multi-line';
    // textarea has no other special arguments
  } else if (mainInput.args.type === 'date') {
    // datepickers are now a separate input
    input[inputProp] = 'datepicker';
  } else if (mainInput.args.type === 'time') {
    // timepickers are now a separate input
    input[inputProp] = 'timepicker';
  } else if (mainInput.args.type === 'datetime-local') {
    // datetime-local needs to be split into two separate fields,
    // because there are no good UI widgets that handle both date and time
    log.warn(`'${prop}' (datetime-local) must be converted to two separate date and time fields! Editing this field in kiln will set the time to 12:00 AM on the date specified.`, { action: 'mungeMainInput' });
    input[inputProp] = 'datepicker';
  } else {
    input[inputProp] = mainInput[behaviorKey];
    input = _.assign(input, _.omit(mainInput.args, [
      behaviorKey,
      // reserved properties for new inputs
      inputProp,
      'validate',
      'help',
      // native validation
      'required',
      'pattern',
      'min',
      'max',
      'minLength',
      'maxLength',
      // other things that don't fit in with the new paradigm
      'label',
      'placeholder' // removed because of float labels
    ]));
  }

  // add native required/min/max/minLength/maxLength/pattern validation

  // native required becomes prepublish required
  if (mainInput.args.required) {
    _.set(input, 'validate.required', true);
  }

  // native pattern becomes prepublish pattern validation
  if (mainInput.args.pattern) {
    _.set(input, 'validate.pattern', mainInput.args.pattern);
  }

  // native min/minLength becomes prepublish min validation
  if (mainInput.args.min || mainInput.args.minLength) {
    _.set(input, 'validate.min', mainInput.args.min || mainInput.args.minLength);
  }

  // native max/maxLength becomes prepublish max validation
  if (mainInput.args.max || mainInput.args.maxLength) {
    _.set(input, 'validate.max', mainInput.args.max || mainInput.args.maxLength);
  }

  // add help text (from description)
  if (desc) {
    input.help = desc.value;
  }

  // add attachedButton if it exists
  attachedButton = findAttachedButton(behaviors);
  if (attachedButton && _.size(attachedButton.args)) {
    _.set(input, 'attachedButton', _.assign({ name: attachedButton[behaviorKey] }, attachedButton.args));
  } else if (attachedButton) {
    // similar to _has: text, syntax sugar for attached buttons with no arguments
    _.set(input, 'attachedButton', attachedButton[behaviorKey]);
  }

  return input;
}

/**
 * convert the main input for a field
 * @param  {object} schema for the field
 * @param  {string} prop   field name (for logging and errors)
 * @return {object}
 */
function convertMainInput(schema, prop) {
  const inlineWysiwyg = getInlineWYSIWYG(schema),
    behaviors = schema[fieldProp],
    required = getBehavior('required', behaviors),
    conditionalRequired = getBehavior('conditional-required', behaviors),
    maxLength = getBehavior('soft-maxlength', behaviors);

  let input = {};

  // figure out main input
  if (inlineWysiwyg) {
    input = _.assign(input, { [inputProp]: 'inline' }, _.omit(inlineWysiwyg, [behaviorKey, 'styled']));
  } else if (behaviors) {
    // find the main input
    const mainInput = findMainInput(behaviors);

    // munge config for main input
    input = mungeMainInput(mainInput, behaviors, prop);
  } else {
    log.warn(`'${prop}' has no behaviors specified! For non-editable fields, please include a description to document how that field is set.`, { action: 'convertMainInput' });
  }

  // add validation
  if (conditionalRequired) {
    _.set(input, 'validate.required', conditionalRequired);
  } else if (required) {
    _.set(input, 'validate.required', true);
  }

  if (maxLength) {
    _.set(input, 'validate.max', maxLength.value);
  }

  // if, after converting everything in the main input,
  // it's a single input with no arguments, validation, or help text,
  // return the input as as a string.
  // this simulates the (kiln 5.x) syntactical sugar allowing `_has: text` and such shorthands
  return _.size(input) === 1 && _.has(input, inputProp) ? input[inputProp] : input;
}

/**
 * convert a field from the old behaviors api to the new input api
 * @param  {object} schema
 * @param  {string} prop   used for logs and errors
 * @return {object}
 */
function convertField(schema, prop) {
  const behaviors = schema[fieldProp];

  // make a new field schema by pulling in properties from the old schema,
  // but dropping the _display and converting the behaviors to an input
  return _.assign({}, _.pickBy({
    [labelProp]: schema[labelProp], // todo: warn if this doesn't exist
    [placeholderProp]: schema[placeholderProp],
    [pubProp]: schema[pubProp],
    [subProp]: schema[subProp],
    [revealProp]: getBehavior('reveal', behaviors),
    [fieldProp]: convertMainInput(schema, prop)
    // no _display
  }, _.identity));
}

/**
 * convert all groups, which basically removes the _display property of each
 * @param  {object} groups
 * @return {object}
 */
function convertGroups(groups) {
  return _.mapValues(groups, group => _.omit(group, [displayProp]));
}

/**
 * convert a property in a schema
 * @param  {object} schema
 * @param  {string} prop
 * @return {object}
 */
function convertSchemaProp(schema, prop) {
  if (_.includes([descProp, devDescProp, versionProp, removeProp], prop)) {
    // pass through _version, _description, etc
    return schema[prop];
  } else if (_.get(schema, `${prop}.${componentListProp}`) || _.get(schema, `${prop}.${componentProp}`)) {
    // pass through component lists and props
    return schema[prop];
  } else if (prop === groupsProp) {
    // convert group
    return convertGroups(schema[prop]);
  } else {
    // convert field
    return convertField(schema[prop], prop);
  }
}

/**
 * find and convert an implicit settings group, if it exists
 * note: this adds the group to newSchema._groups.settings directly
 * @param  {object} newSchema
 * @param  {object} schema
 */
function convertImplicitSettings(newSchema, schema) {
  if (_.get(newSchema, `${groupsProp}.settings`)) {
    return; // if there's already an explicitly-declared settings group, use it
  } else {
    const settingsFields = _.reduce(schema, (group, fieldSchema, fieldName) => {
      if (_.isObject(fieldSchema) && fieldSchema[displayProp] === 'settings') {
        group.fields.push(fieldName);
      }

      return group;
    }, { fields: [] });

    if (settingsFields.fields.length) {
      // if we've added fields to the `fields` prop, it means we should add that settings group
      _.set(newSchema, `${groupsProp}.settings`, settingsFields);
      // we don't return anything here, since we're mutating newSchema directly
    }
  }
}

/**
 * convert behaviors api to inputs api
 * @param  {object} schema full component schema
 * @param {string} name of the component (to use as the memoization key)
 * @param  {string} [path]  optional path to only convert a specific property of the schema (also used as memoization key)
 * @return {object}
 */
function convert(schema, name, path) {
  // note: this warning message is also memoized, so it should only print once for each different thing that needs to be converted
  log.debug(`${name}${path ? ' → ' + path : ''} must be updated to the Inputs API, as the Behaviors API is deprecated (and will be removed in the next major Kiln version)`, { action: 'convert' });
  // convert the specific property, or each property in the schema
  if (path) {
    return convertSchemaProp(schema, path);
  } else {
    const newSchema = _.mapValues(schema, (val, key, fullObj) => convertSchemaProp(fullObj, key));

    // find any implicit settings groups and make them explicit
    // (implicit settings are a bunch of fields with `_display: settings`, rather than a `settings` group)
    convertImplicitSettings(newSchema, schema);

    return newSchema;
  }
}

export let convertSchema = _.memoize(
  (schema, name, path) => convert(schema, name, path),
  // memoize by name (and path if it exists)
  (schema, name, path) => `${name}${path ? '|' + path : ''}`
);
