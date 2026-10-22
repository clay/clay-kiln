import _ from 'lodash';
import ctx from './context';
import { componentLabel } from './presence';
import { fieldsEditedInForm } from './forms';
import { refreshNow } from './remote';
import { COLLAB_CLAIM } from './mutationTypes';

/**
 * One person per field. Whoever has a field open and is working on it keeps
 * it: nobody else can open it ("Grace Hopper is editing this"). Once they've
 * gone quiet (no changes for a minute, tab in the background, idle, or their
 * tab stopped checking in), someone else can take it over. Taking over is a
 * request, not a grab: the newcomer's tab asks for the field in its presence
 * (a `claim`), the holder's own tab saves what they typed, closes the form and
 * tells them who took over, and only then (or after a short wait, if the
 * holder's tab doesn't answer) does the newcomer's form open, with the
 * holder's changes in it. Different fields of the same component are never
 * locked: they merge.
 *
 * Nothing here can block editing when presence can't be read (collaboration
 * reconnecting, or this tab hasn't heard from the server lately): then forms
 * open as they would without collaboration, and saves still merge.
 */

const TAKEOVER_AFTER = 60000, // ms without changes before someone else can take a field over (amphora's takeoverAfter)
  AWAY_AFTER = 15000, // a tab that hasn't checked in for this long (asleep, offline) isn't holding anything
  RELEASE_WAIT = 10000, // ms to wait for whoever has it open to save and close it
  OLD_VIEW = 30000, // this tab's own view of who's here is too old to stop anyone
  NOTICE_MS = 8000;

let pendingOpen = null, // opens the claimed form once it's free
  claimTimer = null,
  claims = 0,
  yielding = null, // the form this tab is handing over
  declined = null, // a hand-over the form wouldn't allow (validation): don't keep trying
  noticeCleanup = null;

/**
 * @returns {number} ms
 */
export function takeoverAfter() {
  return _.get(ctx.config, 'takeoverAfter') || TAKEOVER_AFTER;
}

/**
 * The server's clock, as best this tab can tell (presence times are the server's).
 * @returns {number}
 */
function serverNow() {
  return Date.now() + (ctx.clock || 0);
}

/**
 * Do these overlap? Same component, and the same field (or a form for the
 * whole component on either side).
 * @param {object} [focus] { uri, path }
 * @param {string} uri
 * @param {string} [path]
 * @returns {boolean}
 */
export function overlaps(focus, uri, path) {
  return !!focus && focus.uri === uri && (!path || !focus.path || focus.path === path);
}

/**
 * Has this tab stopped checking in (asleep, offline, closed without saying)?
 * @param {object} entry presence entry
 * @param {number} now server time
 * @returns {boolean}
 */
function isAway(entry, now) {
  return _.isNumber(entry.seen) && now - entry.seen > AWAY_AFTER;
}

/**
 * Has whoever has this open gone quiet, so someone else may take it over?
 * Not while they're typing, changed it recently, or are asking for it
 * themselves. Yes once their tab stopped checking in, is in the background,
 * or idle. If the server doesn't say how long it's been (an older amphora),
 * yes: never block on what can't be told.
 * @param {object} entry presence entry { focus, state, seen }
 * @param {number} [now] server time
 * @returns {boolean}
 */
export function isQuiet(entry, now = serverNow()) {
  const focus = entry.focus || {},
    since = _.isNumber(entry.seen) ? Math.max(0, now - entry.seen) : 0;

  if (isAway(entry, now)) {
    return true;
  }

  if (focus.claim) {
    return false;
  }

  if (entry.state === 'hidden' || entry.state === 'idle') {
    return true;
  }

  if (focus.typing) {
    return false;
  }

  return !_.isNumber(focus.quiet) || focus.quiet + since >= takeoverAfter();
}

/**
 * @param {object} entry
 * @returns {boolean} the entry is one of this user's other tabs
 */
function isMine(entry) {
  return !!ctx.me && _.get(entry, 'user.id') === ctx.me;
}

/**
 * Can this tab trust what it knows about who has what open?
 * @param {object} store
 * @returns {boolean}
 */
function canTell(store) {
  return !!_.get(store, 'state.collab.connected') && Date.now() - (ctx.syncedAt || 0) < OLD_VIEW;
}

/**
 * Other tabs with a form open where this one wants to open one (not tabs
 * that are only asking for it).
 * @param {object} store
 * @param {string} uri
 * @param {string} [path]
 * @returns {object[]}
 */
function holdersOf(store, uri, path) {
  return _.filter(_.get(store, 'state.collab.others', []), entry => overlaps(entry.focus, uri, path) && !entry.focus.claim);
}

/**
 * Someone else asking for the same field (about to edit it).
 * @param {object} store
 * @param {string} uri
 * @param {string} [path]
 * @param {number} now
 * @returns {object[]}
 */
function claimsOn(store, uri, path, now) {
  return _.filter(_.get(store, 'state.collab.others', []), entry => overlaps(entry.focus, uri, path) && entry.focus.claim
    && !isAway(entry, now) && !isMine(entry));
}

