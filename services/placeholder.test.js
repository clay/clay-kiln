'use strict';
var placeholder = require('./placeholder'),
  edit = require('./edit');

describe('placeholder service', function () {
  describe('getPlaceholderText()', function () {
    var name = 'foo.bar',
      partials = {
        schema: {}
      };

    beforeEach(function () {
      partials.schema = {};
    });

    it('uses _placeholder string if it exists', function () {
      partials.schema._placeholder = 'Baz';
      expect(placeholder.getPlaceholderText(name, partials)).to.equal('Baz');
    });

    it('falls back to _label string if it exists (and _placeholder is simply `true`)', function () {
      partials.schema._placeholder = 'true';
      partials.schema._label = 'Baz';
      expect(placeholder.getPlaceholderText(name, partials)).to.equal('Baz');
    });

    it('falls back to prettified name if no _label (and _placeholder is simply `true`)', function () {
      partials.schema._placeholder = 'true';
      expect(placeholder.getPlaceholderText(name, partials)).to.equal('Foo » Bar');
    });
  });

  describe('getPlaceholderHeight()', function () {
    it('gets height of vertical-list', function () {
      expect(placeholder.getPlaceholderHeight([{
        fn: 'text',
        required: true
      }, {
        fn: 'vertical-list'
      }])).to.equal('600px');
    });

    it('gets height of component', function () {
      expect(placeholder.getPlaceholderHeight([{
        fn: 'component'
      }, {
        fn: 'dragdrop-reorder'
      }])).to.equal('300px');
    });

    it('gets default height', function () {
      expect(placeholder.getPlaceholderHeight([{
        fn: 'text',
        required: true
      }, {
        fn: 'soft-maxlength',
        value: 80
      }])).to.equal('auto');
    });
  });

  describe('isFieldEmpty()', function () {
    it('is true if undefined', function () {
      expect(placeholder.isFieldEmpty(undefined)).to.equal(true);
    });
    it('is true if null', function () {
      expect(placeholder.isFieldEmpty(null)).to.equal(true);
    });
    it('is true if empty string', function () {
      expect(placeholder.isFieldEmpty('')).to.equal(true);
    });
    it('is true if empty array', function () {
      expect(placeholder.isFieldEmpty([])).to.equal(true);
    });

    it('is false if empty obj', function () {
      expect(placeholder.isFieldEmpty({})).to.equal(false);
    });
    it('is false if string w/ characters', function () {
      expect(placeholder.isFieldEmpty('123')).to.equal(false);
    });
    it('is false if number', function () {
      expect(placeholder.isFieldEmpty(123)).to.equal(false);
    });
    it('is false if array w/ values', function () {
      expect(placeholder.isFieldEmpty([1, 2, 3])).to.equal(false);
    });
  });

  describe('addPlaceholder()', function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('adds if field and blank', function (done) {
      var partials = {
          schema: {
            _has: 'text',
            _placeholder: true
          },
          data: ''
        },
        node = document.createElement('div');

      node.setAttribute('name', 'title');
      sandbox.stub(edit, 'getSchemaAndData').returns(Promise.resolve(partials));

      placeholder('fakeRef', node).then(function (newNode) {
        expect(newNode.querySelector('.editor-placeholder').style.height).to.equal('auto');
        expect(newNode.querySelector('span.placeholder-label').textContent).to.equal('Title');
        done();
      }, function (e) { done(e); });
    });

    it('doesn\'t add if field and not blank', function (done) {
      var partials = {
          schema: {
            _has: 'text',
            _placeholder: true
          },
          data: '123'
        },
        node = document.createElement('div');

      node.setAttribute('name', 'title');
      sandbox.stub(edit, 'getSchemaAndData').returns(Promise.resolve(partials));

      placeholder('fakeRef', node).then(function (newNode) {
        expect(newNode.querySelector('.editor-placeholder')).to.not.exist;
        expect(newNode.querySelector('span.placeholder-label')).to.not.exist;
        done();
      }, function (e) { done(e); });
    });

    it('doesn\'t add if not field', function (done) {
      var partials = {
          schema: {
            _placeholder: true
          },
          data: '123'
        },
        node = document.createElement('div');

      node.setAttribute('name', 'title');
      sandbox.stub(edit, 'getSchemaAndData').returns(Promise.resolve(partials));

      placeholder('fakeRef', node).then(function (newNode) {
        expect(newNode.querySelector('.editor-placeholder')).to.not.exist;
        expect(newNode.querySelector('span.placeholder-label')).to.not.exist;
        done();
      }, function (e) { done(e); });
    });

    it('doesn\'t add if no _placeholder', function (done) {
      var partials = {
          schema: {
            _has: 'text'
          },
          data: '123'
        },
        node = document.createElement('div');

      node.setAttribute('name', 'title');
      sandbox.stub(edit, 'getSchemaAndData').returns(Promise.resolve(partials));

      placeholder('fakeRef', node).then(function (newNode) {
        expect(newNode.querySelector('.editor-placeholder')).to.not.exist;
        expect(newNode.querySelector('span.placeholder-label')).to.not.exist;
        done();
      }, function (e) { done(e); });
    });
  });
});