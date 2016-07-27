var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  forms = require('../services/forms'),
  select = require('../services/components/select'),
  references = require('../services/references'),
  lib = require('./focus');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(select);
      sandbox.stub(forms, 'isFormValid').returns(true);
    });

    afterEach(function () {
      sandbox.restore();
    });

    function stubNode() {
      var node = document.createElement('div');

      node.setAttribute(references.editableAttribute, 'content');
      return node;
    }

    describe('focus', function () {
      var fn = lib[this.title];

      function returnPromise() {
        return Promise.resolve();
      }

      it('calls forms.open', function () {
        var afterOpen = function () {
          expect(forms.open.callCount).to.equal(1);
        };

        sandbox.stub(forms, 'open', sandbox.spy(returnPromise));
        return fn(stubNode(), {}).then(afterOpen);
      });
    });

    describe('unfocus', function () {
      var fn = lib[this.title];

      it('calls forms.close', function () {
        sandbox.stub(forms, 'close', sandbox.spy());
        fn(stubNode(), {});
        expect(forms.close.callCount).to.equal(1);
      });
    });

    describe('when', function () {
      var fn = lib[this.title];

      it('returns true if not component list or prop', function () {
        var stubData = {
          _schema: {
            _has: 'text'
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(true);
      });

      it('returns false if component list is object', function () {
        var stubData = {
          _schema: {
            _componentList: {}
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(false);
      });

      it('returns false if component list is true', function () {
        var stubData = {
          _schema: {
            _componentList: true
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(false);
      });

      it('returns false if component prop is object', function () {
        var stubData = {
          _schema: {
            _component: {}
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(false);
      });

      it('returns false if component prop is true', function () {
        var stubData = {
          _schema: {
            _component: true
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(false);
      });

      it('returns false if el isn\'t editable', function () {
        var stubData = {
            _schema: {
              has: 'text'
            }
          },
          node = document.createElement('div');

        node.setAttribute(references.placeholderAttribute, 'content');

        expect(fn(node, {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(false);
      });
    });

    describe('handler', function () {
      var fn = lib[this.title];

      it('adds click event', function () {
        var stubData = {
            value: '',
            _schema: {
              _has: 'text'
            }
          },
          options = {data: stubData, ref: 'fakeRef', path: 'title'},
          newNode;

        sandbox.stub(lib, 'focus').returns(Promise.resolve({}));
        newNode = fn(stubNode(), options);

        // trigger click
        newNode.dispatchEvent(new Event('click'));

        // see if focus was called
        expect(lib.focus.calledWith(newNode, options)).to.equal(true);
      });
    });
  });
});
