import Queue from 'promise-queue';
import store from './store';

const maxConcurrency = 1,
  maxQueue = Infinity,
  queue = new Queue(maxConcurrency, maxQueue),
  queueCache = {}; // make sure we don't do the same api call over and over if it takes too long

/**
 * get number of queued and pending pending promises
 * @return {number}
 */
function getPendingCount() {
  return queue.queue.length + queue.pendingPromises;
}

/**
 * see if a queue has anything pendingPromises
 * @return {Boolean}
 */
export function isPending() {
  return getPendingCount() > 0;
}

/**
 * add promise to queue
 * note: each promise is resolved sequentially,
 * but promises may contain async children (e.g. Promise.all([a, few, api, calls]))
 * @param {Function} fn
 * @param {Array}   args
 * @param {string} type color to use with the progress bar
 * @returns {Promise}
 */
export function add(fn, args, type) {
  const cacheHash = fn.name + JSON.stringify(args);

  // every time we add a function to the queue, check to see if it's already added
  if (queueCache[cacheHash]) {
    return queueCache[cacheHash]; // this will resolve when it's time to resolve
  } else {
    return queue.add(() => {
      // create a function that returns a promise.
      // it warms the cache and gets passed to the queue
      const newPromise = fn.apply(null, args);

      queueCache[cacheHash] = newPromise;

      return newPromise;
    }).then(function (res) {
      // after individual promise resolves, remove it from the cache
      delete queueCache[cacheHash];
      // if there are no more pending promises, make sure to finish the progress bar
      if (!isPending()) {
        // if the queue is totally flushed, finish the progress bar
        store.dispatch('finishProgress', type);
      }

      return res;
    });
  }
}
