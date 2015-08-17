var _ = require('lodash');

/**
 * @param {*} obj
 * @returns {boolean}
 */
function isFreezable(obj) {
  var type = typeof obj;

  // NOTE: leave functions allow, despite object-like behavior.  We need them for stubs.
  return type === 'object' && obj !== null && Object.isFrozen && !Object.isFrozen(obj);
}

/**
 * @param {*} obj
 * @returns {*}
 */
function setReadOnly(obj) {
  if (isFreezable(obj)) {
    _.forOwn(obj, function (value) {
      if (typeof value === 'object' && value !== null) {
        setReadOnly(value);
      }
    });

    Object.freeze(obj);
  }
  return obj;
}

/**
 * Defer a promise.
 *
 * @returns {{resolve: function, reject: function, promise: Promise}}
 */
function defer() {
  var deferred = {},
    promise;

  promise = new Promise(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  deferred.promise = promise;

  return deferred;
}

/**
 * Memoize a promise.
 *
 * Returns a fresh promise so there is no chain corruption.
 *
 * @param {function} fn
 * @returns {function}
 */
function memoizePromise(fn) {
  var wrap;

  wrap = function () {
    var value,
      d = defer(),
      args = _.slice(arguments),
      key = args[0];

    if (wrap.cache.has(key)) {
      value = wrap.cache.get(key);

      if (_.isError(value)) {
        d.reject(value);
      } else {
        d.resolve(value);
      }
    } else {
      // at first, save the promise
      wrap.cache.set(key, d.promise);
      fn.apply(null, _.slice(arguments)).then(function (result) {
        // prevent cache corruption
        setReadOnly(result);

        // later, save the result
        wrap.cache.set(key, result);
        d.resolve(result);
      }, function (error) {
        wrap.cache.set(key, error);
        d.reject(error);
      });
    }

    return d.promise;
  };
  wrap.cache = new _.memoize.Cache();

  return wrap;
}

module.exports.setReadOnly = setReadOnly;
module.exports.memoizePromise = memoizePromise;
