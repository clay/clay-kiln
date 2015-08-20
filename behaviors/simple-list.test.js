var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./simple-list'),
  fixture = require('../test/fixtures/behavior')(),
  references = require('../services/references'),
  rivets = require('rivets'),
  _ = require('lodash'),
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
    });
  });
});
