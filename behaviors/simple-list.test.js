/* eslint max-nested-callbacks: [1, 5] */
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./simple-list'),
  data = [{
    text: 'foo'
  }, {
    text: 'bar'
  }],
  fixture = require('../test/fixtures/behavior')(data),
  references = require('../services/references');

// set some data
fixture.bindings.data = data;

// TODO: add more tests.

describe(dirname, function () {
  describe(filename, function () {
    describe('el', function () {
      it('has field property', function () {
        var resultEl = lib(fixture).el;

        expect(resultEl.getAttribute(references.fieldAttribute)).to.equal('foo');
      });
    });

    describe('bindings', function () {
      var bindings = lib(fixture).bindings,
        newData = {
          item: data[0],
          foo: bindings
        };

      describe('unselectAll', function () {
        var fn = bindings[this.title];

        it('unselects all items', function () {
          fn(null, newData);
          expect(data[0]._selected).to.equal(false);
          expect(data[1]._selected).to.equal(false);
        });
      });

      describe('selectItem', function () {
        var fn = bindings[this.title];

        it('selects an item', function () {
          fn(null, newData);
          expect(data[0]._selected).to.equal(true);
          expect(data[1]._selected).to.equal(false);
        });
      });
    });
  });
});
