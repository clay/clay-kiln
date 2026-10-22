import _ from 'lodash';
import { uriToUrl } from '../utils/urls';
import { userHeader } from '../utils/references';
import logger from '../utils/log';
import ctx, {
  setRev, getRev, markKnown, distrust, learnGap, storedUnguarded, storeUnguarded
} from './context';
import { retryHeldSaves } from '../core-data/connection';
import { handleEvents, flushPending, catchUp } from './remote';
import { componentLabel, editors } from './presence';
import { rememberFormBase, forgetFormBase } from './forms';
import {
  COLLAB_START, COLLAB_SYNCED, COLLAB_SYNC_FAILED, COLLAB_STOP
} from './mutationTypes';

const log = logger(__filename),
  IDLE_AFTER = 5 * 60 * 1000, // no input for 5 minutes: shown as idle, polled slowly
  TYPING_FOR = 3000, // "typing" lasts this long after the last keystroke
  SOON = 150, // ms to wait before syncing after focus changes (batches bursts)
  MAX_BACKOFF = 10000, // keep retrying at least this often after failures
  RECONNECT_EVERY = 3000, // while the CMS can't be reached (offline, a gateway in the way): back as soon as it is
  STALE_AFTER = 20 * 60 * 1000, // no successful sync for this long (laptop asleep): start over
  CATCH_UP_SPACING = 30000, // re-read the page at most this often (a flapping server keeps asking)
  MAX_RETRY_DELAY = 5 * 60 * 1000, // re-reading what failed backs off to this
  MAX_REPORT = 100, // unguarded saves reported per sync
  DEFAULTS = {
    pollInterval: 2000, // others are here
    soloPollInterval: 4000, // nobody else is here
    hiddenPollInterval: 20000,
    idlePollInterval: 30000
  };

let timer = null,
  inFlight = false,
  syncAgain = false,
  typingTimer = null,
  lastInput = Date.now(),
  lastSuccess = null,
  joined = false,
  catchingUp = false,
  lastCatchUp = 0,
  lastRetry = 0,
  retries = 0,
  unreachable = false, // the last sync couldn't reach the CMS at all (not a server problem)
  seenUsers = {},
  cleanup = [];

/**
 * A new id for this tab. Not kept in sessionStorage: duplicated tabs copy it,
 * and two tabs sharing an id would each take the other's saves for their own.
 * @returns {string}
 */
function newSessionId() {
  const bytes = new Uint8Array(12);

  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    _.times(bytes.length, (i) => { bytes[i] = Math.floor(Math.random() * 256); });
  }

  return _.map(bytes, byte => `0${byte.toString(16)}`.slice(-2)).join('');
}

/**
 * @param {string} action 'sync' | 'leave'
 * @returns {string}
 */
function endpoint(action) {
  return uriToUrl(`${_.get(ctx.store, 'state.site.prefix')}${ctx.config.path || '/_collab'}/${action}`);
}

/**
 * What this tab is doing, for everyone else.
 * @returns {string} active | idle | hidden
 */
function activityState() {
  if (document.hidden) {
    return 'hidden';
  }

  return Date.now() - lastInput > IDLE_AFTER ? 'idle' : 'active';
}

/**
 * The form this tab has open, if any.
 * @returns {object|null}
 */
function currentFocus() {
  const focus = _.get(ctx.store, 'state.ui.currentFocus');

  if (!focus || !focus.uri) {
    return null;
  }

  return {
    uri: focus.uri,
    path: focus.path || null,
    label: componentLabel(focus.uri),
    typing: !!typingTimer
  };
}

/**
 * How long to wait before the next sync.
 * @returns {number} ms
 */
function nextDelay() {
  const intervals = _.assign({}, DEFAULTS, _.pick(ctx.config, _.keys(DEFAULTS))),
    failures = _.get(ctx.store, 'state.collab.failures', 0),
    state = activityState();

  if (failures && unreachable) {
    return RECONNECT_EVERY; // cheap to check, and editors want to be back right away
  }

  if (failures) {
    return Math.min(intervals.pollInterval * Math.pow(2, failures), MAX_BACKOFF);
  }

  if (state === 'hidden') {
    return intervals.hiddenPollInterval;
  }

  if (state === 'idle') {
    return intervals.idlePollInterval;
  }

  return _.get(ctx.store, 'state.collab.others.length') ? intervals.pollInterval : intervals.soloPollInterval;
}

