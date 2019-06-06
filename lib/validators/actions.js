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
    warnings: runValidators(warningValidators, state),
    metadata: runMetaValidators(uri, [
      ...globalMetadataErrorValidators,
      ...specificMetadataErrorValidators
    ], [
      ...globalMetadataWarningValidators,
      ...specificMetadataWarningValidators
    ])
  }).then((results) => {
    const errors = _.filter(_.flatten(results.errors), hasItems),
      warnings = _.filter(_.flatten(results.warnings), hasItems),
      metadataErrors = _.filter(_.flatten(results.metadata.errors), hasItems),
      metadataWarnings = _.filter(_.flatten(results.metadata.warnings), hasItems);

    store.commit(UPDATE_VALIDATION, {
      errors,
      warnings,
      metadataErrors,
      metadataWarnings
    });

    return {
      errors,
      warnings,
      metadataErrors,
      metadataWarnings
    };
  });
}
