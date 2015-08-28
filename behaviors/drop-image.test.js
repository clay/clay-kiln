var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  lib = require('./drop-image.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {


    it('fails if fixture.el is a DocumentFragment', function () { // Todo: is this a good thing?
      expect(function () {
        lib(fixture);
      }).to.throw(Error);
    });

    it('sets attributes for rivets, and sets onDrag/onDrop bindings', function () {
      var result;

      // fixture.el must be an element
      fixture.el = document.createElement('INPUT');
      result = lib(fixture);
      expect(result.el.getAttribute('rv-on-dragover')).to.eql('foo.onDrag');
      expect(result.el.getAttribute('rv-on-drop')).to.eql('foo.onDrop');
      expect(typeof result.bindings.onDrag).to.eql('function');
      expect(typeof result.bindings.onDrop).to.eql('function');
    });

  });
});