/**
 * @param {number} ms
 */
function schedule(ms) {
  clearTimeout(timer);
  timer = setTimeout(sync, ms);
}

/**
 * Sync soon (focus changed, started typing, came back to the tab).
 */
export function syncSoon() {
  if (ctx.active) {
    schedule(SOON);
  }
}

/**
 * Every component, the page and the layout: their revisions come back with
 * the first sync (and after a resync).
 * @returns {string[]}
 */
function pageUris() {
  return _.compact(_.uniq(_.keys(_.pickBy(_.get(ctx.store, 'state.components', {}), data => !_.isEmpty(data))).concat([ctx.page, ctx.layout])));
}

/**
 * Tell people about editors who just arrived (not the ones already here when
 * we loaded: the presence bar shows those).
 * @param {object} store
 */
function announceArrivals(store) {
  _.each(editors(store), ({ user }) => {
    if (!seenUsers[user.id]) {
      seenUsers[user.id] = true;
      if (joined) {
        store.dispatch('showSnackbar', `${user.name} joined`);
      }
    }
  });
}

/**
 * Remember the revisions of what's on the page. A uri the feed says changed
 * since the page was rendered is left unknown: its data here is older than
 * its revision, and the refresh will set both (until then, saving it asks the
 * server for its data to merge).
 * @param {object} revs
 * @param {object[]} events
 */
function learnRevisions(revs, events) {
  const changed = _.map(events, 'uri');

  _.forOwn(revs, (rev, uri) => {
    if (!_.includes(changed, uri) && !_.isNumber(getRev(uri))) {
      setRev(uri, rev);
    }
  });
}

/**
 * After a resync: anything whose revision on the server is newer than what
 * this tab has gets refreshed, as if we'd seen its events.
 * @param {object} revs
 * @returns {object[]} synthetic save events
 */
function eventsFromRevisions(revs) {
  return _.reduce(revs, (events, rev, uri) => {
    const known = getRev(uri);

    return _.isNumber(known) && rev <= known ? events : events.concat({
      type: 'save', uri, rev, by: {}
    });
  }, []);
}

/**
 * Is it time to re-read the page, or what failed to re-read last time?
 * @returns {string[]|null|false} null: everything; a list: just those; false: not now
 */
function catchUpDue() {
  const now = Date.now(),
    unsure = _.keys(ctx.unsure);

  if (catchingUp) {
    return false;
  }

  if (ctx.unverified) {
    // one more sync first, so changes the feed can name come in that way
    // ("Updated by Ada"); then at most every CATCH_UP_SPACING
    return ctx.syncsSinceDistrust >= 2 && now - lastCatchUp >= CATCH_UP_SPACING ? null : false;
  }

  return unsure.length && now - lastRetry >= Math.min(CATCH_UP_SPACING * Math.pow(2, retries) / 2, MAX_RETRY_DELAY) ? unsure : false;
}

/**
 * Re-read the page if this tab may have missed changes, the way a reload
 * would, but in place: it never reloads, and never touches what the user has
 * open. Until it's done, saves merge with the server's copy. What it can't
 * re-read is tried again later (backing off).
 * @param {object} store
 */
function maybeCatchUp(store) {
  const only = catchUpDue(),
    distrusts = ctx.distrusts,
    attempted = only || _.keys(ctx.unsure);

  if (only === false) {
    return;
  }

  catchingUp = true;
  if (only) {
    lastRetry = Date.now();
  } else {
    lastCatchUp = Date.now();
  }

  catchUp(store, only || undefined).then(({ failed }) => {
    catchingUp = false;
    if (!only && distrusts === ctx.distrusts) {
      ctx.unverified = false; // nothing new went wrong meanwhile
    }

    ctx.unsure = _.assign(_.omit(ctx.unsure, attempted), _.zipObject(failed, _.map(failed, () => true)));
    retries = failed.length ? retries + 1 : 0;
    lastRetry = Date.now();
  });
}

/**
 * @param {object} store
 * @param {object} body sync response
 * @param {boolean} resyncing this sync re-learned revisions after a resync
 */
