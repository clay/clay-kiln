var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./simple-list'),
  fixture = require('../test/fixtures/behavior')(),
  references = require('../services/references'),
  rivets = require('rivets'),
  _ = require('lodash'),
  dom = require('../services/dom'),
  data = [{
    text: 'foo'
  }, {
    text: 'bar'
  }];

// set some data
fixture.bindings.data = data;

function findBinding(name, view) {
  var bindings = view.bindings,
    binding = _.find(bindings, function (value) { return value.keypath === name; });

  return binding;
}

describe(dirname, function () {
  describe(filename, function () {
    describe('el', function () {
      it('has field property', function () {
        var resultEl = lib(fixture).el;

        expect(resultEl.getAttribute(references.fieldAttribute)).to.equal('foo');
      });
    });

    describe('bindings', function () {
      var result = lib(fixture),
        el = result.el,
        bindings = { foo: result.bindings },
        view;

      beforeEach(function () {
        view = rivets.bind(el, bindings);
      });

      afterEach(function () {
        view.unbind();
      });

      it('has two items', function () {
        expect(findBinding('foo.data', view).observer.value().length).to.equal(2);
        expect(el.querySelectorAll('.simple-list-item').length).to.equal(2);
      });

      it('selects on click', function () {
        var firstItem = dom.find(el, '.simple-list-item'),
          e = document.createEvent('MouseEvent'),
          items;

        function testEvent(e) {
          firstItem.dispatchEvent(e);
          items = findBinding('foo.data', view).observer.value();
          expect(items[0]).to.eql({ text: 'foo', _selected: true});
          expect(items[1]).to.eql({ text: 'bar', _selected: false});
        }

        e.initEvent('click', true, true);

        _.defer(testEvent.bind(null, e));
      });

      it('selects previous item on left keypress');

      it('selects next item on right or tab keypress');

      it('deletes item on delete or backspace keypress');

      it('selects previous item on delete (if a previous item exists)');

      it('focuses input on delete (if no previous items exist)');
    });
  });

  describe('simplelist binder', function () {
    var result = lib(fixture),
      el = result.el,
      bindings = { foo: result.bindings },
      addEl, view;

    beforeEach(function () {
      _.assign(rivets.binders, result.binders);
      view = rivets.bind(el, bindings);
      addEl = dom.find(el, '.simple-list-add');
    });

    afterEach(function () {
      view.unbind();
    });

    it('adds item on enter if text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = 'hello';
    });

    it('adds item on tab if text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = 'hello';
    });

    it('adds item on comma if text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = 'hello';
    });

    it('closes itself on enter if no text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = '';
    });

    it('closes itself on tab if no text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = '';
    });

    it('closes itself on comma if no text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);
    });

    it('selects last item on delete if no text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = '';
    });

    it('selects last item on backspace if no text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = '';
    });

    it('selects last item on left if no text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = '';
    });

    it('does not select last item on delete if text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = 'hello';
    });

    it('does not select last item on backspace if text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = 'hello';
    });

    it('does not select last item on left if text', function () {
      expect(findBinding('foo.data', view).observer.value().length).to.equal(2);

      addEl.value = 'hello';
    });
  });
});
