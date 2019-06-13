import _ from 'lodash';
import { props, attempt } from '../utils/promises';
import getPathFromField from '../utils/path-from-field';
import { UPDATE_VALIDATION } from './mutationTypes';
import { isComponentInPage } from '../utils/component-elements';
import { getMeta } from '../core-data/api';
import { getSchema } from '../core-data/components';
import { getComponentListStartFromComponent, getComponentNode } from '../utils/head-components';
import { componentListProp } from '../utils/references';
import logger from '../utils/log';

const log = logger(__filename);

/**
 * @module validators
 */

/**
 * determine if a component is in a page-specific head list
 * @param  {string}  uri
 * @param  {object}  state
 * @return {Boolean}
 */
function isComponentInPageHeadList(uri, state) {
  const componentNode = getComponentNode(uri),
    headListPath = componentNode && getComponentListStartFromComponent(componentNode),
    schema = headListPath && getSchema(_.get(state, 'page.data.layout'), headListPath);

  return schema && _.get(schema, `${componentListProp}.page`, false);
}

/**
 * run an individual validator. if it returns items, add the label and description
 * @param  {object} state
 * @return {function}
 */
function runValidator(state) {
  const isPageEditMode = _.get(state, 'editMode') === 'page';

  return (validator) => {
    return attempt(() => validator.validate(state))
      .then((result) => {
        if (!_.isEmpty(result)) {
          return {
            label: validator.label,
            description: validator.description,
            items: _.reduce(result, (instances, item) => {
              const isPageComponent = isComponentInPage(item.uri) || isComponentInPageHeadList(item.uri, state),
                isActive = isPageComponent && isPageEditMode || !isPageComponent && !isPageEditMode;

              if (isActive) {
                item.path = getPathFromField(item.uri, item.field);
                instances.push(item);
              }
              return instances;
            }, [])
          };
        }
      })
      .catch(log.error);
  };
}

/**
 * run a list of validators
 * @param  {array} validators
 * @param  {object} state
 * @return {Promise}
 */
function runValidators(validators, state) {
  return Promise.all(_.map(validators, runValidator(state)));
}

/**
 * make sure that all errors have items that can display.
 * some may have been parsed out by the isActive check in runValidator, above
 * @param  {object}  error
 * @return {Boolean}
 */
function hasItems(error) {
  return error && _.get(error, 'items.length');
}

/**
 * run an metadata validator. if it returns items, add the label and description and items
 * @param {object} metadata
 * @return {function}
 */
export function runMetaValidator(metadata) {
  return (validator) => {
    return attempt(() => validator.validate(metadata))
      .then((result) => {
        if (!_.isEmpty(result)) {
          return {
            label: validator.label,
            description: validator.description,
            items: result
          };
        }
      })
      .catch(log.error);
  };
}

/**
 * run a list of validators using page metadata
 * @param {uri} uri page uri
 * @param  {array} errorValidators validators for errors
 * @param  {array} warningValidators validators for warnings
 * @return {Promise}
 */
export function runMetaValidators(uri, errorValidators, warningValidators) {
  return getMeta(uri)
    .then((metadata) => {
      return props({
        errors: Promise.all(_.map(errorValidators, runMetaValidator(metadata))),
        warnings: Promise.all(_.map(warningValidators, runMetaValidator(metadata) ))
      });
    })
    .catch(log.error);
}

/**
 * Check if the validationRule has the correct properties to run validation with
 * @param {object} validators
 * @param {object} validationRule
 * @return {boolean}
 */
function validKilnjsValidator(validators, validationRule) {
  return  validationRule.validator &&
          validators[validationRule.validator] &&
          validators[validationRule.validator].type &&
          validators[validationRule.validator].kilnjsValidate;
}

/**
 * Run the kilnjsValidators
 * @param {object} schemas & components
 * @param {string} errorLevel
 * @return {array}
 */
export function runKilnjsValidators({schemas = {}, components}, errorLevel) {
  const { validators } = window.kiln,
    errors = [];

  Object.keys(schemas).forEach((schemaName) => {
    // Loop through all schemas on the page and check if they have a validation property
    if (schemas[schemaName].validation ) {
      // if they have a validation property, then loop through all the rules in the validation property array
      schemas[schemaName].validation.forEach((validationRule) => {
        // We're only interested in valid validators && validationRules with a type that matches the errorlevel (error, warning, etc.)
        if (validKilnjsValidator(validators, validationRule) && validators[validationRule.validator].type === errorLevel) {
          Object.keys(components).forEach((uri) => {
            // loop through all components and check if they are the same type as the current schemaName, if so, run the validator
            if (uri.indexOf(`/${schemaName}/`) > -1) {
              // run the validation rule on the input specified in the validationrule
              let value, fieldName;

              // the inputs to be tested can be a single string or an array of strings.  We need to determine which it is and get the value of the single input or an array of the values of the array of inputs
              if (_.isArray(validationRule.input)) {
                value = validationRule.input.map((input) => components[uri][input]);
                fieldName = validationRule.input[0];
              } else {
                value = components[uri][validationRule.input];
                fieldName = validationRule.input;
              }

              const validationError = validators[validationRule.validator].kilnjsValidate(value);

              if (validationError) {
                // if the validator returns an error, check to see if we've already found that type of error.  If we haven't, we add the error type to the errors array and the error to its items property
                // if we have already found that type of error, we just add the error to the items array of that pre-existing error type
                const foundError = errors.find((error) => error.label === validationError.label),
                  errorItem = {
                    uri,
                    field: fieldName,
                    location: schemaName,
                    preview: validationError.preview,
                    path: getPathFromField(uri, fieldName)
                  };

                if (!foundError) {
                  errors.push({
                    ...validationError,
                    items: [
                      errorItem
                    ]
                  });
                } else {
                  foundError.items.push(errorItem);
                }
              }
            }
          });
        }
      });
    }
  });

  return errors;
}

