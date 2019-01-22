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

function runMetaValidator(metadata) {
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

function runMetaValidators(uri, validators) {
  return getMeta(uri)
    .then((metadata) => {
      console.log('::metadata', metadata);
      return Promise.all(_.map(validators, runMetaValidator(metadata)));
    })
    .catch(log.error);
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
    metadataErrorValidators = _.filter(validators, (v) => v.scope === 'metadata' && v.type === 'error'),
    errorValidators = _.filter(validators, (v) => v.type === 'error'),
    warningValidators = _.filter(validators, (v) => v.type === 'warning');

  return props({
    errors: runValidators(errorValidators, state),
    warnings: runValidators(warningValidators, state),
    metaErrors: runMetaValidators(uri, metadataErrorValidators)
  }).then((results) => {
    const errors = _.filter(_.flatten(results.errors), hasItems),
      warnings = _.filter(_.flatten(results.warnings), hasItems),
      metaErrors = _.filter(_.flatten(results.metaErrors), hasItems);

    store.commit(UPDATE_VALIDATION, { errors, warnings, metaErrors });

    return { errors, warnings };
  });
}
