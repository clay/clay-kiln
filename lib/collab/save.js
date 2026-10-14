import _ from 'lodash';
import { saveWithRevision } from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';
import ctx, { setRev, writeHeaders, trackSave } from './context';
import { mergeData, changedFields } from './merge';

// a 412 means someone saved in between; merge onto their version and retry.
// More than a few in a row means something's wrong, so give up like any
// other failed save.
const MAX_ATTEMPTS = 4;

/**
 * Read the 412 body: the current revision and data on the server.
 * @param {Error} err
 * @returns {Promise<object|null>} null when it isn't a revision conflict
 */
function readConflict(err) {
  const res = err && err.response;

  if (!res || res.status !== 412 || typeof res.json !== 'function') {
    return Promise.resolve(null);
  }

  return res.json().catch(() => null);
}

/**
 * PUT with the base revision, merging and retrying on 412.
 * Runs as a single queued task, so nothing else saves in between attempts.
 * @param {string} uri
 * @param {object} data what we want saved
 * @param {object} options
 * @param {object} options.base data our edit started from
 * @param {string[]} options.paths fields we changed
 * @param {boolean} options.hooks run server-side model hooks
 * @param {string} options.doc page/layout the change belongs to
 * @returns {Promise<{data: object, merged: boolean, conflicts: object[], theirs: object|null}>}
 */
function saveRevisionTask(uri, data, {
  base, paths, hooks, doc
}) {
  let conflicts = [],
    theirs = null;

  function attempt(toSave, toBase, toPaths, count) {
    return saveWithRevision(uri, toSave, hooks, writeHeaders(uri, doc))
      .then(({ rev }) => {
        setRev(uri, rev);

        return {
          data: toSave, merged: count > 0, conflicts, theirs
        };
      })
      .catch(err => readConflict(err).then((conflict) => {
        if (!conflict || count + 1 >= MAX_ATTEMPTS) {
          throw err;
        }

        setRev(uri, conflict.rev);

        if (!_.isPlainObject(conflict.data)) {
          // nothing readable on the server (e.g. it was deleted): just save ours
          return attempt(toSave, toBase, toPaths, count + 1);
        }

        const merge = mergeData({
          base: toBase, mine: toSave, theirs: conflict.data, paths: toPaths
        });

        theirs = conflict.data;
        conflicts = conflicts.concat(merge.conflicts);

        // next round: our merged result, based on what's on the server now
        return attempt(merge.data, theirs, changedFields(theirs, merge.data), count + 1);
      }));
  }

  return attempt(data, base, paths, 0);
}

/**
 * Save data for a component, layout or page with a revision check, through
 * kiln's save queue.
 * @param {object} options
 * @param {string} options.uri
 * @param {object} options.data full data to save
 * @param {object} options.base data the edit started from
 * @param {string[]} options.paths top-level fields the edit changed
 * @param {boolean} options.hooks
 * @param {string} options.doc
 * @returns {Promise<{data: object, merged: boolean, conflicts: object[], theirs: object|null}>}
 */
export function saveWithMerge({
  uri, data, base, paths, hooks, doc
}) {
  trackSave(uri, 1);

  return addToQueue(saveRevisionTask, [uri, data, {
    base: _.cloneDeep(base), paths, hooks, doc
  }], 'save')
    .then((result) => {
      trackSave(uri, -1);

      return result;
    }, (err) => {
      trackSave(uri, -1);
      throw err;
    });
}

/**
 * Fields the other editor changed (relative to what we started from) that
 * survived the merge: used to keep undo history from reverting their work.
 * @param {object} base
 * @param {object} theirs
 * @param {object[]} conflicts
 * @returns {string[]}
 */
export function theirChanges(base, theirs, conflicts) {
  const conflicted = _.map(conflicts, 'path');

  return _.reject(changedFields(base, theirs), path => _.includes(conflicted, path));
}

// exported for tests
export { saveRevisionTask, MAX_ATTEMPTS, ctx };
