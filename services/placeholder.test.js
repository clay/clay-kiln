'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./placeholder'),
  edit = require('./edit');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('getPlaceholderText', function () {
      var fn = lib[this.title],
        mockName = 'foo.bar';

      it('uses _placeholder string if it exists', function () {
        expect(fn(mockName, {_placeholder: 'Baz'})).to.equal('Baz');
      });

      it('falls back to calling label service', function () {
        expect(fn(mockName, {_placeholder: 'true'})).to.equal('Foo » Bar');
      });
    });

    describe('getPlaceholderHeight', function () {
      var fn = lib[this.title];

      it('gets height of vertical-list', function () {
        expect(fn([{
          fn: 'text',
          required: true
        }, {
          fn: 'vertical-list'
        }])).to.equal('600px');
      });

      it('gets height of component', function () {
        expect(fn([{
          fn: 'component'
        }, {
          fn: 'dragdrop-reorder'
        }])).to.equal('300px');
      });

      it('gets default height', function () {
        expect(fn([{
          fn: 'text',
          required: true
        }, {
          fn: 'soft-maxlength',
          value: 80
        }])).to.equal('auto');
      });
    });

    describe('isFieldEmpty', function () {
      var fn = lib[this.title];

      it('is true if undefined', function () {
        expect(fn({value: undefined})).to.equal(true);
      });
      it('is true if null', function () {
        expect(fn({value: null})).to.equal(true);
      });
      it('is true if empty string', function () {
        expect(fn({value: ''})).to.equal(true);
      });
      it('is true if empty array', function () {
        expect(fn({value: []})).to.equal(true);
      });

      it('is false if empty obj', function () {
        expect(fn({value: {}})).to.equal(true);
      });
      it('is false if string w/ characters', function () {
        expect(fn({value: '123'})).to.equal(false);
      });
      it('is false if number', function () {
        expect(fn({value: 123})).to.equal(false);
      });
      it('is false if array w/ values', function () {
        expect(fn({value: [1, 2, 3]})).to.equal(false);
      });
    });

    function stubData(data) {
      sandbox.stub(edit, 'getData').returns(Promise.resolve({
        title: data
      }));
    }

    function stubNode() {
      var node = document.createElement('div');
      node.setAttribute('name', 'title');
      return node;
    }

    it('adds if field and blank', function () {
      stubData({value: '', _schema: {
        _has: 'text',
        _placeholder: true
      }});

      return lib('fakeRef', stubNode()).then(function (newNode) {
        expect(newNode.querySelector('.editor-placeholder').style.height).to.equal('auto');
        expect(newNode.querySelector('span.placeholder-label').textContent).to.equal('Title');
      });
    });

    it('does not add if field and not blank', function () {
      stubData({value: '123', _schema: {
        _has: 'text',
        _placeholder: true
      }});

      return lib('fakeRef', stubNode()).then(function (el) {
        expect(el.querySelector('.editor-placeholder')).to.equal(null);
        expect(el.querySelector('span.placeholder-label')).to.equal(null);
      });
    });

    it('does not add if not field', function () {
      stubData({value: '123', _schema: {
        _placeholder: true
      }});

      return lib('fakeRef', stubNode()).then(function (el) {
        expect(el.querySelector('.editor-placeholder')).to.equal(null);
        expect(el.querySelector('span.placeholder-label')).to.equal(null);
      });
    });

    it('does not add if no _placeholder', function () {
      stubData({value: '123', _schema: {
        _has: 'text'
      }});

      return lib('fakeRef', stubNode()).then(function (el) {
        expect(el.querySelector('.editor-placeholder')).to.equal(null);
        expect(el.querySelector('span.placeholder-label')).to.equal(null);
      });
    });

  });
});
