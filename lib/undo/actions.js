import _ from 'lodash';
import { UNDO, REDO } from './mutationTypes';
import { RENDER_COMPONENT } from '../component-data/mutationTypes';
import { getTemplate } from '../core-data/components';
import { getComponentName } from '../utils/references';

/**
 * get changed components, used by undo and redo
 * @param  {object} current
 * @param  {object} compare (prev/next components object)
 * @return {object}
 */
function getChangedComponents(current, compare) {
  return _.reduce(current, (result, data, uri) => {
    if (!_.isEqual(data, compare[uri])) {
      result[uri] = data;
    }
    return result;
  }, {});
}

/**
 * render multiple components at once
 * @param  {object} changedComponents
 * @param  {string} actionName        'undo', 'redo'
 * @param {function} commit
 */
function renderChangedComponents(changedComponents, actionName, commit) {
  _.forOwn(changedComponents, (data, uri) => {
    const template = getTemplate(uri);

    if (template) {
      commit(RENDER_COMPONENT, { uri, data, snapshot: false });
    } else {
      // component has no handlebars template, so we cannot undo it without changing server data
      console.warn(`Unable to ${actionName}: Component ${getComponentName(uri)} cannot be re-rendered client-side!`);
    }
  });
}

export function undo({ state, commit }) {
  let latestComponents, changedComponents;

  commit(UNDO);

  latestComponents = _.get(state, `undo.history[${state.undo.cursor + 1}].components`); // get the component obj one snapshot ahead
  changedComponents = getChangedComponents(state.components, latestComponents);
  renderChangedComponents(changedComponents, 'undo', commit);
}

export function redo({ state, commit }) {
  let prevComponents, changedComponents;

  commit(REDO);

  prevComponents = _.get(state, `undo.history[${state.undo.cursor - 1}].components`); // get the component obj one snapshot ahead
  changedComponents = getChangedComponents(state.components, prevComponents);
  renderChangedComponents(changedComponents, 'redo', commit);
}
