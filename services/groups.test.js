var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./groups'),
  references = require('./references');

describe(dirname, function () {
  describe(filename, function () {
    describe('expandFields', function () {
      var fn = lib[this.title];

      it('throws an error if not an array', function () {
        var fields = 'foo',
          result = function () { return fn(fields); };

        expect(result).to.throw(Error);
      });

      /**
       * By this point, all schema values should be converted into { value, _schema } form, so there is
       * no excuse for a mismatch, therefore this is a programmer error.  Even undefined should be
       * { value: undefined, _schema: {...} }
       */
      it('Does not throw an error if field doesn\'t exist in the data', function () {
        var fields = ['foo', 'bar'],
          componentData = {
            foo: {
              value: 'foo',
              _schema: { _has: 'text', _name: 'foo' }
            },
            _schema: {
              _groups: {
                one: { fields: fields }
              }
            }
          };

        expect(function () { return fn(fields, componentData); }).to.throw(Error);
      });

      it('expands fields', function () {
        var fields = ['foo', 'bar'],
          fooData = {
            value: 'foo',
            _schema: { _has: 'text', _name: 'foo' }
          },
          barData = {
            value: 'bar',
            _schema: { _has: 'text', _name: 'foo' }
          },
          componentData = {
            foo: fooData,
            bar: barData,
            _schema: {
              _groups: {
                one: { fields: fields }
              }
            }
          };

        expect(fn(fields, componentData)).to.eql([fooData, barData]);
      });
    });

    describe('getSettingsFields', function () {
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
        })).to.eql([fooData]);
      });

      it('returns returns explicit settings group if specified', function () {
        var fooData = {
            value: 'foo',
            _schema: { _display: 'settings' }
          },
          barData = {
            value: 'bar',
            _schema: { _display: 'settings' }
          },
          groupData = {
            fields: ['bar', 'foo'], // note, order is different than the property order
            _name: 'settings'
          };

        expect(fn({
          foo: fooData,
          bar: barData,
          _schema: {
            _groups: {
              settings: groupData
            }
          }
        })).to.eql([barData, fooData]);
      });
    });

    describe('get', function () {
      var fn = lib[this.title],
        fooData = {
          value: 'foo',
          _schema: { _name: 'foo', _display: 'settings' }
        },
        barData = {
          value: 'bar',
          _schema: { _name: 'bar', _display: 'overlay' }
        },
        groupData = {
          fields: ['foo', 'bar'],
          _name: 'foobar'
        },
        stubData = {
          foo: fooData,
          bar: barData,
          _schema: {
            _groups: {
              foobar: groupData
            }
          }
        },
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('throws an error if field or group not found', function () {
        var result = function () {
          return fn('fakeRef', stubData, 'fakePath');
        };

        expect(result).to.throw(Error);
      });

      it('gets a field', function () {
        expect(fn('fakeRef', stubData, 'foo')).to.eql(fooData);
      });

      it('gets the settings group if no path is specified', function () {
        sandbox.stub(references, 'getComponentNameFromReference').withArgs('fakeRef').returns('fake');

        expect(fn('fakeRef', stubData)).to.eql({
          value: [fooData],
          _schema: { _display: 'settings', _label: 'Fake Settings', _name: 'settings' }
        });
      });
    });
  });
});
