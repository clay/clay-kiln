import _ from 'lodash';
import store from './store';
import { HELD_SAVES } from '../toolbar/mutationTypes';

const RETRY_AFTER = 3000, // ms between tries while the CMS can't be reached
  MAX_RETRY_AFTER = 15000; // after a while, try less often

let waiting = [], // wake-up functions of saves waiting to try again
  watching = false;

/**
 * Did a request fail because the CMS couldn't be reached right now (offline,
 * a network gateway or proxy in the way, a deploy), rather than because the
 * server said no? Gateways, proxies and load balancers answer 403/502/504
 * without amphora's JSON body; amphora's own 403s are JSON (`{ code: 403 }`)
 * and mean it.
 * A 503 always means "try again".
 * @param {Error} err from core-data/api (with `response`), or a fetch error
 * @returns {Promise<boolean>}
 */
export function isUnreachable(err) {
  const res = err && err.response,
    status = res && res.status;

  if (!res) {
    return Promise.resolve(false); // not a failed request
  }

  if (!status || status === 502 || status === 503 || status === 504) {
    return Promise.resolve(true); // network error, or the server isn't there right now
  }

  if (status !== 403) {
    return Promise.resolve(false);
  }

  return Promise.resolve()
    .then(() => (_.isFunction(res.clone) ? res.clone() : res).json())
    .then(body => !(body && body.code === 403), () => true);
}

/**
 * Try every waiting save now (the editor is back: a request got through, the
 * browser came online, the tab got focus).
 */
export function retryHeldSaves() {
  _.each(waiting.slice(), wake => wake());
}

/**
 * Leaving with changes that haven't saved yet would lose them.
 * @param {Event} e
 */
function warnBeforeLeaving(e) {
  if (_.get(store, 'state.ui.heldSaves') > 0) {
    e.preventDefault();
    e.returnValue = ''; // browsers show their own "changes may not be saved" message
  }
}

/**
 * Start listening for the editor coming back (once).
 */
function watch() {
  if (watching) {
    return;
  }

  watching = true;
  window.addEventListener('online', retryHeldSaves);
  window.addEventListener('focus', retryHeldSaves);
  document.addEventListener('visibilitychange', () => !document.hidden && retryHeldSaves());
  window.addEventListener('beforeunload', warnBeforeLeaving);
}

/**
 * Wait before trying again: a few seconds (longer after a while), or until
 * something says the editor is back.
 * @param {number} tries so far
 * @returns {Promise}
 */
function nextTry(tries) {
  return new Promise((resolve) => {
    let timer;

    function wake() {
      clearTimeout(timer);
      _.pull(waiting, wake);
      resolve();
    }

    timer = setTimeout(wake, tries > 10 ? MAX_RETRY_AFTER : RETRY_AFTER);
    waiting.push(wake);
  });
}

/**
 * Run a save. While the CMS can't be reached, keep it (the editor's change
 * stays on the page) and try again until it goes through, instead of failing
 * and putting the old version back. Anything else fails as before. Saves stay
 * in order: kiln's save queue runs one at a time.
 * @param {function} fn returns the save's promise
 * @returns {Promise}
 */
export function holdWhileUnreachable(fn) {
  let held = false,
    tries = 0;

  function release() {
    if (held) {
      held = false;
      store.commit(HELD_SAVES, -1);
    }
  }

  function attempt() {
    return Promise.resolve().then(fn).then((result) => {
      release();

      return result;
    }, err => isUnreachable(err).then((unreachable) => {
      if (!unreachable) {
        release();
        throw err;
      }

      if (!held) {
        held = true;
        store.commit(HELD_SAVES, 1);
        watch();
      }

      tries += 1;

      return nextTry(tries).then(attempt);
    }));
  }

  return attempt();
}
