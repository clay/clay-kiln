/* eslint max-nested-callbacks: [1, 5] */
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./form-creator'), // static-analysis means this must be string, not ('./' + filename);
  behaviors = require('./behaviors'),
  dom = require('./dom'),
  ds = require('dollar-slice'),
  refIsRequired = /ref\w* is required/i,
  pathIsRequired = /path is required/i,
  schemaIsRequired = /schema is required/i,
  singleItem = {thing: {value: 'hi', _schema: {_has: ['text']}}, _schema: {thing: {_has: ['text']}}};

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

      sandbox.mock(behaviors).expects('run').withArgs({
        data: { _schema: { _has: ['text'] }, value: 'hi' },
        path: 'name.thing'
      }).once().returns(itemEl);
    }

    function expectMetaItemBehavior() {
      var itemEl = document.createElement('div');

      itemEl.setAttribute('class', 'behaviour-element');

      sandbox.mock(behaviors).expects('run').withArgs({
        data: { _schema: { _display: 'meta', _has: ['text'] }, value: 'hi' },
        path: 'name.thing'
      }).once().returns(itemEl);
    }

    describe('createForm', function () {
      var fn = lib[this.title];

      it('reference is required', function () {
        expectNoLogging();
        expect(function () {
          fn('', '', {}, el);
        }).to.throw(refIsRequired);
      });

      it('path is required', function () {
        expectNoLogging();
        expect(function () {
          fn('some ref', '', {}, el);
        }).to.throw(pathIsRequired);
      });

      it('schema is required', function () {
        expectNoLogging();
        expect(function () {
          fn('some name', 'some data', {}, el);
        }).to.throw(schemaIsRequired);
      });

      it('can show basic template', function () {
        expectNoLogging();
        fn('ref', 'name', {_schema: {}}, el);

        expect(condense(el.firstElementChild.innerHTML)).to.equal(condense(`
        <div class="editor-modal">
          <section class="editor">
            <header>Name</header>
            <form>
              <div class="input-container"></div>
              <div class="button-container">
                <button type="submit" class="save">Save</button>
              </div>
            </form>
            </section>
          </div>`));

        sandbox.verify();
      });

      it('can show item in template', function () {
        expectNoLogging();
        expectSingleItemBehavior();

        fn('ref', 'name', singleItem, el);

        expect(condense(el.firstElementChild.innerHTML)).to.equal(condense(`
        <div class="editor-modal">
          <section class="editor">
            <header>Name</header>
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

    describe('createMetaForm', function () {
      var fn = lib[this.title];

      it('filters out non-meta items', function () {
        var metaItems = {
          thing: {
            value: 'hi',
            _schema: {
              _has: ['text'],
              _display: 'meta'
            }
          },
          thing2: {
            value: 'bye',
            _schema: {
              _has: ['text']
            }
          },
          _schema: {
            thing: {
              value: 'hi',
              _schema: {
                _has: ['text'],
                _display: 'meta'
              }
            },
            thing2: {
              value: 'bye',
              _schema: {
                _has: ['text']
              }
            }
          }
        };

        expectNoLogging();
        expectMetaItemBehavior();

        fn('/components/name/id/foo', metaItems, el);

        expect(condense(el.firstElementChild.innerHTML)).to.equal(condense(`
        <div class="editor-modal">
          <section class="editor">
            <header>Name</header>
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

    describe('createInlineForm', function () {
      var fn = lib[this.title];

      it('ref is required', function () {
        expectNoLogging();
        expect(function () {
          fn('', '', {}, el);
        }).to.throw(refIsRequired);
      });

      it('name is required', function () {
        expectNoLogging();
        expect(function () {
          fn('some ref', '', {}, el);
        }).to.throw(pathIsRequired);
      });

      it('schema is required', function () {
        expectNoLogging();
        expect(function () {
          fn('some ref', 'some name', {}, el);
        }).to.throw(schemaIsRequired);
      });

      it('can show basic template', function () {
        var childEl = document.createElement('div');

        el.appendChild(childEl);
        expectNoLogging();
        fn('ref', 'name', {_schema: {}}, childEl);

        expect(condense(dom.find(el, '.editor-inline').innerHTML)).to.equal(condense(`
        <form>
          <div class="input-container"></div>
          <div class="button-container">
            <button type="submit" class="save">Save</button>
          </div>
         </form>`));

        sandbox.verify();
      });

      it('can show item in template', function () {
        var childEl = document.createElement('div');

        el.appendChild(childEl);
        expectNoLogging();
        expectSingleItemBehavior('inline');

        fn('ref', 'name', singleItem, childEl);

        expect(condense(dom.find(el, '.editor-inline').innerHTML)).to.equal(condense(`
        <form>
          <div class="input-container">
            <div class="behaviour-element"></div>
          </div>
          <div class="button-container">
            <button type="submit" class="save">Save</button>
          </div>
         </form>`));

        sandbox.verify();
      });
    });
  });
});
