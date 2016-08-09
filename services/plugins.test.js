var _ = require('lodash'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./plugins');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      lib.set({});
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('init', function () {
      var fn = lib[this.title];

      it('calls plugin method', function () {
        var spy = {
          fakePlugin: _.noop
        };

        sandbox.spy(spy, 'fakePlugin');

        function expectCalled() {
          expect(spy.fakePlugin.calledOnce).to.equal(true);
        }

        lib.add('fakePlugin', spy.fakePlugin);
        return fn().then(expectCalled);
      });
    });

    describe('add', function () {
      var fn = lib[this.title];

      it('throws error if blank', function () {
        var result = function () {
          return fn();
        };

        expect(result).to.throw(Error);
      });

      it('throws error if not function', function () {
        var result = function () {
          return fn('foo', {});
        };

        expect(result).to.throw(Error);
      });

      it('adds plugins', function () {
        var result = function () {
          return fn('bar', _.noop);
        };

        expect(result).to.not.throw(Error);
      });
    });
  });
});
