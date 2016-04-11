var _ = require('lodash');

/**
 * @returns {{resolve: function, reject: function, promise: Promise}}
 * @see https://github.com/petkaantonov/bluebird/blob/master/API.md#deferred-migration
 */
function defer() {
  var resolve, reject,
    promise = new Promise(function () {
      resolve = arguments[0];
      reject = arguments[1];
    });

  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };
}

/**
 * bluebird.props with native promises
 * @param {object} props
 * @returns {Promise}
 */
function props(props) {
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
function join() {
  return Promise.all(_.slice(arguments));
}

/**
 * @param {object|Array} list
 * @param {function} fn
 * @returns {Promise}
 */
function each(list, fn) {
  return Promise.all(_.map(list, fn)).then(function () { return list; });
}

/**
 * @param {object|Array} list
 * @param {function} fn
 * @returns {Promise}
 */
function map(list, fn) {
  return Promise.all(_.map(list, fn));
}

/**
 * @param {object|Array} list
 * @param {function} fn
 * @param {*} initializer
 * @returns {Promise}
 */
function reduce(list, fn, initializer) {
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
function transform(list, fn, initializer) {
  var acc = initializer;

  return Promise.all(_.map(list, function (item, index) {
    return Promise.resolve(item).then(function (value) {
      return fn(acc, value, index);
    });
  })).then(function () { return acc; });
}

function attempt(fn) {
  var result;

  try {
    result = Promise.resolve(fn());
  } catch (error) {
    result = Promise.reject(error);
  }

  return result;
}

module.exports.defer = defer;
module.exports.props = props;
module.exports.join = join;
module.exports.each = each;
module.exports.map = map;
module.exports.reduce = reduce;
module.exports.transform = transform;
module.exports.attempt = attempt;
