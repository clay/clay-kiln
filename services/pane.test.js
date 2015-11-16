var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./pane');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
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

    describe('open', function () {
      var fn = lib[this.title];

      it('opens a pane with header and innerEl', function () {
        var header = 'Test Pane',
          innerEl = document.createElement('div'),
          template = document.createElement('template'),
          headEl = document.createElement('div'),
          paneInnerEl = document.createElement('div'),
          toolbar = document.createElement('div');

        // add template
        template.classList.add('kiln-pane-template');
        headEl.classList.add('pane-header');
        paneInnerEl.classList.add('pane-inner');
        template.content.appendChild(headEl);
        template.content.appendChild(paneInnerEl);
        document.body.appendChild(template);

        // add toolbar
        toolbar.classList.add('kiln-toolbar');
        document.body.appendChild(toolbar);

        // run!
        innerEl.classList.add('test-pane');
        fn(header, innerEl);
        expect(document.querySelector('.pane-header').innerHTML).to.equal('Test Pane');
        expect(document.querySelector('.pane-inner').innerHTML).to.equal('<div class="test-pane"></div>');
      });
    });
  });
});
