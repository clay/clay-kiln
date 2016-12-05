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
        fn('save');
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
        lib.start('save');
        expect(document.querySelector('.bar')).to.not.equal(null);
        fn();
        setTimeout(expectNull, 0);
      });
    });

    describe('open', function () {
      var fn = lib[this.title];

      it('opens status message', function () {
        var message = 'hello';

        function expectNull() {
          expect(document.querySelector('.kiln-status').classList.contains('on')).to.equal(false);
          lib.close();
          done();
        }

        stubStatus();
        fn('save', message);
        expect(document.querySelector('.kiln-status').classList.contains('on')).to.equal(true);
        expect(document.querySelector('.kiln-status').innerHTML).to.equal(`<div class="kiln-status-message">${message}</div>`);
        setTimeout(expectNull, lib.timeoutMilliseconds);
      });

      it('opens status message with an action', function () {
        var message = 'hello',
          action = '<a href="http://google.com">ok google</a>';

        function expectNull() {
          expect(document.querySelector('.kiln-status').classList.contains('on')).to.equal(false);
          lib.close();
          done();
        }

        stubStatus();
        fn('save', message, action);
        expect(document.querySelector('.kiln-status').classList.contains('on')).to.equal(true);
        expect(document.querySelector('.kiln-status').innerHTML).to.equal(`<div class="kiln-status-message">${message}</div><div class="kiln-status-action">${action}</div>`);
        setTimeout(expectNull, lib.timeoutMilliseconds);
      });
    });
  });
});
