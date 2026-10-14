import _ from 'lodash';
import { UPDATE_COMPONENT } from '../component-data/mutationTypes';
import { render as modelRender } from '../component-data/model';
import { getComponentName } from '../utils/references';
import label from '../utils/label';
import { theirChanges } from './save';
import { rebaseHistory } from '../undo/actions';
import { changedFields } from './merge';
import { ensureComponents } from './remote';
import logger from '../utils/log';
import ctx from './context';

const log = logger(__filename);

/**
 * Who most recently changed a uri, according to the change feed.
 * @param {string} uri
 * @returns {string}
 */
export function lastEditorName(uri) {
  const event = _.find(_.get(ctx.store, 'state.collab.activity', []), entry => entry.uri === uri && entry.user);

  return event ? event.user.name : 'Someone';
}

/**
 * Human label for a field of a component.
 * @param {string} uri
 * @param {string} path
 * @returns {string}
 */
function fieldLabel(uri, path) {
  const schema = _.get(ctx.store, `state.schemas['${getComponentName(uri)}']`, {}),
    fieldSchemaLabel = _.get(schema, `${path}._label`) || _.get(schema, `${path}._has._label`);

  return fieldSchemaLabel || label(path);
}

/**
 * Tell the user we kept their version of a field someone else changed at the
 * same time, with a one-click way to take the other person's version instead.
 * @param {object} store
 * @param {string} uri
 * @param {object[]} conflicts
 */
export function notifyConflicts(store, uri, conflicts) {
  const real = _.reject(conflicts, 'merged'),
    name = lastEditorName(uri);

  if (!real.length) {
    return;
  }

  store.dispatch('showSnackbar', {
    message: `${name} also changed ${_.map(real, conflict => fieldLabel(uri, conflict.path)).join(', ')} — kept your version`,
    action: `Use ${name === 'Someone' ? 'theirs' : `${name}'s`}`,
    duration: 10000,
    onActionClick: () => store.dispatch('saveComponent', {
      uri,
      data: _.reduce(real, (data, conflict) => _.assign(data, { [conflict.path]: conflict.theirs }), {})
    })
  });
}

/**
 * After a collaborative save of a component: if it had to be merged with
 * someone else's changes, show the merged result and keep undo from
 * reverting their part.
 * @param {object} store
 * @param {string} uri
 * @param {object} oldData data our edit started from
 * @param {object} result from saveWithMerge
 * @returns {Promise}
 */
export function applySaveResult(store, uri, oldData, result) {
  if (!result || !result.merged) {
    return Promise.resolve(result);
  }

  // the merged data can reference components someone else just added
  return ensureComponents(store, result.data)
    .then(() => modelRender(uri, result.data))
    .then((renderableData) => {
      const fields = changedFields(store.state.components[uri], renderableData),
        kept = theirChanges(oldData, result.theirs || {}, result.conflicts);

      store.commit(UPDATE_COMPONENT, { uri, data: renderableData, fields });
      rebaseHistory(store, { uri, data: _.pick(renderableData, kept) });
      notifyConflicts(store, uri, result.conflicts);

      return store.dispatch('render', {
        uri, data: renderableData, snapshot: false, paths: fields
      });
    })
    .catch((e) => {
      // the save itself worked: never treat a display problem as a failed save
      log.error(`Saved ${uri}, but could not show the merged result: ${e.message}`, { action: 'collab' });
      store.dispatch('showSnackbar', {
        message: 'Saved. Reload to see everyone\'s latest changes.',
        action: 'Reload',
        onActionClick: () => window.location.reload()
      });
    })
    .then(() => result);
}

/**
 * After a collaborative page save: the data and the paths to re-render,
 * including page areas someone else changed meanwhile.
 * @param {object} store
 * @param {object} oldData
 * @param {string[]} paths
 * @param {object} result from saveWithMerge
 * @returns {Promise<{data: object, paths: string[]}>}
 */
export function pageSaveResult(store, oldData, paths, result) {
  if (!result.merged) {
    return Promise.resolve({ data: result.data, paths });
  }

  const allPaths = _.union(paths, changedFields(oldData, result.data));

  // page areas may now include components someone else added
  return ensureComponents(store, _.pick(result.data, allPaths))
    .catch(e => log.error(`Could not load components added by others: ${e.message}`, { action: 'collab' }))
    .then(() => ({ data: result.data, paths: allPaths }));
}