/**
 * Someone else asking for the field this tab asked for, ahead of it (two
 * people taking over at once: the lower tab id goes first).
 * @param {object} store
 * @param {object} claim
 * @param {number} now
 * @returns {object|undefined}
 */
function rivalClaim(store, claim, now) {
  return _.find(claimsOn(store, claim.uri, claim.path, now), entry => !!ctx.tab && entry.tab < ctx.tab);
}

/**
 * Can this tab open a form at uri/path?
 * @param {object} store
 * @param {string} uri
 * @param {string} [path]
 * @returns {object|null} null: go ahead. Otherwise { uri, path, holder, busy, away, own }: busy, someone is
 *   working on it (nobody else can open it); not busy, it's open somewhere but quiet (it can be taken over).
 *   `away`: everyone who has it open stopped checking in. `own`: it's this user's other tab.
 */
export function lockFor(store, uri, path) {
  const now = serverNow(),
    holders = canTell(store) ? holdersOf(store, uri, path) : [],
    others = _.reject(holders, isMine),
    busy = _.find(others, entry => !isQuiet(entry, now)) || (canTell(store) ? _.head(claimsOn(store, uri, path, now)) : null);

  if (!holders.length && !busy) {
    return null;
  }

  return {
    uri,
    path: path || null,
    holder: busy || _.head(others) || _.head(holders),
    busy: !!busy,
    away: _.every(holders, entry => isAway(entry, now)),
    own: !others.length && !busy
  };
}

/**
 * What to say when a field is taken.
 * @param {object} lock from lockFor
 * @returns {string}
 */
export function busyText(lock) {
  return `${lock.holder.user.name} is editing this`;
}

/**
 * The dialog offering to take over a field someone has open but has gone quiet on.
 * @param {object} lock from lockFor
 * @returns {object} openConfirm config
 */
export function takeoverDialog(lock) {
  const name = lock.holder.user.name,
    what = _.get(lock.holder, 'focus.label') || componentLabel(lock.uri);

  if (lock.own) {
    return {
      title: 'You have this open in another tab',
      text: `Open ${what} here instead? Anything you typed in the other tab is saved first.`,
      button: 'Open here',
      type: 'primary'
    };
  }

  if (lock.away) {
    return {
      title: `${name} has this open`,
      text: `${name} has ${what} open but isn't connected right now. If you take over, anything they typed is saved once they're back, and they'll see that you took over.`,
      button: 'Take over',
      type: 'primary'
    };
  }

  return {
    title: `${name} has this open`,
    text: `${name} has ${what} open but ${lock.holder.state === 'active' ? 'hasn\'t changed it for a while' : 'has stepped away'}. If you take over, anything they typed is saved first, and they'll see that you took over.`,
    button: 'Take over',
    type: 'primary'
  };
}

/**
 * Stop asking for a field (it's open now, or this tab moved on).
 * @param {object} store
 */
export function dropClaim(store) {
  clearTimeout(claimTimer);
  claimTimer = null;
  pendingOpen = null;
  if (_.get(store, 'state.collab.claim')) {
    store.commit(COLLAB_CLAIM, null);
  }
}

/**
 * Open the claimed form: with the latest copy of the component (whoever had
 * it open has just saved), whether or not they answered.
 * @param {object} store
 * @param {number} id the claim
 */
function openClaimed(store, id) {
  const claim = _.get(store, 'state.collab.claim'),
    open = pendingOpen;

  if (!claim || claim.id !== id || !open) {
    return;
  }

  clearTimeout(claimTimer);
  claimTimer = null;
  pendingOpen = null; // once

  refreshNow(store, claim.uri, claim.by)
    .catch(_.noop) // couldn't re-read it: open what we have (saving merges)
    .then(() => {
      if (_.get(store, 'state.collab.claim.id') === id) {
        open();
        dropClaim(store);
      }
    });
}

/**
 * Take over a field someone else has open (after asking the user): close
 * whatever this tab has open, ask for the field, and open it once whoever had
 * it has saved and closed it (or didn't answer within a few seconds).
 * @param {object} store
 * @param {object} lock from lockFor
 * @param {function} open opens the form
 * @returns {Promise}
 */
export function takeOver(store, lock, open) {
  store = ctx.store || store; // actions pass their context: claims outlive it

  return store.dispatch('unfocus').then(() => {
    const id = ++claims;

    dropClaim(store);
    pendingOpen = open;
    store.commit(COLLAB_CLAIM, {
      id,
      uri: lock.uri,
      path: lock.path || null,
      label: componentLabel(lock.uri),
      by: { user: lock.holder.user },
      own: !!lock.own
    });
    // a tab that stopped checking in can't answer: don't wait for it
    claimTimer = setTimeout(() => openClaimed(store, id), lock.away ? 0 : RELEASE_WAIT);
  });
}

/**
 * After a sync: is the field this tab asked for free yet? Or is someone
 * working on it after all (they typed before they saw the request)?
 * @param {object} store
 */
