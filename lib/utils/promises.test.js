import _ from 'lodash';
import * as lib from './promises';

describe('promises', () => {
  /**
   * Return each argument each time stub function is called
   * @returns {object}
   */
  function stubReturns() {
    let stub = jest.fn();

    _.each(_.slice(arguments), arg => stub.mockReturnValueOnce(arg));

    return stub;
  }

  describe('defer', () => {
    const fn = lib.defer;

    test('creates Promise', () => {
      expect(fn().promise instanceof Promise).toBe(true);
    });

    test('resolves data', (done) => {
      const data = new Error(),
        deferred = fn();

      deferred.promise.catch((error) => {
        done(error);
      }).then((result) => {
        expect(result).toBe(data);
        done();
      });

      deferred.resolve(data);
    });

    test('rejects errors', (done) => {
      const data = new Error(),
        deferred = fn();

      deferred.promise.then(() => {
        done('should have rejected');
      }).catch((result) => {
        expect(result).toBe(data);
        done();
      });

      deferred.reject(data);
    });
  });

  describe('props', () => {
    const fn = lib.props;

    test('resolves data', (done) => {
      const data = { one: Promise.resolve('one'), two: Promise.resolve('two') };

      fn(data).catch((error) => {
        done(error);
      }).then((result) => {
        expect(result.one).toBe('one');
        expect(result.two).toBe('two');
        done();
      });
    });
  });

  describe('join', () => {
    const fn = lib.join;

    test('creates Promise', () => {
      expect(fn() instanceof Promise).toBe(true);
    });

    test('joins', (done) => {
      const d1 = lib.defer(),
        d2 = lib.defer(),
        data1 = {},
        data2 = {};

      fn(d1.promise, d2.promise).then((result) => {
        expect(result[0]).toBe(data1);
        expect(result[1]).toBe(data2);
        done();
      });

      d1.resolve(data1);
      d2.resolve(data2);
    });
  });

  describe('each', () => {
    const fn = lib.each;

    test('creates Promise', () => {
      expect(fn() instanceof Promise).toBe(true);
    });

    test('calls each function', () => {
      const data = ['a', 'b'],
        spy = jest.fn();

      return fn(data, spy).then((result) => {
        // returns original data
        expect(result).toBe(data);

        // called the fn with params
        expect(spy.mock.calls[0][0]).toBe('a');
        expect(spy.mock.calls[1][0]).toBe('b');
      });
    });
  });

  describe('map', () => {
    const fn = lib.map;

    test('creates Promise', () => {
      expect(fn() instanceof Promise).toBe(true);
    });

    test('calls each function', () => {
      const data = ['a', 'b'],
        stub = stubReturns('c', 'd');

      return fn(data, stub).then((result) => {
        // returns new data
        expect(result).toEqual(['c', 'd']);

        // called the fn with params
        expect(stub.mock.calls[0][0]).toBe('a');
        expect(stub.mock.calls[1][0]).toBe('b');
      });
    });
  });

  describe('reduce', () => {
    const fn = lib.reduce;

    test('creates Promise', () => {
      expect(fn([1, 1], (a, b) => a + b, 0) instanceof Promise).toBe(true);
    });

    test('reduces', () => {
      const data = [1, 2, 3],
        expectedResult = 6;

      return fn(data, (acc, value) => { return acc + value; }, 0).then((result) => {
        expect(result).toBe(expectedResult);
      });
    });
  });

  describe('transform', () => {
    const fn = lib.transform;

    test('creates Promise', () => {
      expect(fn() instanceof Promise).toBe(true);
    });

    test('transforms', () => {
      let data = [1, 2, 3],
        expectedResult = [6];

      return fn(data, function (acc, value) { acc[0] += value; }, [0]).then((result) => {
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('attempt', () => {
    const fn = lib.attempt;

    test('creates Promise', () => {
      expect(fn(() => ({ some: 'val' })) instanceof Promise).toBe(true);
    });

    test('catches thrown error', () => {
      return fn(() => {
        throw new Error('hey');
      }).catch((e) => {
        expect(e.message).toBe('hey');
      });
    });
  });
});
