var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  references = require('../services/references'),
  edit = require('../services/edit'),
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

      node.setAttribute(references.editableAttribute, 'content');
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

    describe('updateOrder', function () {
      var fn = lib[this.title],
        el = document.createElement('div'),
        item = document.createElement('div'),
        options = {
          ref: 'fakeRef',
          path: 'content'
        },
        expectData = function () {
          expect(edit.save.calledWith({
            content: [{
              _ref: 'fakeItemRef'
            }]
          })).to.equal(true);
        },
        expectNoData = function () {
          expect(edit.save.calledWith({
            content: []
          })).to.equal(true);
        };

      beforeEach(function () {
        item.setAttribute(references.referenceAttribute, 'fakeItemRef');
        sandbox.stub(edit, 'getData').returns(Promise.resolve({}));
        sandbox.stub(edit, 'save', sandbox.spy());
      });

      it('gets rid of removed components', function () {
        el.appendChild(item);
        fn(el, options)
          .then(expectData)
          .then(function () {
            el.removeChild(item);
          })
          .then(expectNoData);
      });

      it('adds components', function () {
        fn(el, options)
          .then(expectNoData)
          .then(function () {
            el.appendChild(item);
          })
          .then(expectData);
      });

      it('only looks for direct children of the list', function () {
        var subItem = document.createElement('span'),
          dontExpectSubData = function () {
            expect(edit.save.calledWith({
              content: [{
                _ref: 'fakeSubItemRef'
              }]
            })).to.equal(false);
          };

        subItem.setAttribute(references.referenceAttribute, 'fakeSubItemRef');
        item.appendChild(subItem);
        el.appendChild(item);
        fn(el, options).then(expectData).then(dontExpectSubData);
        // should only expect fakeItemRef, not fakeSubItemRef
      });
    });
  });
});
