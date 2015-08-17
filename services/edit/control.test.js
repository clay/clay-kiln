var lib = require('./control'),
  expect = require('chai').expect,
  sinon = require('sinon');

describe('control service', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('setReadOnly', function () {
    var fn = lib[this.title];

    it('takes null', function () {
      var data = null;

      expect(fn(data)).to.equal(data);
    });

    it('takes empty object', function () {
      var data = {};

      expect(fn(data)).to.equal(data);
    });
  });

  describe('memoizePromise', function () {
    var fn = lib[this.title];

    /**
     * Create deferred promise
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

    it('resolves promise', function () {
      var deferred = defer(),
        testFn = function () {
          return deferred.promise;
        };

      deferred.resolve('a');

      return fn(testFn)('b');
    });

    it('rejects promise', function (done) {
      var deferred = defer(),
        testFn = function () {
          return deferred.promise;
        };

      deferred.reject(new Error('a'));

      fn(testFn)('b').then(function () { done('should throw'); }, function () { done(); });
    });

    it('remembers promise', function () {
      var deferred = defer(),
        testFn = fn(function () {
          return deferred.promise;
        });

      deferred.resolve('a');

      return Promise.all([testFn('b'), testFn('b'), testFn('c')]).then(function (result) {
        expect(result).to.deep.equal(['a', 'a', 'a']);
      });
    });
  });
});