var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  _ = require('lodash'),
  lib = require('./progress');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    function removeAll(selector) {
      var els = document.querySelectorAll(selector);

      _.each(els, function (el) {
        el.parentNode.removeChild(el);
      });
    }

    function stubWrapper() {
      var el = document.createElement('div'),
        wrapperClass = 'kiln-progress-wrapper';

      removeAll('.' + wrapperClass);
      el.classList.add(wrapperClass);
      document.body.appendChild(el);
    }

    function stubStatus() {
      var el = document.createElement('div'),
        statusClass = 'kiln-status';

      removeAll('.' + statusClass);
      el.classList.add(statusClass);
      document.body.appendChild(el);
    }

    describe('start', function () {
      var fn = lib[this.title];

      it('starts a progress bar', function () {
        stubWrapper();
        fn('blue');
        expect(document.querySelector('.bar')).to.not.equal(null);
        lib.done();
      });
    });

    describe('done', function () {
      var fn = lib[this.title];

      it('finished a progress bar', function () {
        function expectNull() {
          expect(document.querySelector('.bar')).to.equal(null);
        }

        stubWrapper();
        lib.start('blue');
        expect(document.querySelector('.bar')).to.not.equal(null);
        fn();
        setTimeout(expectNull, 0);
      });
    });

    describe('open', function () {
      var fn = lib[this.title];

      it('opens status message', function () {
        var message = '<span>hello</span>';

        function expectNull() {
          expect(document.querySelector('.kiln-status').classList.contains('on')).to.equal(false);
          lib.close();
          done();
        }

        stubStatus();
        fn('blue', message, 1000);
        expect(document.querySelector('.kiln-status').classList.contains('on')).to.equal(true);
        expect(document.querySelector('.kiln-status').innerHTML).to.equal(message);
        setTimeout(expectNull, 1001);
      });
    });
  });
});
