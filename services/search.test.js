var lib = require('./search');

describe('search service', function () {
  var sandbox;


  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getBinarySortedInsertPosition', function () {
    var fn = lib[this.title];

    it('finds simple equality position', function () {
      var list = [1, 3, 5, 7, 9, 11, 13, 17, 19, 23],
        num = 7,
        result = 3;

      expect(fn(list, num)).to.equal(result);
    });

    it('finds simple equality position (high bound)', function () {
      var list = [1, 3, 5, 7, 9, 11, 13, 17, 19, 23],
        num = 23,
        result = list.length - 1;

      expect(fn(list, num)).to.equal(result);
    });

    it('finds simple equality position (low bound)', function () {
      var list = [1, 3, 5, 7, 9, 11, 13, 17, 19, 23],
        num = 1,
        result = 0;

      expect(fn(list, num)).to.equal(result);
    });

    it('finds insertion position', function () {
      var list = [1, 3, 5, 7, 9, 11, 13, 17, 19, 23],
        num = 14,
        result = 7;

      expect(fn(list, num)).to.equal(result);
    });

    it('finds insertion position (above high bound)', function () {
      var list = [1, 3, 5, 7, 9, 11, 13, 17, 19, 23],
        num = 25,
        result = list.length;

      expect(fn(list, num)).to.equal(result);
    });

    it('finds insertion position (below low bound)', function () {
      var list = [1, 3, 5, 7, 9, 11, 13, 17, 19, 23],
        num = 0,
        result = 0;

      expect(fn(list, num)).to.equal(result);
    });
  });
});
