import _ from 'lodash';
import { saveWithRevision } from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';
import ctx, {
  getRev, setRev, writeHeaders, trackSave, cleanSuccessor, recordCleanSave, noteUnguarded, learnGap
} from './context';
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
 * The revision to send with a save.
 *
 * A save is checked against the revision of the data it was built from. If
 * that revision was then moved on only by this tab's own earlier saves (which
 * this save's data already includes, since kiln applies component saves to
 * the store right away), the save is based on the newest of those instead: no
 * needless round trip. Anything else in between (someone else's save, or one
 * of ours that had to be merged) means the server has data this save doesn't
 * know about, so it goes out on its original revision and gets merged.
 * @param {string} uri
 * @param {number|undefined} baseRev
 * @param {boolean} optimistic the save's data includes this tab's earlier saves
 * @returns {number|undefined}
 */
function startingRev(uri, baseRev, optimistic) {
  let rev = baseRev;

  while (optimistic && _.isNumber(rev) && _.isNumber(cleanSuccessor(uri, rev))) {
    rev = cleanSuccessor(uri, rev);
  }

  return rev;
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
 * @param {number} [options.baseRev] revision of the data the edit started from
 * @param {boolean} [options.optimistic] see startingRev
 * @param {function} [options.prepare] runs on merged data before it's saved
 * @param {number} [options.distrusts] ctx.distrusts when the save was made
 * @returns {Promise<{data: object, merged: boolean, conflicts: object[], theirs: object|null, rev: number}>}
 */
function saveRevisionTask(uri, data, {
  base, paths, hooks, doc, baseRev, optimistic, prepare, distrusts
}) {
  // the tab found out it may have missed changes after this save's data was
  // built: its revision can't be trusted, so merge with the server's copy
  const start = _.isNumber(distrusts) && distrusts !== ctx.distrusts ? undefined : startingRev(uri, baseRev, optimistic);
  let conflicts = [],
    theirs = null;

  function attempt(toSave, {
    toBase, toPaths, rev, count
  }) {
    return saveWithRevision(uri, toSave, hooks, writeHeaders(uri, doc, rev))
      .then((res) => {
        if (!_.isNumber(res.rev)) {
          // saved, but the server couldn't check or record revisions
          noteUnguarded(uri, doc);
        }

        if (count === 0) {
          // the server now has exactly what this save had
          recordCleanSave(uri, start, res.rev);
          if (!_.isNumber(getRev(uri)) || getRev(uri) === start) {
            setRev(uri, res.rev);
          }
        }

        return {
          data: toSave, merged: count > 0, conflicts, theirs, rev: res.rev
        };
      })
      .catch(err => readConflict(err).then((conflict) => {
        if (!conflict || count + 1 >= MAX_ATTEMPTS) {
          throw err;
        }

        // saves may have gone around collaboration: this merge is against
        // the server's current data, and the rest of the page gets re-read
        learnGap(conflict.gap);

        if (conflict.missing || !_.isPlainObject(conflict.data)) {
          // nothing saved there (it was never saved, or was deleted): just save ours
          return attempt(toSave, {
            toBase, toPaths, rev: conflict.rev, count: count + 1
          });
        }

        const merge = mergeData({
          base: toBase, mine: toSave, theirs: conflict.data, paths: toPaths
        });

        theirs = conflict.data;
        conflicts = conflicts.concat(merge.conflicts);

        // next round: our merged result, based on what's on the server now. The
        // component's model.save runs again on it, so fields it derives (from
        // either person's changes) stay consistent
        return Promise.resolve(prepare ? prepare(merge.data) : merge.data).then(merged => attempt(merged, {
          toBase: theirs, toPaths: changedFields(theirs, merged), rev: conflict.rev, count: count + 1
        }));
      }));
  }

  return attempt(data, {
    toBase: base, toPaths: paths, rev: start, count: 0
  });
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
 * @param {number} [options.baseRev] revision of `base` (read it when the save's data is built)
 * @param {boolean} [options.optimistic] kiln already applied this save locally (component saves)
 * @param {function} [options.prepare] runs on merged data before it's saved (the component's model.save)
 * @returns {Promise<{data: object, merged: boolean, conflicts: object[], theirs: object|null, rev: number}>}
 */
export function saveWithMerge({
  uri, data, base, paths, hooks, doc, baseRev, optimistic, prepare
}) {
  trackSave(uri, 1);

  return addToQueue(saveRevisionTask, [uri, data, {
    base: _.cloneDeep(base), paths, hooks, doc, baseRev, optimistic: !!optimistic, prepare, distrusts: ctx.distrusts
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