/**
 * Check whether is a metadata error
 * @param {string} scope
 * @param {string} type
 * @returns {boolean}
 */
export function isMetadataError(scope, type) {
  return scope === 'metadata' && type === 'error';
}

/**
 * Check whether is a metadata warning
 * @param {string} scope
 * @param {string} type
 * @returns {boolean}
 */
export function isMetadataWarning(scope, type) {
  return scope === 'metadata' && type === 'warning';
}

/**
 * Check whether is a metadata error
 * @param {object} validator
 * @param {string} validator.scope
 * @param {string} validator.type
 * @param {string} validator.uri
 * @returns {boolean}
 */
export function isGlobalMetadataError({ scope, type, uri }) {
  return isMetadataError(scope, type) && !uri;
}

/**
 * Check whether is a metadata error
 * @param {object} validator
 * @param {string} validator.scope
 * @param {string} validator.type
 * @param {string} validator.uri
 * @returns {boolean}
 */
export function isGlobalMetadataWarning({ scope, type, uri }) {
  return isMetadataWarning(scope, type) && !uri;
}

/**
 * Check whether is a metadata warning for specific page
 * @param {object} validator
 * @param {string} validator.scope
 * @param {string} validator.type
 * @param {string} validator.uri
 * @param {string} pageUri
 * @returns {boolean}
 */
export function isSpecificMetadataWarning({ scope, type, uri }, pageUri) {
  return isMetadataWarning(scope, type) && pageUri.indexOf(uri) >= 0;
}

/**
 * Check whether is a metadata error for specific page
 * @param {object} validator
 * @param {string} validator.scope
 * @param {string} validator.type
 * @param {string} validator.uri
 * @param {string} pageUri
 * @returns {boolean}
 */
export function isSpecificMetadataError({ scope, type, uri }, pageUri) {
  return isMetadataError(scope, type) && pageUri.indexOf(uri) >= 0;
}

/**
 * trigger validation
 * @param  {object} store
 * @return {Promise}
 */
export function validate(store) {
  const state = store.state,
    uri = _.get(store, 'state.page.uri'),
    validators = window.kiln.validators,
    warningValidators = _.filter(validators, (v) => v.type === 'warning' && !v.scope && v.validate),
    errorValidators = _.filter(validators, (v) => v.type === 'error' && !v.scope && v.validate),
    globalMetadataErrorValidators = _.filter(validators, isGlobalMetadataError),
    globalMetadataWarningValidators = _.filter(validators, isGlobalMetadataWarning),
    specificMetadataErrorValidators = _.filter(validators, (v) => isSpecificMetadataError(v, uri)),
    specificMetadataWarningValidators = _.filter(validators, (v) => isSpecificMetadataWarning(v, uri));

  return props({
    errors: runValidators(errorValidators, state),
    kilnjsErrors: runKilnjsValidators(state, 'error'),
    warnings: runValidators(warningValidators, state),
    kilnjsWarnings: runKilnjsValidators(state, 'warning'),
    metadata: runMetaValidators(uri, [
      ...globalMetadataErrorValidators,
      ...specificMetadataErrorValidators
    ], [
      ...globalMetadataWarningValidators,
      ...specificMetadataWarningValidators
    ])
  }).then((results) => {
    const errors = _.filter(_.flatten(results.errors), hasItems),
      kilnjsErrors = _.filter(_.flatten(results.kilnjsErrors), hasItems),
      warnings = _.filter(_.flatten(results.warnings), hasItems),
      kilnjsWarnings = _.filter(_.flatten(results.kilnjsWarnings), hasItems),
      metadataErrors = _.filter(_.flatten(results.metadata.errors), hasItems),
      metadataWarnings = _.filter(_.flatten(results.metadata.warnings), hasItems);

    store.commit(UPDATE_VALIDATION, {
      errors,
      warnings,
      metadataErrors,
      metadataWarnings,
      kilnjsWarnings,
      kilnjsErrors
    });

    return {
      errors,
      warnings,
      metadataErrors,
      metadataWarnings,
      kilnjsErrors,
      kilnjsWarnings
    };
  });
}
