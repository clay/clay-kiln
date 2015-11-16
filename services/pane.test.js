var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./pane');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      var toolbar = document.createElement('div');

      toolbar.classList.add('kiln-toolbar');
      document.body.appendChild(toolbar);
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });


    describe('close', function () {
      var fn = lib[this.title];

      it('closes an open pane', function () {
        var pane = document.createElement('div');

        pane.classList.add('kiln-toolbar-pane-background');
        document.body.appendChild(pane);
        fn();
        expect(document.querySelector('kiln-toolbar-pane-background')).to.equal(null);
      });

      it('does nothing if no open pane', function () {
        fn();
        expect(document.querySelector('kiln-toolbar-pane-background')).to.equal(null);
      });
    });
  });
});
