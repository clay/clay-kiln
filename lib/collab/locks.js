import _ from 'lodash';
import { isPage, isLayout } from 'clayutils';
import ctx, {
  markOutOfTouch, isOutOfTouch, backInTouch, AWAY_AFTER
} from './context';
import { componentLabel } from './presence';
import { fieldsEditedInForm } from './forms';
import { refreshNow, fetchLatest } from './remote';
import { withCopy } from './copy';
import { COLLAB_CLAIM } from './mutationTypes';
import { UN_FOCUS } from '../decorators/mutationTypes';

/**
 * One person per field. Whoever has a field open and is working on it keeps
 * it: nobody else can open it ("Grace Hopper is editing this"). Once they've
 * gone quiet (no changes for a minute, tab in the background, idle, or their
 * tab stopped checking in), someone else can take it over:
 *
 * - If their tab is around, taking over is a request, not a grab: the
 *   newcomer's tab asks for the field in its presence (a `claim`), the
 *   holder's own tab saves what they typed, closes the form and tells them
 *   who took over, and only then does the newcomer's form open, with the
 *   holder's changes in it.
 * - If their tab can't be reached and they have unsaved changes, the newcomer
 *   is told up front that their version replaces those changes (and asked
 *   again if a tab that seemed around doesn't answer). The newcomer's form
 *   opens right away, carrying the tabs it took over from (`over`).
 * - A tab that comes back to find its field taken over (named in someone's
 *   `over`, or open somewhere else after this tab was out of touch) closes its
 *   form without saving, and its user gets a copy of what they'd typed. Saves
 *   it made before it was out of touch never land on top of a newer change to
 *   the same field (save.js, preferTheirs), so a take-over never ends in "kept
 *   your version".
 *
 * Different fields of the same component are never locked: they merge.
 * Nothing here blocks editing when presence can't be read (collaboration
 * reconnecting, or this tab hasn't heard from the server lately): then forms
 * open as they would without collaboration, and saves still merge.
 */

const TAKEOVER_AFTER = 60000, // ms without changes before someone else can take a field over (amphora's takeoverAfter)
  OUT_OF_TOUCH_AFTER = 12000, // this tab counts itself away a little sooner than others would (AWAY_AFTER)
  RELEASE_WAIT = 10000, // ms to wait for whoever has it open to save and close it
  OLD_VIEW = 30000, // this tab's own view of who's here is too old to stop anyone
  NOTICE_MS = 8000;

let pendingOpen = null, // opens the claimed form once it's free
  claimTimer = null,
  claims = 0,
  asking = null, // the claim whose "isn't answering" question is up
  over = null, // { uri, path, tabs } the form this tab opened over tabs that didn't hand it over
  yielding = null, // the form this tab is handing over
  declined = null, // a hand-over the form wouldn't allow (validation): don't keep trying
  checked = null, // the change (uri + revision) this tab last checked its out-of-touch form against
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
 * @returns {object|null} null: go ahead. Otherwise { uri, path, holder, busy, away, unsaved, own }: busy, someone is
 *   working on it (nobody else can open it); not busy, it's open somewhere but quiet (it can be taken over).
 *   `away`: everyone who has it open stopped checking in. `unsaved`: they have changes they haven't saved.
 *   `own`: it's this user's other tab.
 */
