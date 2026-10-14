import _ from 'lodash';
import { replaceVersion } from 'clayutils';

/**
 * Non-reactive collaboration state, kept out of Vuex on purpose: revisions and
 * form snapshots change on every save and don't drive any UI.
 */
const ctx = {
  active: false,
  store: null,
  config: null, // locals.collaboration from amphora
  session: null, // this tab
  page: null, // page uri
  layout: null, // layout uri
  cursor: 0, // last feed event this tab has seen
  revs: {}, // uri -> revision the store's data is based on
  saving: {}, // uri -> number of saves in flight
  formBase: null, // { uri, path, fields } snapshot taken when the current form opened
  recentEdits: {}, // uri -> when this tab last changed it in a form
  successors: {}, // uri -> { rev: next rev } for this tab's own saves that needed no merge
  known: {}, // uris that exist on the server (loaded with the page, or fetched since)
  writes: {}, // uri -> count of this tab's saves so far (a refresh can tell if one happened meanwhile)
  epoch: null // the server store's epoch (changes if it lost its data)
};

export default ctx;

/**
 * Is real-time collaboration running on this page?
 * @returns {boolean}
 */
export function isActive() {
  return ctx.active;
}

/**
 * @param {string} uri
 * @returns {number|undefined}
 */
export function getRev(uri) {
  return ctx.revs[replaceVersion(uri)];
}

/**
 * Remember the revision of data we just read or wrote.
 * @param {string} uri
 * @param {number|null|undefined} rev
 */
export function setRev(uri, rev) {
  if (_.isNumber(rev) && !_.isNaN(rev)) {
    ctx.revs[replaceVersion(uri)] = rev;
  }
}

/**
 * Move a revision forward only (a refresh can come back after a newer save).
 * @param {string} uri
 * @param {number|null|undefined} rev
 */
export function advanceRev(uri, rev) {
  const known = getRev(uri);

  if (_.isNumber(rev) && !_.isNaN(rev) && (!_.isNumber(known) || rev > known)) {
    setRev(uri, rev);
  }
}

/**
 * Note that a uri exists on the server.
 * @param {string} uri
 */
export function markKnown(uri) {
  ctx.known[replaceVersion(uri)] = true;
}

/**
 * Remember a revision from the change feed, unless we already know a newer one.
 * @param {string} uri
 * @param {number} rev
 * @returns {boolean} true if this is news to us
 */
export function learnRev(uri, rev) {
  const known = getRev(uri);

  if (!_.isNumber(rev) || _.isNumber(known) && known >= rev) {
    return false;
  }

  setRev(uri, rev);

  return true;
}

/**
 * The page or layout a component's changes belong to.
 * @param {boolean} isPageSpecific
 * @returns {string}
 */
export function docFor(isPageSpecific) {
  return isPageSpecific || !ctx.layout ? ctx.page : ctx.layout;
}

/**
 * Headers that tell amphora who's writing, what it belongs to, and which
 * revision the change is based on.
 * @param {string} uri
 * @param {string} [doc]
 * @param {number} [rev] base revision (omitted: unconditional write)
 * @returns {object}
 */
export function writeHeaders(uri, doc, rev) {
  const headers = { 'X-Clay-Collab-Session': ctx.session };

  if (doc) {
    headers['X-Clay-Collab-Doc'] = doc;
  }

  if (_.isNumber(rev)) {
    headers['X-Clay-Rev'] = String(rev);
  } else if (ctx.known[replaceVersion(uri)]) {
    // it exists but we don't know which revision our data is: have the server
    // send what it has, so the save merges instead of overwriting
    headers['X-Clay-Rev'] = '-1';
  }

  return headers;
}

/**
 * Record that one of this tab's saves moved a uri from one revision to the
 * next without merging anything in.
 * @param {string} uri
 * @param {number|undefined} from
 * @param {number|null} to
 */
export function recordCleanSave(uri, from, to) {
  const key = replaceVersion(uri);

  if (_.isNumber(from) && _.isNumber(to)) {
    ctx.successors[key] = _.assign({}, ctx.successors[key], { [from]: to });
  }
}

/**
 * @param {string} uri
 * @param {number} rev
 * @returns {number|undefined} the revision this tab's own clean save turned `rev` into
 */
export function cleanSuccessor(uri, rev) {
  return _.get(ctx.successors, [replaceVersion(uri), rev]);
}

/**
 * Track saves in flight, so a remote refresh doesn't land on top of one.
 * @param {string} uri
 * @param {number} delta +1 / -1
 */
export function trackSave(uri, delta) {
  const key = replaceVersion(uri),
    count = (ctx.saving[key] || 0) + delta;

  if (delta > 0) {
    ctx.writes[key] = (ctx.writes[key] || 0) + 1;
  }

  if (count > 0) {
    ctx.saving[key] = count;
  } else {
    delete ctx.saving[key];
  }
}

/**
 * @param {string} uri
 * @returns {boolean}
 */
export function isSaving(uri) {
  return !!ctx.saving[replaceVersion(uri)];
}

/**
 * How many saves of a uri this tab has started (to notice one during a refresh).
 * @param {string} uri
 * @returns {number}
 */
export function writeCount(uri) {
  return ctx.writes[replaceVersion(uri)] || 0;
}
