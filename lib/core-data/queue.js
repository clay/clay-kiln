import Queue from 'promise-queue';

const maxConcurrency = 1,
  maxQueue = Infinity,
  queue = new Queue(maxConcurrency, maxQueue),
  queueCache = {}; // make sure we don't do the same api call over and over if it takes too long

/**
 * see if a queue has anything pendingPromises
 * @return {Boolean}
 */
export function isPending() {
  return queue.queue && queue.queue.length > 0 && queue.pendingPromises > 0;
}

/**
 * add promise to queue
 * note: each promise is resolved sequentially,
 * but promises may contain async children (e.g. Promise.all([a, few, api, calls]))
 * @param {Function} fn
 * @param {Array}   args
 * @returns {Promise}
 */
export function add(fn, args) {
  const cacheHash = fn.name + JSON.stringify(args);

  let newPromise;

  // every time we add a function to the queue, check to see if it's already added
  if (queueCache[cacheHash]) {
    return queueCache[cacheHash]; // this will resolve when it's time to resolve
  } else {
    // create a function that returns a promise.
    // it warms the cache and gets passed to the queue
    newPromise = fn.apply(null, args);
    queueCache[cacheHash] = newPromise;
    return queue.add(() => newPromise).then(function (res) {
      // after individual promise resolves, remove it from the cache
      delete queueCache[cacheHash];
      return res;
    });
  }
}
