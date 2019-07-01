import _ from 'lodash';
import { requestTimeout, clearRequestTimeout } from './events';

/**
 * @returns {{resolve: function, reject: function, promise: Promise}}
 * @see https://github.com/petkaantonov/bluebird/blob/master/API.md#deferred-migration
 */
export function defer() {
  let resolve,
    reject;

  const promise = new Promise(function () {
    resolve = arguments[0];
    reject = arguments[1];
  });

  return { resolve, reject, promise };
}

/**
 * bluebird.props with native promises
 * @param {object} props
 * @returns {Promise}
 */
export function props(props) {
  return Promise.all(Object.keys(props).map(function (key) {
    // ok with val, func, prom?
    return Promise.resolve(props[key]).then(function (res) {
      let one = {};

      one[key] = res;

      return one;
    });
  }))
    .then(function (resolvedArray) {
      return resolvedArray.reduce(function (memo, oneRes) {
        let key = Object.keys(oneRes)[0];

        memo[key] = oneRes[key];

        return memo;
      }, {});
    });
}

/**
 * @returns {Promise}
 */
export function join() {
  return Promise.all(_.slice(arguments));
}

/**
 * @param {object|Array} list
 * @param {function} fn
 * @returns {Promise}
 */
export function each(list, fn) {
  return Promise.all(_.map(list, fn)).then(function () { return list; });
}

/**
 * @param {object|Array} list
 * @param {function} fn
 * @returns {Promise}
 */
export function map(list, fn) {
  return Promise.all(_.map(list, fn));
}

/**
 * @param {object|Array} list
 * @param {function} fn
 * @param {*} initializer
 * @returns {Promise}
 */
export function reduce(list, fn, initializer) {
  return Promise.all(list).then(function (resolvedList) {
    return _.reduce(resolvedList, function (promise, item, index) {
      return promise.then(function (acc) {
        return fn(acc, item, index);
      });
    }, Promise.resolve(initializer));
  });
}

/**
 * Like normal reduce, but in parallel.  Returning the obj doesn't matter, but can return promises for async operations.
 *
 * @param {object|Array} list
 * @param {function} fn
 * @param {*} initializer
 * @returns {Promise}
 */
export function transform(list, fn, initializer) {
  var acc = initializer;

  return Promise.all(_.map(list, function (item, index) {
    return Promise.resolve(item).then(function (value) {
      return fn(acc, value, index);
    });
  })).then(function () { return acc; });
}

/**
 * Start a promise chain with a function
 * Errors are treated as Promise rejections
 * @param {Function} fn
 * @returns {Promise}
 */
export function attempt(fn) {
  var result;

  try {
    result = Promise.resolve(fn());
  } catch (error) {
    result = Promise.reject(error);
  }

  return result;
}

/**
 * simple and easy promise timeout
 * @param  {Promise} promise
 * @param  {number} time    number of milliseconds to allow the promise to resolve
 * @return {Promise}
 */
export function timeout(promise, time) {
  let timer = null;

  return Promise.race([
    new Promise((resolve, reject) => {
      timer = requestTimeout(reject, time, new Error('Timed out!'));

      return timer;
    }),
    promise.then((value) => {
      clearRequestTimeout(timer);

      return value;
    })
  ]);
}
