var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./component-list');

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

    describe('when', function () {
      var fn = lib[this.title];

      it('returns false if not component list', function () {
        var stubData = {
          _schema: {
            _has: 'text'
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(false);
      });

      it('returns true if component list is object', function () {
        var stubData = {
          _schema: {
            _componentList: {}
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(true);
      });

      it('returns true if component list is true', function () {
        var stubData = {
          _schema: {
            _componentList: true
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(true);
      });
    });

    describe('handler', function () {
      var fn = lib[this.title];

      // it('adds placeholder', function () {
      //   var stubData = {
      //     value: '',
      //     _schema: {
      //       _has: 'text',
      //       _placeholder: true
      //     }
      //   },
      //   newNode = fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'title'});
      //
      //   expect(newNode.querySelector('.editor-placeholder').style.height).to.equal('auto');
      //   expect(newNode.querySelector('span.placeholder-label').textContent).to.equal('Title');
      // });
    });
  });
});
