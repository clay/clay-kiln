var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  references = require('./references'),
  lib = require('./select');

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

      node.setAttribute('data-editable', 'content');
      return node;
    }

    function stubComponent() {
      var node = document.createElement('div');

      node.setAttribute(references.editableAttribute, 'content');
      node.setAttribute(references.referenceAttribute, '/components/foo/id/bar');
      return node;
    }

    describe('select', function () {
      var fn = lib[this.title];

      it('adds .selected class', function () {
        var el = stubNode();

        fn(el, {});
        expect(el.classList.contains('selected')).to.equal(true);
      });
    });

    describe('unselect', function () {
      var fn = lib[this.title];

      it('removed .selected class', function () {
        var el = stubNode();

        lib.select(el);
        fn(); // unselect
        expect(el.classList.contains('selected')).to.equal(false);
      });
    });

    describe('when', function () {
      var fn = lib[this.title];

      it('returns false if not root component element', function () {
        expect(fn(stubNode())).to.equal(false);
      });

      it('returns true if root component element', function () {
        expect(fn(stubComponent())).to.equal(true);
      });
    });

    describe('handler', function () {
      var fn = lib[this.title];

    });
  });
});