function checkClaim(store) {
  const claim = _.get(store, 'state.collab.claim'),
    now = serverNow();

  if (!claim || !pendingOpen) {
    return;
  }

  const holders = holdersOf(store, claim.uri, claim.path),
    busy = _.find(_.reject(holders, isMine), entry => !isQuiet(entry, now)) || rivalClaim(store, claim, now);

  if (busy) {
    dropClaim(store);
    store.dispatch('showSnackbar', busyText({ holder: busy }));
  } else if (_.every(holders, entry => isAway(entry, now))) {
    openClaimed(store, claim.id); // they've closed it (or can't answer)
  }
}

/**
 * Say something once the user can see it (this tab may be in the background).
 * @param {object} store
 * @param {string} message
 */
function noticeWhenVisible(store, message) {
  const show = () => store.dispatch('showSnackbar', { message, duration: NOTICE_MS });

  if (noticeCleanup) {
    noticeCleanup();
  }

  if (!document.hidden) {
    show();
    return;
  }

  const onVisible = () => {
    if (!document.hidden) {
      noticeCleanup();
      show();
    }
  };

  document.addEventListener('visibilitychange', onVisible);
  noticeCleanup = () => {
    document.removeEventListener('visibilitychange', onVisible);
    noticeCleanup = null;
  };
}

/**
 * What to tell someone whose form was taken over (or handed over to someone
 * already editing it: both opened it at once, or this tab was away).
 * @param {object} asker presence entry of the other tab
 * @param {string} what label of the form
 * @param {boolean} saved this tab saved changes on the way out
 * @returns {string}
 */
export function takenOverText(asker, what, saved) {
  const asked = !!_.get(asker, 'focus.claim');

  if (isMine(asker)) {
    return `${asked ? `You opened ${what}` : `You're editing ${what}`} in another tab${saved ? ' — your changes here were saved' : ''}`;
  }

  return `${asked ? `${asker.user.name} took over ${what}` : `${asker.user.name} is editing ${what} now`}${saved ? ' — your changes were saved' : ''}`;
}

/**
 * Hand over what this tab has open: save it, close it, say who took over.
 * @param {object} store
 * @param {object} form state.ui.currentForm
 * @param {object} asker presence entry of the tab taking over
 */
function handOver(store, form, asker) {
  const what = componentLabel(form.uri),
    edited = fieldsEditedInForm(form).length > 0,
    key = `${asker.tab} ${form.uri} ${form.path}`;
  let failed = false;

  // a save that fails says so itself (with Retry): don't also say it was saved
  const stopWatching = store.subscribe((mutation) => {
    if (mutation.type === 'FINISH_PROGRESS' && mutation.payload === 'error') {
      failed = true;
    }
  });

  yielding = form;

  store.dispatch('unfocus').catch(_.noop).then(() => {
    const current = _.get(store, 'state.ui.currentForm');

    stopWatching();
    yielding = null;

    if (current && current.uri === form.uri && current.path === form.path) {
      declined = key; // the form wouldn't close (it isn't valid yet): they'll open it once it's free
      return;
    }

    if (!failed) {
      noticeWhenVisible(store, takenOverText(asker, what, edited));
    }
  });
}

/**
 * After a sync: if someone is asking for what this tab has open (or is
 * editing it right now, after both opened it at once or this tab was away),
 * and this user isn't working on it, hand it over.
 * @param {object} store
 * @param {boolean} quiet this user hasn't changed what they have open lately (or the tab is in the background, or idle)
 */
function yieldIfAsked(store, quiet) {
  const form = _.get(store, 'state.ui.currentForm'),
    now = serverNow();

  if (!form || !form.uri || yielding) {
    return;
  }

  const asker = _.find(_.get(store, 'state.collab.others', []), entry => overlaps(entry.focus, form.uri, form.path)
    && !isAway(entry, now) && (entry.focus.claim || !isQuiet(entry, now)));

  if (!asker || declined === `${asker.tab} ${form.uri} ${form.path}`) {
    return;
  }

  // this user's other tab: they're over there now. Someone else: only if this user has gone quiet
  if (isMine(asker) && asker.focus.claim || quiet) {
    handOver(store, form, asker);
  }
}

/**
 * Is this tab already asking for this field?
 * @param {object} store
 * @param {string} uri
 * @param {string} [path]
 * @returns {boolean}
 */
export function isClaiming(store, uri, path) {
  return overlaps(_.get(store, 'state.collab.claim'), uri, path);
}

/**
 * This tab's form closed: a hand-over it couldn't do before may work next time.
 */
export function formClosed() {
  declined = null;
}

/**
 * Called after every sync, once presence is up to date.
 * @param {object} store
 * @param {boolean} quiet see yieldIfAsked
 */
export function afterSync(store, quiet) {
  checkClaim(store);
  yieldIfAsked(store, quiet);
}

/**
 * Forget everything (collaboration starting or stopping).
 */
export function resetLocks() {
  clearTimeout(claimTimer);
  claimTimer = null;
  pendingOpen = null;
  yielding = null;
  declined = null;
  if (noticeCleanup) {
    noticeCleanup();
  }
}
