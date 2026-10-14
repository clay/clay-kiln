import _ from 'lodash';
import { refProp } from '../utils/references';

/**
 * Three-way merging of component and page data.
 *
 * Kiln saves whole objects, so when two people edit the same component the
 * second save would silently undo the first. These helpers combine "what I
 * started from" (base), "what I want to save" (mine) and "what's on the server
 * now" (theirs) field by field:
 * - a field only I changed gets my value
 * - a field only they changed keeps theirs
 * - component lists (and page areas) merge item by item, so two people adding,
 *   removing or moving different components both keep their changes
 * - a field we both changed to different values is a conflict: mine wins (I'm
 *   the one saving now) and the caller can offer to restore theirs
 */

/**
 * The key that identifies an item of a mergeable list.
 * @param {*} item
 * @returns {string|null}
 */
function itemKey(item) {
  if (_.isString(item)) {
    return item;
  }

  return _.isPlainObject(item) && _.isString(item[refProp]) ? item[refProp] : null;
}

/**
 * True when every item of every list is identifiable (a uri string, or a
 * {_ref} object), so the lists can be merged item by item.
 * @param {...*} lists
 * @returns {boolean}
 */
export function isMergeableList(...lists) {
  return _.every(lists, list => list === undefined || list === null || _.isArray(list) && _.every(list, item => itemKey(item) !== null));
}

/**
 * Keys of a list, in order.
 * @param {array} list
 * @returns {string[]}
 */
function keysOf(list) {
  return _.map(list || [], itemKey);
}

/**
 * True when the items two lists share appear in the same relative order.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {boolean}
 */
function sameRelativeOrder(a, b) {
  const shared = _.intersection(a, b);

  return _.isEqual(_.filter(a, key => _.includes(shared, key)), _.filter(b, key => _.includes(shared, key)));
}

/**
 * Merge two edits of an ordered list of components (or page-area uris).
 * Their list is the starting point; my removals, additions and (if they
 * didn't also reorder) my reordering are applied on top.
 * @param {array} base
 * @param {array} mine
 * @param {array} theirs
 * @returns {{list: array, conflict: boolean}} conflict is true when we both reordered
 */
export function mergeList(base, mine, theirs) {
  const baseKeys = keysOf(base),
    mineKeys = keysOf(mine),
    theirKeys = keysOf(theirs),
    removedByMe = _.difference(baseKeys, mineKeys),
    addedByMe = _.difference(mineKeys, baseKeys),
    iReordered = !sameRelativeOrder(baseKeys, mineKeys),
    theyReordered = !sameRelativeOrder(baseKeys, theirKeys);

  let list = _.filter(theirs || [], item => !_.includes(removedByMe, itemKey(item)));

  // my reordering, applied to the items we both still have: the slots they
  // occupy in their list stay put, but get filled in my order
  if (iReordered && !theyReordered) {
    const resultKeys = keysOf(list),
      mineOrder = _.filter(mineKeys, key => _.includes(resultKeys, key)),
      slots = _.reduce(resultKeys, (acc, key, i) => _.includes(mineOrder, key) ? acc.concat(i) : acc, []),
      byKey = _.keyBy(list, itemKey);

    list = list.slice();
    _.each(slots, (slot, i) => { list[slot] = byKey[mineOrder[i]]; });
  }

  // my additions go right after the item that precedes them in my list
  _.each(addedByMe, (key) => {
    const index = _.indexOf(mineKeys, key),
      currentKeys = keysOf(list);
    let insertAt = 0;

    if (_.includes(currentKeys, key)) {
      return; // they added the same thing
    }

    for (let i = index - 1; i >= 0; i--) {
      const position = _.indexOf(currentKeys, mineKeys[i]);

      if (position > -1) {
        insertAt = position + 1;
        break;
      }
    }

    list = list.slice(0, insertAt).concat([mine[index]], list.slice(insertAt));
  });

  return { list, conflict: iReordered && theyReordered && !_.isEqual(mineKeys, theirKeys) };
}

/**
 * Merge my changes to some fields of a component (or page) into what's on the
 * server now.
 * @param {object} options
 * @param {object} options.base data my edit started from
 * @param {object} options.mine data I'm saving
 * @param {object} options.theirs data on the server now
 * @param {string[]} [options.paths] top-level fields I changed (defaults to every field that differs from base)
 * @returns {{data: object, conflicts: object[]}} conflicts: [{ path, mine, theirs }] for fields we both changed (mine was kept)
 */
export function mergeData({
  base, mine, theirs, paths
}) {
  const original = base || {},
    current = theirs || {},
    changed = paths || _.filter(_.union(_.keys(original), _.keys(mine)), key => !_.isEqual(original[key], mine[key])),
    data = _.assign({}, current),
    conflicts = [];

  _.each(changed, (path) => {
    const b = original[path],
      m = mine[path],
      t = current[path];

    if (_.isEqual(t, b) || _.isEqual(t, m)) {
      // they didn't touch it (or made the same change): mine
      assignOrDelete(data, path, m);
    } else if (_.isEqual(m, b)) {
      // I didn't actually change it: theirs (already in data)
    } else if (_.isArray(m) && _.isArray(t) && isMergeableList(b, m, t)) {
      const merged = mergeList(b || [], m, t);

      data[path] = merged.list;
      if (merged.conflict) {
        conflicts.push({
          path, mine: m, theirs: t, merged: true
        });
      }
    } else {
      assignOrDelete(data, path, m);
      conflicts.push({ path, mine: m, theirs: t });
    }
  });

  return { data, conflicts };
}

/**
 * @param {object} obj
 * @param {string} key
 * @param {*} value undefined deletes the key
 */
function assignOrDelete(obj, key, value) {
  if (value === undefined) {
    delete obj[key];
  } else {
    obj[key] = value;
  }
}

/**
 * Top-level fields whose value differs between two objects.
 * @param {object} a
 * @param {object} b
 * @returns {string[]}
 */
export function changedFields(a, b) {
  const left = a || {},
    right = b || {};

  return _.filter(_.union(_.keys(left), _.keys(right)), key => !_.isEqual(_.toPlainObject(left)[key], _.toPlainObject(right)[key]));
}
