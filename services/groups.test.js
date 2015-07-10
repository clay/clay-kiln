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
          },
          expanded = fn(fields, componentData);

        // order should be preserved
        expect(expanded[0].field).to.equal('foo');
        expect(expanded[0].data).to.equal(fooData);

        expect(expanded[1].field).to.equal('bar');
        expect(expanded[1].data).to.equal(barData);
      });
    });
  });
});
