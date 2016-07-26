var lib = require('./interpolate-fields');

describe('field interpolation service', function () {
  it('interpolates property value if value exists', function () {
    var mockData = {
      mockProp: {
        value: 'some value'
      }
    };

    expect(lib('Value is ${mockProp}', mockData)).to.equal('Value is some value');
  });

  it('interpolates empty string if value is emptystring', function () {
    var mockData = {
      mockProp: {
        value: ''
      }
    };

    expect(fn('Value is ${mockProp}', mockData)).to.equal('Value is ');
  });

  it('interpolates empty string if value is null', function () {
    var mockData = {
      mockProp: {
        value: null
      }
    };

    expect(fn('Value is ${mockProp}', mockData)).to.equal('Value is ');
  });

  it('interpolates empty string if value is undefined', function () {
    var mockData = {
      mockProp: {
        value: undefined
      }
    };

    expect(fn('Value is ${mockProp}', mockData)).to.equal('Value is ');
  });
});
