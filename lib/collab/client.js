import _ from 'lodash';
import { uriToUrl } from '../utils/urls';
import { userHeader } from '../utils/references';
import logger from '../utils/log';
import ctx, { setRev, getRev } from './context';
import { handleEvents, flushPending } from './remote';
import { componentLabel, editors } from './presence';
import { rememberFormBase, forgetFormBase } from './forms';
import {
  COLLAB_START, COLLAB_SYNCED, COLLAB_SYNC_FAILED, COLLAB_STOP
} from './mutationTypes';

const log = logger(__filename),
  SESSION_KEY = 'kiln-collab-session',
  IDLE_AFTER = 5 * 60 * 1000, // no input for 5 minutes: shown as idle, polled slowly
  TYPING_FOR = 3000, // "typing" lasts this long after the last keystroke
  SOON = 150, // ms to wait before syncing after focus changes (batches bursts)
  MAX_BACKOFF = 10000, // keep retrying at least this often after failures
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
  joined = false,
  seenUsers = {};

/**
 * Stable id for this tab (survives reloads, so a reload doesn't show you twice).
 * @returns {string}
 */
function getSessionId() {
  let id = null;

  try {
    id = window.sessionStorage.getItem(SESSION_KEY);
  } catch (e) {
    // storage blocked: fall through to a fresh id
  }

  if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    const bytes = new Uint8Array(12);

    window.crypto.getRandomValues(bytes);
    id = _.map(bytes, byte => `0${byte.toString(16)}`.slice(-2)).join('');

    try {
      window.sessionStorage.setItem(SESSION_KEY, id);
    } catch (e) {
      // ignore
    }
  }

  return id;
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
 * the first sync.
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
 * its revision, and the refresh will set both.
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
 * @param {object} store
 * @param {object} body sync response
 */
function applySync(store, body) {
  if (body.revs) {
    learnRevisions(body.revs, body.events);
  }

  ctx.cursor = Math.max(ctx.cursor, body.cursor || 0);
  _.assign(ctx.config, _.pick(body, ['pollInterval', 'hiddenPollInterval']));
  store.commit(COLLAB_SYNCED, {
    others: _.reject(body.presence, { session: ctx.session }),
    now: body.now
  });
  announceArrivals(store);
  joined = true;
  handleEvents(store, body.events || []);
}

/**
 * One round trip: heartbeat + presence + changes since the last one.
 * @returns {Promise}
 */
export function sync() {
  const store = ctx.store;

  clearTimeout(timer);

  if (!ctx.active) {
    return Promise.resolve();
  }

  if (inFlight) {
    syncAgain = true;
    return Promise.resolve();
  }

  inFlight = true;

  return window.fetch(endpoint('sync'), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', [userHeader]: _.get(store, 'state.user.username') },
    body: JSON.stringify({
      page: ctx.page,
      session: ctx.session,
      docs: _.compact([ctx.layout]),
      cursor: ctx.cursor,
      focus: currentFocus(),
      state: activityState(),
      uris: joined ? undefined : pageUris()
    })
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`sync returned ${res.status}`);
      }

      return res.json();
    })
    .then(body => applySync(store, body))
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
 */
function watchStore(store) {
  store.subscribe((mutation, state) => {
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

  document.addEventListener('mousemove', markActive, options);
  document.addEventListener('keydown', markActive, options);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastInput = Date.now();
    }
    syncSoon();
  });
  window.addEventListener('pagehide', leave);
  window.addEventListener('online', syncSoon);
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
    session: getSessionId(),
    page: store.state.page.uri,
    layout: _.get(store, 'state.layout.uri') || null,
    cursor: config.cursor || 0,
    revs: {},
    recentEdits: {},
    successors: {}
  });

  store.commit(COLLAB_START, { session: ctx.session });
  watchStore(store);
  watchWindow();
  sync();

  return true;
}

/**
 * Stop (tests, or if kiln is torn down).
 */
export function stop() {
  clearTimeout(timer);
  leave();
  if (ctx.store) {
    ctx.store.commit(COLLAB_STOP);
  }
  _.assign(ctx, { active: false, store: null });
  joined = false;
  seenUsers = {};
}
