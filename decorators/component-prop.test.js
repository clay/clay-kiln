const dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  references = require('../services/references'),
  lib = require('./component-prop');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    function stubNode() {
      var node = document.createElement('div');

      node.setAttribute(references.editableAttribute, 'content');
      return node;
    }

    describe('when', function () {
      const fn = lib[this.title];

      it('returns false if not component prop', function () {
        var stubData = {
          _schema: {
            _has: 'text'
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(false);
      });

      it('returns true if component prop is object', function () {
        var stubData = {
          _schema: {
            _component: {}
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(true);
      });

      it('returns true if component prop is true', function () {
        var stubData = {
          _schema: {
            _component: true
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(true);
      });
    });

    describe('handler', function () {
      const fn = lib[this.title];

      it('adds class to component prop', function () {
        var stubData = {
          _schema: {
            _component: true
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'}).classList.contains('component-prop-wrapper')).to.equal(true);
      });

      it('adds page class to page-specific component prop', function () {
        var stubData = {
          _schema: {
            _component: {
              page: true
            }
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'}).classList.contains('kiln-page-area')).to.equal(true);
      });
    });
  });
});