function applySync(store, body, resyncing) {
  learnGap(body.gap);
  ctx.syncsSinceDistrust += 1;
  ctx.epoch = body.epoch || ctx.epoch;
  ctx.cursor = body.resync ? body.cursor : Math.max(ctx.cursor, body.cursor || 0);
  _.assign(ctx.config, _.pick(body, ['pollInterval', 'hiddenPollInterval']));
  store.commit(COLLAB_SYNCED, {
    others: _.reject(body.presence, 'self'),
    now: body.now
  });
  announceArrivals(store);

  if (body.resync) {
    // the server can't give us what we missed: re-learn revisions next time
    joined = false;
    syncAgain = true;
    return;
  }

  // while unverified, revisions come from re-reading the page instead
  if (body.revs && resyncing && !ctx.unverified) {
    handleEvents(store, eventsFromRevisions(body.revs));
  } else if (body.revs && !ctx.unverified) {
    learnRevisions(body.revs, body.events);
  }

  joined = true;
  handleEvents(store, body.events || []);
  maybeCatchUp(store);
}

/**
 * The request body for a sync.
 * @returns {object}
 */
function syncBody() {
  return {
    page: ctx.page,
    session: ctx.session,
    docs: _.compact([ctx.layout]),
    cursor: _.isNumber(ctx.cursor) ? ctx.cursor : undefined,
    epoch: ctx.epoch || undefined,
    focus: currentFocus(),
    state: activityState(),
    uris: joined ? undefined : pageUris(),
    unguarded: _.isEmpty(ctx.unguarded) ? undefined : _.map(_.take(_.toPairs(ctx.unguarded), MAX_REPORT), ([uri, { doc }]) => ({ uri, doc }))
  };
}

/**
 * The server has caught up on the unguarded saves we reported: forget them
 * (unless one was saved without a revision again meanwhile).
 * @param {object} reported uri -> entry, as they were when sent
 */
function forgetReported(reported) {
  const done = _.filter(_.keys(reported), uri => ctx.unguarded[uri] === reported[uri]);

  _.each(done, (uri) => { delete ctx.unguarded[uri]; });
  if (done.length) {
    storeUnguarded({}, done);
  }
}

/**
 * One round trip: heartbeat + presence + changes since the last one.
 * @returns {Promise}
 */
export function sync() {
  const store = ctx.store;
  let resyncing,
    body,
    reported;

  clearTimeout(timer);

  if (!ctx.active) {
    return Promise.resolve();
  }

  if (inFlight) {
    syncAgain = true;
    return Promise.resolve();
  }

  if (lastSuccess && Date.now() - lastSuccess > STALE_AFTER) {
    joined = false; // been away too long to trust the feed: compare revisions
  }

  // re-learning revisions after the first join: anything newer gets refreshed
  resyncing = !joined && lastSuccess !== null;
  inFlight = true;
  body = syncBody();
  reported = _.pick(ctx.unguarded, _.map(body.unguarded, 'uri'));

  return window.fetch(endpoint('sync'), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', [userHeader]: _.get(store, 'state.user.username') },
    body: JSON.stringify(body)
  })
    .then((res) => {
      if (!res.ok) {
        throw _.assign(new Error(`sync returned ${res.status}`), { status: res.status });
      }

      return res.json();
    })
    .then((response) => {
      forgetReported(reported);
      applySync(store, response, resyncing);
      lastSuccess = Date.now();
      unreachable = false;
      if (_.get(store, 'state.ui.heldSaves')) {
        retryHeldSaves(); // the CMS can be reached again: send what's waiting
      }
    })
    .catch((err) => {
      // no answer, or a gateway / load balancer's: not a server problem
      unreachable = !err.status || err.status === 403 || err.status === 502 || err.status === 504;
      if (err.status === 503) {
        // the server can't reach its store: saves go through without revisions
        // and nobody hears about them, so re-read the page once it's back
        distrust();
      }
      store.commit(COLLAB_SYNC_FAILED);
      log.warn(`Collaboration sync failed: ${err.message}`, { action: 'collab' });
    })
    .then(() => {
      inFlight = false;
      schedule(syncAgain ? SOON : nextDelay());
      syncAgain = false;
    });
}

/**
 * Tell everyone we left (closing the tab, navigating away).
 */
function leave() {
  const payload = JSON.stringify({ page: ctx.page, session: ctx.session });

  if (!ctx.active) {
    return;
  }

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint('leave'), payload);
    }
  } catch (e) {
    // best effort: presence expires on its own anyway
  }
}

/**
 * Keep presence (focus, typing) and form snapshots in step with what the
 * user is doing.
 * @param {object} store
 * @returns {function} unsubscribe
 */
