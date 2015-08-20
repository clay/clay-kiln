var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./simple-list'),
  fixture = require('../test/fixtures/behavior'),
  references = require('../services/references'),
  data = [
    {
      text: 'foo'
    }, {
      text: 'bar'
    }
  ];

// set some data
fixture.bindings.data = data;

describe(dirname, function () {
  describe(filename, function () {
    describe('el', function () {
      it('has field property', function () {
        var resultEl = lib(fixture).el;

        expect(resultEl.getAttribute(references.fieldAttribute)).to.equal('foo');
      });
    });

    describe('bindings', function () {
      var resultEl = lib(fixture).el
    });
  });
});
