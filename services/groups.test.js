var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./groups');

describe(dirname, function () {
  describe(filename, function () {
    describe('expandFields', function () {
      var fn = lib[this.title];

      it('throws an error if not an array', function () {
        var fields = 'foo',
          result = function () { return fn(fields); };

        expect(result).to.throw(Error);
      });

      it('throws an error if field doesn\'t exist in the data', function () {
        var fields = ['foo', 'bar'],
          componentData = {
            foo: {
              value: 'foo',
              _schema: { _has: 'text' }
            },
            _groups: {
              one: { fields: fields }
            }
          },
          result = function () { return fn(fields, componentData); };

        expect(result).to.throw(Error);
      });

      it('expands fields', function () {
        var fields = ['foo', 'bar'],
          fooData = {
            value: 'foo',
            _schema: { _has: 'text' }
          },
          barData = {
            value: 'bar',
            _schema: { _has: 'text' }
          },
          componentData = {
            foo: fooData,
            bar: barData,
            _groups: {
              one: { fields: fields }
            }
          };

        expect(fn(fields, componentData)).to.eql([{
          field: 'foo',
          data: fooData
        }, {
          field: 'bar',
          data: barData
        }]);
      });
    });

    describe('getSettingsGroup', function () {
      var fn = lib[this.title];

      it('returns empty array if no fields', function () {
        expect(fn({})).to.eql([]);
      });

      it('returns empty array if no settings fields', function () {
        expect(fn({
          foo: {
            value: 'foo',
            _schema: { _display: 'overlay' }
          }
        })).to.eql([]);
      });

      it('returns array of settings fields', function () {
        var fooData = {
            value: 'foo',
            _schema: { _display: 'settings' }
          },
          barData = {
            value: 'bar',
            _schema: { _display: 'overlay' }
          };

        expect(fn({
          foo: fooData,
          bar: barData
        })).to.eql([{
          field: 'foo',
          data: fooData
        }]);
      });
    });
  });
});
