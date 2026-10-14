import _ from 'lodash';
import { uriToUrl } from '../utils/urls';
import { userHeader } from '../utils/references';
import logger from '../utils/log';
import ctx, { setRev, getRev, markKnown } from './context';
import { handleEvents, flushPending } from './remote';
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
  STALE_AFTER = 20 * 60 * 1000, // no successful sync for this long (laptop asleep): start over
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
  // revisions from the server are trusted once we know what the page loaded
  // corresponds to (the feed position it was rendered at)
  trustRevisions = true,
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
 * @param {object} store
 * @param {object} body sync response
 * @param {boolean} resyncing this sync re-learned revisions after a resync
 */
function applySync(store, body, resyncing) {
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

  if (body.revs && resyncing) {
    handleEvents(store, eventsFromRevisions(body.revs));
  } else if (body.revs && trustRevisions) {
    learnRevisions(body.revs, body.events);
  }

  joined = true;
  handleEvents(store, body.events || []);
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
    uris: joined ? undefined : pageUris()
  };
}

/**
 * One round trip: heartbeat + presence + changes since the last one.
 * @returns {Promise}
 */
export function sync() {
  const store = ctx.store;
  let resyncing;

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

  return window.fetch(endpoint('sync'), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', [userHeader]: _.get(store, 'state.user.username') },
    body: JSON.stringify(syncBody())
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`sync returned ${res.status}`);
      }

      return res.json();
    })
    .then((body) => {
      applySync(store, body, resyncing);
      lastSuccess = Date.now();
    })
    .catch((err) => {
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
    // null when the server couldn't tell where the page was rendered: then the
    // first sync's revisions aren't trusted (saves merge with the server's data)
    cursor: _.isNumber(config.cursor) ? config.cursor : null,
    epoch: null,
    revs: {},
    recentEdits: {},
    successors: {},
    known: {},
    writes: {}
  });
  trustRevisions = _.isNumber(config.cursor);
  joined = false;
  lastSuccess = null;
  seenUsers = {};

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
