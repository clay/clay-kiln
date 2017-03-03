import _ from 'lodash';
import { props, attempt } from '../utils/promises';
import { UPDATE_VALIDATION } from './mutationTypes';

/**
 * run an individual validator. if it returns items, add the label and description
 * @param  {object} state
 * @return {function}
 */
function runValidator(state) {
  return (validator) => {
    return attempt(() => validator.validate(state))
      .then((result) => {
        if (!_.isEmpty(result)) {
          return {
            label: validator.label,
            description: validator.description,
            items: result
          };
        }
      });
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

export function validate(store) {
  const state = store.state,
    validators = window.kiln.validators,
    errorValidators = _.filter(validators, (v) => v.type === 'error'),
    warningValidators = _.filter(validators, (v) => v.type === 'warning');

  return props({
    errors: runValidators(errorValidators, state),
    warnings: runValidators(warningValidators, state)
  }).then((results) => {
    store.commit(UPDATE_VALIDATION, {
      errors: _.compact(_.flatten(results.errors)),
      warnings: _.compact(_.flatten(results.warnings))
    });
    return results;
  });
}
