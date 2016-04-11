var _ = require('lodash'),
  lib = require('./promises');

// defaults for chai
chai.config.showDiff = true;
chai.config.truncateThreshold = 0;

describe('promises service', function () {
  var sandbox;

  function resolveBThenA(d1, r1, d2, r2) {
    d2.resolve(r2);
    _.defer(function () { d1.resolve(r1); });
  }

  /**
   * Return each argument each time stub function is called
   * @returns {object}
   */
  function stubReturns() {
    var stub = sandbox.stub();

    _.each(_.slice(arguments), function (arg, index) {
      stub.onCall(index).returns(arg);
    });

    return stub;
  }

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('defer', function () {
    var fn = lib[this.title];

    it('creates Promise', function () {
      expect(fn().promise).to.be.instanceOf(Promise);
    });

    it('resolves data', function (done) {
      var data = new Error(),
        deferred = fn();

      deferred.promise.catch(function (error) {
        done(error);
      }).then(function (result) {
        expect(result).to.equal(data);
        done();
      });

      deferred.resolve(data);
    });

    it('rejects errors', function (done) {
      var data = new Error(),
        deferred = fn();

      deferred.promise.then(function () {
        done('should have rejected');
      }).catch(function (result) {
        expect(result).to.equal(data);
        done();
      });

      deferred.reject(data);
    });
  });

  describe('props', function () {
    var fn = lib[this.title];

    it('creates Promise', function () {
      expect(fn().promise).to.be.instanceOf(Promise);
    });

    it('resolves data', function (done) {
      var data = { one: Promise.resolve('one'), two: Promise.resolve('two') };

      fn(data).catch(function (error) {
        done(error);
      }).then(function (result) {
        expect(result.one).to.equal('one');
        expect(result.two).to.equal('two');
        done();
      });
    });

    it('rejects errors', function (done) {
      var data = new Error(),
        deferred = fn();

      deferred.promise.then(function () {
        done('should have rejected');
      }).catch(function (result) {
        expect(result).to.equal(data);
        done();
      });

      deferred.reject(data);
    });
  });

  describe('join', function () {
    var fn = lib[this.title];

    it('creates Promise', function () {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('joins', function (done) {
      var d1 = lib.defer(),
        d2 = lib.defer(),
        data1 = {},
        data2 = {};

      fn(d1.promise, d2.promise).then(function (result) {
        expect(result[0]).to.equal(data1);
        expect(result[1]).to.equal(data2);
        done();
      });

      d1.resolve(data1);
      d2.resolve(data2);
    });
  });

  describe('each', function () {
    var fn = lib[this.title];

    it('creates Promise', function () {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('calls each function', function () {
      var data = ['a', 'b'],
        spy = sandbox.spy();

      return fn(data, spy).then(function (result) {
        // returns original data
        expect(result).to.equal(data);

        // called the fn with params
        expect(spy.args[0][0]).to.equal('a');
        expect(spy.args[1][0]).to.equal('b');
      });
    });
  });
  describe('map', function () {
    var fn = lib[this.title];

    it('creates Promise', function () {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('calls each function', function () {
      var data = ['a', 'b'],
        stub = stubReturns('c', 'd');

      return fn(data, stub).then(function (result) {
        // returns new data
        expect(result).to.deep.equal(['c', 'd']);

        // called the fn with params
        expect(stub.args[0][0]).to.equal('a');
        expect(stub.args[1][0]).to.equal('b');
      });
    });
  });

  describe('reduce', function () {
    var fn = lib[this.title];

    it('creates Promise', function () {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('reduces', function () {
      var data = [1, 2, 3],
        expectedResult = 6;

      return fn(data, function (acc, value) { return acc + value; }, 0).then(function (result) {
        expect(result).to.equal(expectedResult);
      });
    });

    it('reduces in series for promises in initial list', function () {
      var promise,
        d1 = lib.defer(),
        d2 = lib.defer(),
        data = [d1.promise, d2.promise],
        expectedResult = 'ab';

      promise = fn(data, function (str, value) {
        return str + value;
      }, '').then(function (result) {
        expect(result).to.equal(expectedResult);
      });

      resolveBThenA(d1, 'a', d2, 'b');
      return promise;
    });

    it('reduces in series for promises in returned list', function () {
      var promise,
        d1 = lib.defer(),
        d2 = lib.defer(),
        data = ['a', 'b'],
        expectedResult = 'ab',
        stub = stubReturns(d1.promise, d2.promise),
        stubConcat = function (str, value) {
          return stub().then(function () { return str + value; });
        };

      promise = fn(data, stubConcat, '').then(function (result) {
        expect(result).to.equal(expectedResult);
      });

      resolveBThenA(d1, 'a', d2, 'b');
      return promise;
    });
  });

  describe('transform', function () {
    var fn = lib[this.title];

    it('creates Promise', function () {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('transforms', function () {
      var data = [1, 2, 3],
        expectedResult = [ 6 ];

      return fn(data, function (acc, value) { acc[0] += value; }, [0]).then(function (result) {
        expect(result).to.deep.equal(expectedResult);
      });
    });

    it('transforms in parallel for promises in initial list', function () {
      var promise,
        d1 = lib.defer(),
        d2 = lib.defer(),
        data = [d1.promise, d2.promise],
        expectedResult = { name: 'ba'};

      promise = fn(data, function (obj, value) { obj.name += value; }, {name: ''}).then(function (result) {
        expect(result).to.deep.equal(expectedResult);
      });

      resolveBThenA(d1, 'a', d2, 'b');
      return promise;
    });

    it('transforms in parallel for promises in returned list', function () {
      var promise,
        d1 = lib.defer(),
        d2 = lib.defer(),
        data = ['a', 'b'],
        expectedResult = { name: 'ba'},
        stub = stubReturns(d1.promise, d2.promise);

      promise = fn(data, function (obj, value) {
        return stub().then(function () { obj.name += value; });
      }, {name: ''}).then(function (result) {
        expect(result).to.deep.equal(expectedResult);
      });

      resolveBThenA(d1, 'a', d2, 'b');
      return promise;
    });
  });

  describe('attempt', function () {
    var fn = lib[this.title];

    it('creates Promise', function () {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('catches thrown error', function (done) {
      fn(function () {
        throw new Error('hey');
      }).then(function () {
        done('should have thrown');
      }).catch(function () {
        done();
      });
    });
  });
});