function watchStore(store) {
  return store.subscribe((mutation, state) => {
    switch (mutation.type) {
      case 'OPEN_FORM':
        rememberFormBase(state.ui.currentForm, _.get(state, ['components', mutation.payload.uri]));
        break;
      case 'CLOSE_FORM':
        forgetFormBase(null);
        _.defer(() => flushPending(store));
        syncSoon();
        break;
      case 'FOCUS':
      case 'UN_FOCUS':
        syncSoon();
        break;
      case 'UPDATE_FORMDATA':
        lastInput = Date.now();
        if (state.ui.currentForm) {
          ctx.recentEdits[state.ui.currentForm.uri] = lastInput;
        }
        if (!typingTimer) {
          syncSoon();
        }
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          typingTimer = null;
          syncSoon();
        }, TYPING_FOR);
        break;
      case 'HELD_SAVES':
        syncSoon(); // a held save went through (or one started waiting): check in
        break;
      case 'CURRENTLY_SAVING':
        if (mutation.payload === false) {
          _.defer(() => flushPending(store));
          if (_.get(state, 'collab.failures')) {
            syncSoon(); // saves are getting through, so try reconnecting now
          }
        }
        break;
      default:
    }
  });
}

/**
 * Listen to something until collaboration stops.
 * @param {EventTarget} target
 * @param {string} type
 * @param {function} handler
 * @param {object} [options]
 */
function listen(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  cleanup.push(() => target.removeEventListener(type, handler, options));
}

/**
 * Track input (for idle), visibility (for polling speed) and leaving.
 */
function watchWindow() {
  const markActive = _.throttle(() => {
      const wasIdle = activityState() === 'idle';

      lastInput = Date.now();
      if (wasIdle) {
        syncSoon();
      }
    }, 1000),
    options = { passive: true, capture: true };

  listen(document, 'mousemove', markActive, options);
  listen(document, 'keydown', markActive, options);
  listen(document, 'visibilitychange', () => {
    if (!document.hidden) {
      lastInput = Date.now();
    }
    syncSoon();
  });
  listen(window, 'pagehide', leave);
  listen(window, 'online', syncSoon);
  listen(window, 'focus', syncSoon); // e.g. back from reconnecting elsewhere
}

/**
 * Start collaborating on this page. Called once kiln has preloaded, and only
 * when amphora enabled collaboration for it (locals.collaboration).
 * @param {object} store
 * @returns {boolean} whether collaboration started
 */
export function start(store) {
  const config = _.get(store, 'state.locals.collaboration');

  if (ctx.active || !config || !config.enabled || !_.get(store, 'state.page.uri') || !window.fetch) {
    return false;
  }

  _.assign(ctx, {
    active: true,
    store,
    config: _.clone(config),
    session: newSessionId(),
    page: store.state.page.uri,
    layout: _.get(store, 'state.layout.uri') || null,
    // null when the server couldn't tell where the page was rendered (see below)
    cursor: _.isNumber(config.cursor) ? config.cursor : null,
    epoch: null,
    gap: config.gap || null,
    unverified: false,
    distrusts: 0,
    syncsSinceDistrust: 0,
    unsure: {},
    missed: {},
    unguarded: {},
    revs: {},
    recentEdits: {},
    successors: {},
    known: {},
    writes: {}
  });
  joined = false;
  lastSuccess = null;
  catchingUp = false;
  lastCatchUp = 0;
  lastRetry = 0;
  retries = 0;
  unreachable = false;
  seenUsers = {};
  // saves an earlier tab couldn't report before it closed
  ctx.unguarded = storedUnguarded();

  if (!_.isNumber(config.cursor)) {
    // rendered while the server couldn't reach its store: nobody can say what
    // changed since, so re-read the page once it's back
    distrust();
  }

  // everything the page loaded exists on the server
  _.each(pageUris(), markKnown);

  store.commit(COLLAB_START, { session: ctx.session });
  cleanup.push(watchStore(store));
  watchWindow();
  sync();

  return true;
}

/**
 * Stop (tests, or if kiln is torn down): leave, stop polling, stop listening.
 */
export function stop() {
  clearTimeout(timer);
  clearTimeout(typingTimer);
  typingTimer = null;
  leave();
  _.each(cleanup, fn => fn());
  cleanup = [];
  if (ctx.store) {
    ctx.store.commit(COLLAB_STOP);
  }
  _.assign(ctx, { active: false, store: null });
  joined = false;
  seenUsers = {};
}
