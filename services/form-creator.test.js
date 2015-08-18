/* eslint max-nested-callbacks: [1, 5] */
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./form-creator'), // static-analysis means this must be string, not ('./' + filename);
  _ = require('lodash'),
  behaviors = require('./behaviors'),
  dom = require('./dom'),
  ds = require('dollar-slice'),
  refIsRequired = /ref\w* is required/i,
  dataIsRequired = /data is required/i,
  nameIsRequired = /_name is required/i,
  singleItem = {value: 'hi', _schema: {_name: 'thing', _has: ['text']}};

describe(dirname, function () {
  describe(filename, function () {
    var sandbox,
      el;

    beforeEach(function () {
      el = document.createDocumentFragment();
      sandbox = sinon.sandbox.create();
      sandbox.stub(ds);
    });

    afterEach(function () {
      sandbox.restore();
    });

    function condense(str) {
      return str.trim().replace(/>\W*</g, '><');
    }

    function expectNoLogging() {
      sandbox.mock(console).expects('log').never();
      sandbox.mock(console).expects('warn').never();
      sandbox.mock(console).expects('error').never();
    }

    function expectSingleItemBehavior() {
      var itemEl = document.createElement('div');

      itemEl.setAttribute('class', 'behaviour-element');

      sandbox.mock(behaviors).expects('run').withArgs(singleItem).once().returns(Promise.resolve({
        el: itemEl,
        binders: {},
        bindings: {},
        formatters: {},
        name: _.get(singleItem, '_schema._name')
      }));
    }

    describe('createForm', function () {
      var fn = lib[this.title];

      it('reference is required', function () {
        expectNoLogging();
        expect(function () {
          fn('', {}, el);
        }).to.throw(refIsRequired);
      });

      it('data is required', function () {
        expectNoLogging();
        expect(function () {
          fn('ref', null, el);
        }).to.throw(dataIsRequired);
      });

      it('_name is required', function () {
        expectNoLogging();
        expect(function () {
          fn('ref', {_schema: {}}, el);
        }).to.throw(nameIsRequired);
      });

      it('can show item in template', function () {
        expectNoLogging();
        expectSingleItemBehavior();

        return fn('ref', singleItem, el).then(function (result) {
          expect(condense(result.innerHTML)).to.equal(condense(`
          <div class="editor-overlay">
            <section class="editor">
              <header>Thing</header>
              <form>
                <div class="input-container">
                  <div class="behaviour-element"></div>
                </div>
                <div class="button-container">
                  <button type="submit" class="save">Save</button>
                </div>
              </form>
              </section>
            </div>`));

          sandbox.verify();
        });
      });
    });

    describe('createInlineForm', function () {
      var fn = lib[this.title];

      it('ref is required', function () {
        expectNoLogging();
        expect(function () {
          fn('', {}, el);
        }).to.throw(refIsRequired);
      });

      it('name is required', function () {
        expectNoLogging();
        expect(function () {
          fn('some ref', { _schema: {} }, el);
        }).to.throw(nameIsRequired);
      });

      it('can show item in template', function () {
        var childEl = document.createElement('div');

        el.appendChild(childEl);
        expectNoLogging();
        expectSingleItemBehavior('inline');

        return fn('ref', singleItem, childEl).then(function (result) {
          expect(condense(result.innerHTML)).to.equal(condense(`
          <form>
            <div class="input-container">
              <div class="behaviour-element"></div>
            </div>
           </form>`));

          sandbox.verify();
        });
      });
    });
  });
});
