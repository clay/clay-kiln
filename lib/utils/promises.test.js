import _ from 'lodash';
import * as lib from './promises';

describe('promises', () => {
  let sandbox;

  function resolveBThenA(d1, r1, d2, r2) {
    d2.resolve(r2);
    _.defer(() => { d1.resolve(r1); });
  }

  /**
   * Return each argument each time stub function is called
   * @returns {object}
   */
  function stubReturns() {
    let stub = sandbox.stub();

    _.each(_.slice(arguments), (arg, index) => stub.onCall(index).returns(arg));
    return stub;
  }

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('defer', () => {
    const fn = lib.defer;

    it('creates Promise', () => {
      expect(fn().promise).to.be.instanceOf(Promise);
    });

    it('resolves data', (done) => {
      const data = new Error(),
        deferred = fn();

      deferred.promise.catch((error) => {
        done(error);
      }).then((result) => {
        expect(result).to.equal(data);
        done();
      });

      deferred.resolve(data);
    });

    it('rejects errors', (done) => {
      const data = new Error(),
        deferred = fn();

      deferred.promise.then(() => {
        done('should have rejected');
      }).catch((result) => {
        expect(result).to.equal(data);
        done();
      });

      deferred.reject(data);
    });
  });

  describe('props', () => {
    const fn = lib.props;

    it('resolves data', (done) => {
      const data = { one: Promise.resolve('one'), two: Promise.resolve('two') };

      fn(data).catch((error) => {
        done(error);
      }).then((result) => {
        expect(result.one).to.equal('one');
        expect(result.two).to.equal('two');
        done();
      });
    });
  });

  describe('join', () => {
    const fn = lib.join;

    it('creates Promise', () => {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('joins', (done) => {
      const d1 = lib.defer(),
        d2 = lib.defer(),
        data1 = {},
        data2 = {};

      fn(d1.promise, d2.promise).then((result) => {
        expect(result[0]).to.equal(data1);
        expect(result[1]).to.equal(data2);
        done();
      });

      d1.resolve(data1);
      d2.resolve(data2);
    });
  });

  describe('each', () => {
    const fn = lib.each;

    it('creates Promise', () => {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('calls each function', () => {
      const data = ['a', 'b'],
        spy = sandbox.spy();

      return fn(data, spy).then((result) => {
        // returns original data
        expect(result).to.equal(data);

        // called the fn with params
        expect(spy.args[0][0]).to.equal('a');
        expect(spy.args[1][0]).to.equal('b');
      });
    });
  });
  describe('map', () => {
    const fn = lib.map;

    it('creates Promise', () => {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('calls each function', () => {
      const data = ['a', 'b'],
        stub = stubReturns('c', 'd');

      return fn(data, stub).then((result) => {
        // returns new data
        expect(result).to.deep.equal(['c', 'd']);

        // called the fn with params
        expect(stub.args[0][0]).to.equal('a');
        expect(stub.args[1][0]).to.equal('b');
      });
    });
  });

  describe('reduce', () => {
    const fn = lib.reduce;

    it('creates Promise', () => {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('reduces', () => {
      const data = [1, 2, 3],
        expectedResult = 6;

      return fn(data, (acc, value) => { return acc + value; }, 0).then((result) => {
        expect(result).to.equal(expectedResult);
      });
    });

    it('reduces in series for promises in initial list', () => {
      let promise,
        d1 = lib.defer(),
        d2 = lib.defer(),
        data = [d1.promise, d2.promise],
        expectedResult = 'ab';

      promise = fn(data, (str, value) => str + value, '').then((result) => {
        expect(result).to.equal(expectedResult);
      });

      resolveBThenA(d1, 'a', d2, 'b');
      return promise;
    });

    it('reduces in series for promises in returned list', () => {
      let promise,
        d1 = lib.defer(),
        d2 = lib.defer(),
        data = ['a', 'b'],
        expectedResult = 'ab',
        stub = stubReturns(d1.promise, d2.promise),
        stubConcat = (str, value) => stub().then(() => { return str + value; });

      promise = fn(data, stubConcat, '').then((result) => {
        expect(result).to.equal(expectedResult);
      });

      resolveBThenA(d1, 'a', d2, 'b');
      return promise;
    });
  });

  describe('transform', () => {
    const fn = lib.transform;

    it('creates Promise', () => {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('transforms', () => {
      let data = [1, 2, 3],
        expectedResult = [ 6 ];

      return fn(data, function (acc, value) { acc[0] += value; }, [0]).then((result) => {
        expect(result).to.deep.equal(expectedResult);
      });
    });

    it('transforms in parallel for promises in initial list', () => {
      let promise,
        d1 = lib.defer(),
        d2 = lib.defer(),
        data = [d1.promise, d2.promise],
        expectedResult = { name: 'ba'};

      promise = fn(data, function (obj, value) { obj.name += value; }, {name: ''}).then((result) => {
        expect(result).to.deep.equal(expectedResult);
      });

      resolveBThenA(d1, 'a', d2, 'b');
      return promise;
    });

    it('transforms in parallel for promises in returned list', () => {
      let promise,
        d1 = lib.defer(),
        d2 = lib.defer(),
        data = ['a', 'b'],
        expectedResult = { name: 'ba'},
        stub = stubReturns(d1.promise, d2.promise);

      promise = fn(data, (obj, value) => stub().then(() => { obj.name += value; }), {name: ''}).then((result) => {
        expect(result).to.deep.equal(expectedResult);
      });

      resolveBThenA(d1, 'a', d2, 'b');
      return promise;
    });
  });

  describe('attempt', () => {
    const fn = lib.attempt;

    it('creates Promise', () => {
      expect(fn()).to.be.instanceOf(Promise);
    });

    it('catches thrown error', (done) => {
      fn(() => {
        throw new Error('hey');
      }).then(() => {
        done('should have thrown');
      }).catch(() => {
        done();
      });
    });
  });
});
