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
    var promise,
      args = _.slice(arguments),
      key = args[0];

    promise = new Promise(function (resolve, reject) {
      var value;

      if (wrap.cache.has(key)) {
        value = wrap.cache.get(key);

        if (_.isError(value)) {
          reject(value);
        } else {
          resolve(value);
        }
      } else {
        // at first, save the promise
        wrap.cache.set(key, promise);
        fn.apply(null, _.slice(args)).then(function (result) {
          // can't let them change it or they'll affect the next person that asks
          setReadOnly(result);

          // later, save the result
          wrap.cache.set(key, result);
          resolve(result);
        }, function (error) {
          wrap.cache.set(key, error);
          reject(error);
        });
      }
    });

    return promise;
  };
  wrap.cache = new _.memoize.Cache();

  return wrap;
}

module.exports.setReadOnly = setReadOnly;
module.exports.memoizePromise = memoizePromise;