export function lockFor(store, uri, path) {
  const now = serverNow(),
    holders = canTell(store) ? holdersOf(store, uri, path) : [],
    others = _.reject(holders, isMine),
    busy = _.find(others, entry => !isQuiet(entry, now)) || (canTell(store) ? _.head(claimsOn(store, uri, path, now)) : null),
    relevant = others.length ? others : holders;

  if (!holders.length && !busy) {
    return null;
  }

  return {
    uri,
    path: path || null,
    holder: busy || _.head(others) || _.head(holders),
    busy: !!busy,
    away: _.every(holders, entry => isAway(entry, now)),
    unsaved: _.some(relevant, 'focus.unsaved'),
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
    what = _.get(lock.holder, 'focus.label') || componentLabel(lock.uri),
    dialog = { title: `${name} has this open`, button: 'Take over', type: 'primary' };

  if (lock.own) {
    return _.assign(dialog, {
      title: 'You have this open in another tab',
      text: lock.away && lock.unsaved
        ? `Your other tab isn't connected and has unsaved changes in ${what}. If you open it here, this version replaces them.`
        : `Open ${what} here instead? Anything you typed in the other tab is saved first.`,
      button: 'Open here'
    });
  }

  if (lock.away) {
    return _.assign(dialog, {
      text: lock.unsaved
        ? `${name} isn't connected and has unsaved changes in ${what}. If you take over, your version replaces them.`
        : `${name} has ${what} open but isn't connected right now.`
    });
  }

  return _.assign(dialog, {
    text: `${name} has ${what} open but ${lock.holder.state === 'active' ? 'hasn\'t changed it for a while' : 'has stepped away'}. If you take over, ${lock.unsaved ? 'anything they typed is saved first, and ' : ''}they'll see that you took over.`
  });
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
 * Close the "isn't answering" question, if it's up for this claim (it was
 * answered some other way).
 * @param {object} store
 * @param {number} id
 */
function stopAsking(store, id) {
  if (asking === id) {
    asking = null;
    store.dispatch('closeConfirm');
  }
}

/**
 * Open the claimed form, with the latest copy of the component (whoever had
 * it open has just saved, if they could).
 * @param {object} store
 * @param {number} id the claim
 * @param {string[]} [tabs] tabs that still have it open: this form opens over them (they drop what they hadn't saved)
 */
function openClaimed(store, id, tabs) {
  const claim = _.get(store, 'state.collab.claim'),
    open = pendingOpen;

  if (!claim || claim.id !== id || !open) {
    return;
  }

  clearTimeout(claimTimer);
  claimTimer = null;
  pendingOpen = null; // once
  stopAsking(store, id);

  refreshNow(store, claim.uri, claim.by)
    .catch(_.noop) // couldn't re-read it: open what we have (saving merges)
    .then(() => {
      if (_.get(store, 'state.collab.claim.id') === id) {
        over = _.isEmpty(tabs) ? null : { uri: claim.uri, path: claim.path, tabs };
        open();
        dropClaim(store);
      }
    });
}

/**
 * The tab that seemed around didn't answer in time, and has unsaved changes:
 * ask before replacing them.
 * @param {object} store
 * @param {object} claim
 * @param {string[]} tabs tabs that still have it open
 */
function askAnyway(store, claim, tabs) {
  const name = _.get(claim, 'by.user.name'),
    id = claim.id;
  let shown = false,
    confirmed = false;

  const stop = store.subscribe((mutation) => {
    if (mutation.type === 'OPEN_CONFIRM') {
      shown = true;
    } else if (mutation.type === 'CLOSE_CONFIRM' && shown) {
      stop();
      // after the dialog has let go of the caret, and after its confirm handler ran
      setTimeout(() => {
        if (asking !== id) {
          return; // answered some other way (they let go after all, or started typing)
        }

        asking = null;
        if (confirmed) {
          openClaimed(store, id, tabs);
        } else {
          dropClaim(store);
        }
      }, 0);
    }
  });

  asking = id;
  store.dispatch('openConfirm', {
    title: claim.own ? 'Your other tab isn\'t answering' : `${name} isn't answering`,
    text: claim.own
      ? `Open ${claim.label} here anyway? This version will replace the unsaved changes in your other tab.`
      : `Take over ${claim.label} anyway? Your version will replace ${name}'s unsaved changes.`,
    button: claim.own ? 'Open here' : 'Take over',
    type: 'primary',
    onConfirm: () => { confirmed = true; }
  });
}

/**
 * Nobody handed the field over in time (or whoever has it can't be reached):
 * open it over them, after asking if they have unsaved changes the user
 * wasn't told about yet.
 * @param {object} store
 * @param {number} id the claim
 */
function timedOut(store, id) {
  const claim = _.get(store, 'state.collab.claim');

  if (!claim || claim.id !== id || !pendingOpen) {
    return;
  }

  const holding = holdersOf(store, claim.uri, claim.path),
    tabs = _.map(holding, 'tab');

  if (!claim.warned && _.some(holding, 'focus.unsaved')) {
    askAnyway(store, claim, tabs);
  } else {
    openClaimed(store, id, tabs);
  }
}

/**
 * Take over a field someone else has open (after asking the user): close
 * whatever this tab has open, ask for the field, and open it once whoever had
 * it has saved and closed it (or right away if they can't be reached).
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
      own: !!lock.own,
      warned: !!(lock.away && lock.unsaved) // the dialog already said their unsaved changes would be replaced
    });
    // a tab that stopped checking in can't answer: don't wait for it
    claimTimer = setTimeout(() => timedOut(store, id), lock.away ? 0 : RELEASE_WAIT);
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
    stopAsking(store, claim.id);
    dropClaim(store);
    store.dispatch('showSnackbar', busyText({ holder: busy }));
  } else if (!holders.length) {
    openClaimed(store, claim.id); // they saved it and let go
  }
}

/**
 * Say something once the user can see it (this tab may be in the background).
 * @param {object} store
 * @param {string|object} notice message, or showSnackbar config
 */
function noticeWhenVisible(store, notice) {
  const show = () => store.dispatch('showSnackbar', _.isString(notice) ? { message: notice, duration: NOTICE_MS } : notice);

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
 * What to tell someone whose unsaved changes were replaced: someone took the
 * field over while their tab couldn't be reached.
 * @param {object} other presence entry of the tab that has it now
 * @param {string} what label of the form
 * @returns {string}
 */
export function replacedText(other, what) {
  if (!_.get(other, 'user.name')) {
    return `${what} was changed while you were away`;
  }

  return isMine(other) ? `You opened ${what} in another tab` : `${other.user.name} took over ${what} while you were away`;
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
 * Someone took this field over while this tab couldn't be reached: close the
 * form without saving (their version stays), and offer the user a copy of
 * what they'd typed.
 * @param {object} store
 * @param {object} form state.ui.currentForm
 * @param {object} other presence entry of the tab that has it now
 */
function letGo(store, form, other) {
  const what = componentLabel(form.uri),
    edited = fieldsEditedInForm(form),
    typed = _.pick(_.toPlainObject(form.fields), edited);

  yielding = form;
  store.commit(UN_FOCUS);
  store.dispatch('closeForm', { discard: true }).catch(_.noop).then(() => {
    yielding = null;
    backInTouch(form.uri);
    noticeWhenVisible(store, edited.length ? withCopy(store, replacedText(other, what), typed) : takenOverText(other, what, false));
  });
}

/**
 * This tab's form was out of touch, and someone changed its component
 * meanwhile (the change waits for the form to close): if they changed a field
 * this user is editing, the form is stale. Let go of it (their version stays)
 * and offer a copy, rather than letting the user keep typing on old text.
 * @param {object} store
 * @param {object} form state.ui.currentForm
 * @param {object} pending state.collab.pending entry: { by, rev }
 */
function checkWhileAway(store, form, pending) {
  const edited = fieldsEditedInForm(form),
    base = ctx.formBase || {},
    startedFrom = key => _.has(base.fields, key) ? base.fields[key] : _.get(base.data, key);

  checked = `${form.uri} ${pending.rev}`;

  fetchLatest(form.uri).then((latest) => {
    const current = _.get(store, 'state.ui.currentForm'),
      theirs = _.filter(edited, key => !_.isEqual(_.toPlainObject(latest.data)[key], startedFrom(key)));

    if (theirs.length && current && current.uri === form.uri && current.path === form.path && !yielding) {
      letGo(store, form, { user: _.get(pending, 'by.user') });
    }
  }).catch(_.noop); // couldn't tell: the save merges, keeping the newer version where both changed
}

/**
 * After a sync, for the form this tab has open:
 * - someone took it over while this tab couldn't be reached (they name this
 *   tab in `over`, or have it open after this tab was out of touch with
 *   changes in it): let go without saving, and offer a copy;
 * - this tab was out of touch and someone changed the component meanwhile:
 *   check whether they changed a field being edited here (checkWhileAway);
 * - someone is asking for it (or editing it right now, after both opened it
 *   at once) and this user isn't working on it: hand it over (save, close).
 * @param {object} store
 * @param {boolean} quiet this user hasn't changed what they have open lately (or the tab is in the background, or idle)
 */
function respond(store, quiet) {
  const form = _.get(store, 'state.ui.currentForm'),
    now = serverNow();

  if (!form || !form.uri || yielding) {
    return;
  }

  const others = _.filter(_.get(store, 'state.collab.others', []), entry => overlaps(entry.focus, form.uri, form.path) && !isAway(entry, now)),
    opened = _.reject(others, 'focus.claim'),
    overMe = _.find(opened, entry => !!ctx.tab && _.includes(entry.focus.over, ctx.tab)),
    replaced = overMe || (isOutOfTouch(form.uri) ? _.head(opened) : undefined),
    asker = _.find(others, entry => entry.focus.claim || !isQuiet(entry, now)),
    pending = _.get(store, ['state', 'collab', 'pending', form.uri]);

  if (replaced) {
    letGo(store, form, replaced);
  } else if (isOutOfTouch(form.uri) && pending && checked !== `${form.uri} ${pending.rev}` && !isPage(form.uri) && !isLayout(form.uri)) {
    checkWhileAway(store, form, pending);
  } else if (asker && declined !== `${asker.tab} ${form.uri} ${form.path}` && (isMine(asker) && asker.focus.claim || quiet)) {
    // this user's other tab: they're over there now. Someone else: only if this user has gone quiet
    handOver(store, form, asker);
  }
}

/**
 * The tabs this tab's open form was opened over (presence says so, so they
 * let go without saving).
 * @param {object} focus this tab's focus
 * @returns {string[]|undefined}
 */
export function overFor(focus) {
  return over && focus && over.uri === focus.uri && (over.path || null) === (focus.path || null) ? over.tabs : undefined;
}

/**
 * This tab just checked in (or tried to) this long after its last successful
 * check-in. Longer than others wait before treating it as away: someone may
 * have taken over what it had open, so its earlier work on that (an open form
 * with changes, saves still waiting to go out) must not land on top of their
 * newer changes (see save.js).
 * @param {object} store
 * @param {number} gap ms
 */
export function checkedIn(store, gap) {
  const form = _.get(store, 'state.ui.currentForm');

  if (gap > OUT_OF_TOUCH_AFTER) {
    markOutOfTouch(_.keys(ctx.saving).concat(form && form.uri && fieldsEditedInForm(form).length ? [form.uri] : []));
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
 * This tab's form closed: a hand-over it couldn't do before may work next
 * time, and whatever it opened over is over.
 */
export function formClosed() {
  declined = null;
  over = null;
}

/**
 * Called after every sync, once presence is up to date.
 * @param {object} store
 * @param {boolean} quiet see respond
 */
export function afterSync(store, quiet) {
  checkClaim(store);
  respond(store, quiet);
}

/**
 * Forget everything (collaboration starting or stopping).
 */
export function resetLocks() {
  clearTimeout(claimTimer);
  claimTimer = null;
  pendingOpen = null;
  asking = null;
  over = null;
  yielding = null;
  declined = null;
  checked = null;
  if (noticeCleanup) {
    noticeCleanup();
  }
}
