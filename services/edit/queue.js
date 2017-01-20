const Queue = require('promise-queue'),
  progress = require('../progress'),
  maxConcurrency = 1,
  maxQueue = Infinity,
  queue = new Queue(maxConcurrency, maxQueue);

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
  if (queue.pendingPromises === 0 && queue.queue.length === 0) {
    // queue is empty, and all the promises are here
    progress.start(progressType || 'save');
  }

  console.log(queue.pendingPromises + queue.queue.length + ' items')

  return queue.add(function () {
    return fn.apply(null, args);
  }).then(function (res) {
    // after individual promise resolves
    if (queue.pendingPromises === 0 && queue.queue.length === 0) {
      // all queued items are done
      progress.done(progressType || 'save');
    }
    console.log(queue.pendingPromises + queue.queue.length + ' items remaining')
    return res;
  }).catch(progress.error('API Error'));
}

/**
 * clear the queue
 */
function clear() {
  queue.queue = [];
  queue.pendingPromises = 0;
};

module.exports.add = add; // resolves when queue finishes
