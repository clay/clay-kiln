import _ from 'lodash';
import { isLayout } from 'clayutils';
import { UPDATE_COMPONENT } from '../component-data/mutationTypes';
import { render as modelRender } from '../component-data/model';
import { getComponentName } from '../utils/references';
import label from '../utils/label';
import { rebaseHistory } from '../undo/actions';
import { changedFields } from './merge';
import { ensureComponents, showLayout } from './remote';
import logger from '../utils/log';
import ctx, { setRev, rereadSoon } from './context';

const log = logger(__filename);

/**
 * Who most recently changed a uri, according to the change feed.
 * @param {string} uri
 * @returns {string|null}
 */
export function lastEditorName(uri) {
  const event = _.find(_.get(ctx.store, 'state.collab.activity', []), entry => entry.uri === uri && entry.user);

  return event ? event.user.name : null;
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
 * What to tell the user about fields someone else changed at the same time.
 * Named when the server or the feed knows who it was; a change this tab
 * missed while reconnecting, by nobody it knows of, says so.
 * @param {string} uri
 * @param {string[]} labels the fields
 * @param {object|null} [by] from the 412: { user } who saved that version, null
 *   when nobody is known for it; undefined if the server didn't say (then the
 *   feed's latest change to it is the best guess)
 * @returns {{message: string, action: string}}
 */
export function conflictNotice(uri, labels, by) {
  const name = by === undefined ? lastEditorName(uri) : _.get(by, 'user.name'),
    fields = labels.join(', ');

  if (name) {
    return { message: `${name} also changed ${fields} — kept your version`, action: `Use ${name}'s` };
  }

  if (ctx.unverified || ctx.missed[uri]) {
    return { message: `${fields} ${labels.length > 1 ? 'were' : 'was'} updated while you were reconnecting — kept your version`, action: 'Use theirs' };
  }

  return { message: `Someone also changed ${fields} — kept your version`, action: 'Use theirs' };
}

/**
 * Tell the user we kept their version of a field someone else changed at the
 * same time, with a one-click way to take the other person's version instead.
 * @param {object} store
 * @param {string} uri
 * @param {object[]} conflicts
 * @param {object} [by] who saved it last, if the server knew
 */
export function notifyConflicts(store, uri, conflicts, by) {
  const real = _.reject(conflicts, 'merged');

  if (!real.length) {
    return;
  }

  const notice = conflictNotice(uri, _.map(real, conflict => fieldLabel(uri, conflict.path)), by);

  delete ctx.missed[uri];
  store.dispatch('showSnackbar', _.assign(notice, {
    actionDuration: 10000,
    onActionClick: () => store.dispatch('saveComponent', {
      uri,
      data: _.reduce(real, (data, conflict) => _.assign(data, { [conflict.path]: conflict.theirs }), {})
    })
  }));
}

/**
 * Patch what someone else merged into a component this tab just saved.
 * @param {object} store
 * @param {string} uri
 * @param {object} sentData
 * @param {object} result from saveWithMerge
 * @returns {Promise}
 */
function showMerged(store, uri, sentData, result) {
  // the merged data can reference components someone else just added
  return ensureComponents(store, result.data)
    .then(() => Promise.all([modelRender(uri, sentData), modelRender(uri, result.data)]))
    .then(([shown, merged]) => {
      const patchFields = changedFields(shown, merged),
        current = store.state.components[uri] || {},
        data = _.omitBy(_.assign({}, current, _.pick(merged, patchFields)), (value, key) => _.includes(patchFields, key) && !_.has(merged, key));

      store.commit(UPDATE_COMPONENT, { uri, data, fields: patchFields });
      setRev(uri, result.rev);
      rebaseHistory(store, { uri, data: _.pick(data, patchFields) });
      notifyConflicts(store, uri, result.conflicts, result.by);

      return store.dispatch('render', {
        uri, data, snapshot: false, paths: patchFields
      });
    });
}

/**
 * After a collaborative save of a component that had to be merged with
 * someone else's changes: add their part to what this tab shows, keep undo
 * from reverting it, and say if we both changed the same field.
 *
 * Called once this save's own (optimistic) render is done. Only what the
 * merge changed is patched in, on top of the store's current data, so newer
 * local edits stay put.
 * @param {object} store
 * @param {string} uri
 * @param {object} sentData what this tab saved (and is showing)
 * @param {object} result from saveWithMerge
 * @returns {Promise}
 */
export function applySaveResult(store, uri, sentData, result) {
  if (!result || !result.merged) {
    return Promise.resolve(result);
  }

  const mergedFields = changedFields(sentData, result.data);

  if (!mergedFields.length) {
    setRev(uri, result.rev); // they changed nothing we don't already show
    notifyConflicts(store, uri, result.conflicts, result.by);

    return Promise.resolve(result);
  }

  // layouts can only be re-rendered from the page's server html
  const shown = isLayout(uri) ? showLayout(store, uri, result).then(() => notifyConflicts(store, uri, result.conflicts, result.by)) : showMerged(store, uri, sentData, result);

  return shown
    .catch((e) => {
      // the save itself worked: never treat a display problem as a failed
      // save. Re-read it shortly and show it then (never a reload)
      log.error(`Saved ${uri}, but could not show the merged result: ${e.message}`, { action: 'collab' });
      rereadSoon(uri);
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
    return Promise.resolve({
      data: result.data, paths, merged: false, rev: result.rev
    });
  }

  const allPaths = _.union(paths, changedFields(oldData, result.data));

  // page areas may now include components someone else added
  return ensureComponents(store, _.pick(result.data, allPaths))
    .catch(e => log.error(`Could not load components added by others: ${e.message}`, { action: 'collab' }))
    .then(() => ({
      data: result.data, paths: allPaths, merged: true, rev: result.rev
    }));
}
