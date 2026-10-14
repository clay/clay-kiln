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
  formBase: null // { uri, path, fields } snapshot taken when the current form opened
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
 * @param {boolean} [conditional=true] send the base revision (if known)
 * @returns {object}
 */
export function writeHeaders(uri, doc, conditional = true) {
  const headers = { 'X-Clay-Collab-Session': ctx.session },
    rev = getRev(uri);

  if (doc) {
    headers['X-Clay-Collab-Doc'] = doc;
  }

  if (conditional && _.isNumber(rev)) {
    headers['X-Clay-Rev'] = String(rev);
  }

  return headers;
}

/**
 * Track saves in flight, so a remote refresh doesn't land on top of one.
 * @param {string} uri
 * @param {number} delta +1 / -1
 */
export function trackSave(uri, delta) {
  const key = replaceVersion(uri),
    count = (ctx.saving[key] || 0) + delta;

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
