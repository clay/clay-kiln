import _ from 'lodash';
import { replaceVersion } from 'clayutils';

/**
 * Non-reactive collaboration state, kept out of Vuex on purpose: revisions and
 * form snapshots change on every save and don't drive any UI.
 */
const STORED_UNGUARDED = 'kiln-collab-unguarded', // localStorage, per site
  KEEP_UNGUARDED = 24 * 60 * 60 * 1000; // ms a stored report is worth sending

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
  epoch: null, // the server store's epoch (changes if it lost its data)
  gap: null, // the server store's gap (changes when saves may have gone around it)
  unverified: false, // this tab may have missed changes: it re-reads the page (see catchUp in remote.js)
  distrusts: 0, // how many times that happened (a save built before the latest one merges)
  syncsSinceDistrust: 0, // successful syncs since then (the feed gets a moment to say who changed what)
  unsure: {}, // uri -> true: couldn't be re-read or shown yet, re-read again soon
  missed: {}, // uri -> true: changed while this tab was reconnecting, by nobody it knows of
  unguarded: {}, // uri -> { doc, at } this tab's saves that went through without a revision, to report
  clock: 0, // ms the server's clock is ahead of this browser's (presence times are the server's)
  syncedAt: 0, // when this tab last heard who's here (its own clock)
  me: null, // this user's id as presence shows it (to tell their other tabs apart)
  tab: null // this tab's id as presence shows it
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
 * This tab may have missed changes: collaboration was interrupted, or saves
 * went around it. Until it has re-read the page, nothing it has is known to
 * be current, so it forgets the revisions it knows: saves then have the
 * server send what it has, and merge with it, instead of overwriting.
 */
export function distrust() {
  ctx.unverified = true;
  ctx.distrusts += 1;
  ctx.syncsSinceDistrust = 0;
  ctx.revs = {};
  ctx.successors = {};
}

/**
 * Re-read something soon (it couldn't be re-read, or shown, just now).
 * @param {string} uri
 */
export function rereadSoon(uri) {
  ctx.unsure[replaceVersion(uri)] = true;
}

/**
 * The server told us its current gap (in a sync, or a 412). If it changed,
 * saves may have gone around collaboration since this tab last looked.
 * @param {string} [gap]
 */
export function learnGap(gap) {
  if (gap && ctx.gap && gap !== ctx.gap) {
    distrust();
  }

  ctx.gap = gap || ctx.gap;
}

/**
 * One of this tab's saves came back without a revision: it went through while
 * the server couldn't check (or record) revisions, so others won't hear about
 * it, and this tab may not hear about theirs. Report it on the next sync (in
 * case the server that took it forgets), and re-read the page.
 * @param {string} uri
 * @param {string} [doc] page or layout it belongs to
 */
export function noteUnguarded(uri, doc) {
  const key = replaceVersion(uri);

  ctx.unguarded[key] = { doc: doc || null, at: Date.now() };
  storeUnguarded({ [key]: ctx.unguarded[key] }, []);
  distrust();
}

/**
 * @returns {string} where this site's unreported saves are kept in the browser
 */
function storageKey() {
  return `${STORED_UNGUARDED}:${_.get(ctx.store, 'state.site.prefix', '')}`;
}

/**
 * Unreported unguarded saves kept in the browser, so one isn't lost when the
 * tab closes before the server could be told (reported from the next page
 * the editor opens on this site). Recent ones only.
 * @returns {object} uri -> { doc, at }
 */
export function storedUnguarded() {
  try {
    return _.pickBy(JSON.parse(window.localStorage.getItem(storageKey()) || '{}'), entry => entry && Date.now() - entry.at < KEEP_UNGUARDED);
  } catch (e) {
    return {}; // storage blocked or broken: the tab's own list still works
  }
}

/**
 * Add and remove stored unreported saves (other tabs on this site share them).
 * @param {object} add uri -> { doc, at }
 * @param {string[]} remove uris the server has caught up on
 */
export function storeUnguarded(add, remove) {
  try {
    const stored = _.omit(_.assign(storedUnguarded(), add), remove);

    if (_.isEmpty(stored)) {
      window.localStorage.removeItem(storageKey());
    } else {
      window.localStorage.setItem(storageKey(), JSON.stringify(stored));
    }
  } catch (e) {
    // storage blocked: nothing to keep
  }
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

  if (ctx.gap) {
    // a revision learned before the server's current gap is treated as unknown
    headers['X-Clay-Collab-Gap'] = ctx.gap;
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
