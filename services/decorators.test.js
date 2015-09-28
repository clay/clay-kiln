var _ = require('lodash'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./decorators'),
  references = require('./references'),
  edit = require('./edit');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      lib.set([]);
    });

    afterEach(function () {
      sandbox.restore();
    });

    function stubNode() {
      var node = document.createElement('div');

      node.setAttribute(references.editableAttribute, 'title');
      return node;
    }

    function stubData(data) {
      sandbox.stub(edit, 'getData').returns(Promise.resolve({
        title: data
      }));
    }

    describe('decorate', function () {
      it('throws error if no el, ref, or path', function () {
        var result = function () {
          return lib(null, null, null);
        };

        expect(result).to.throw(Error);
      });

      it('calls .when() method of a decorator', function () {
        var fakeWhen = function () { return false; },
          fakeDecorator = {
            when: fakeWhen,
            handler: _.noop
          };

        sandbox.spy(fakeDecorator, 'when');
        sandbox.spy(fakeDecorator, 'handler');

        stubData({
          title: '',
          _schema: {
            _has: 'text'
          }
        });

        lib.add(fakeDecorator);
        return lib(stubNode(), 'fakeRef', 'title').then(function () {
          expect(fakeDecorator.when.callCount).to.equal(1);
          expect(fakeDecorator.handler.callCount).to.equal(0);
        });
      });

      it('calls .handler() method of a decorator', function () {
        var fakeWhen = function () { return true; },
          fakeDecorator = {
            when: fakeWhen,
            handler: _.noop
          };

        sandbox.spy(fakeDecorator, 'when');
        sandbox.spy(fakeDecorator, 'handler');

        stubData({
          title: '',
          _schema: {
            _has: 'text'
          }
        });

        lib.add(fakeDecorator);
        return lib(stubNode(), 'fakeRef', 'title').then(function () {
          expect(fakeDecorator.when.callCount).to.equal(1);
          expect(fakeDecorator.handler.callCount).to.equal(1);
        });
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

      it('throws error if no .when()', function () {
        var result = function () {
          return fn({ handler: _.noop });
        };

        expect(result).to.throw(Error);
      });

      it('throws error if no .handler()', function () {
        var result = function () {
          return fn({ when: _.noop });
        };

        expect(result).to.throw(Error);
      });
    });
  });
});
