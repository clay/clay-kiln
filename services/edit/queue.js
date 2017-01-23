const Queue = require('promise-queue'),
  progress = require('../progress'),
  maxConcurrency = 1,
  maxQueue = Infinity,
  queue = new Queue(maxConcurrency, maxQueue),
  queueCache = {}; // make sure we don't do the same api call over and over if it takes too long

/**
 * add promise to queue
 * note: each promise is resolved sequentially,
 * but promises may contain async children (e.g. Promise.all([a, few, api, calls]))
 * @param {Function} fn
 * @param {Array}   args
 * @param {string} [progressType] 'publish', 'schedule', add this if you need to end with a different progress bar color
 * @returns {Promise}
 */
function add(fn, args, progressType) {
  const cacheHash = fn.name + JSON.stringify(args);

  let newPromise;

  if (queue.pendingPromises === 0 && queue.queue.length === 0) {
    // queue is empty, and all the promises are here
    progress.start(progressType || 'save');
  }

  // every time we add a function to the queue, check to see if it's already added
  if (queueCache[cacheHash]) {
    return Promise.resolve(queueCache[cacheHash]());
  } else {
    // create a function that returns a promise.
    // it warms the cache and gets passed to the queue
    newPromise = () => fn.apply(null, args);
    queueCache[cacheHash] = newPromise;
    return queue.add(newPromise).then(function (res) {
      // after individual promise resolves, remove it from the cache
      delete queueCache[cacheHash];
      if (queue.pendingPromises === 0 && queue.queue.length === 0) {
        // all queued items are done
        progress.done(progressType || 'save');
      }
      return res;
    }).catch(progress.error('API Error'));
  }
}

module.exports.add = add; // resolves when queue finishes
