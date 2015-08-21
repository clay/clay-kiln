var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./checkbox-group'),
  _ = require('lodash'),
  data = {
    foo: true,
    bar: false
  },
  fixture = require('../test/fixtures/behavior')(data),
  args = {
    options: [{
      name: 'Foo',
      value: 'foo'
    }, {
      name: 'Bar',
      value: 'bar'
    }]
  };

describe(dirname, function () {
  describe(filename, function () {
    describe('el', function () {
      it('has multiple inputs', function () {
        var resultEl = lib(fixture, args).el;

        expect(resultEl.querySelectorAll('input').length).to.equal(2);
      });
    });

    it('uses option.name as the label', function () {
      var resultEl = lib(fixture, args).el;

      function getLabels() {
        return _.map(resultEl.querySelectorAll('label'), function (label) {
          return label.textContent;
        });
      }

      expect(getLabels()).to.contain('Foo', 'Bar');
    });

    it('uses option.value as the value', function () {
      var resultEl = lib(fixture, args).el;

      function getValues() {
        return _.map(resultEl.querySelectorAll('input'), function (input) {
          return input.value;
        });
      }

      expect(getValues()).to.contain('foo', 'bar');
    });
  });
});
