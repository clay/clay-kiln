'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./form-creator'), //static-analysis means this must be string, not ('./' + filename);
  behaviors = require('./behaviors'),
  nameIsRequired = /name is required/i,
  schemaIsRequired = /schema is required/i,
  singleItem = {thing: {value: 'hi', _schema: {_has: ['text']}}, _schema: {thing: {_has: ['text']}}};

describe(dirname, function () {
  describe(filename, function () {
    var sandbox,
      el;

    beforeEach(function () {
      el = document.createDocumentFragment();
      sandbox = sinon.sandbox.create();
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

    function expectSingleItemBehavior(display) {
      sandbox.mock(behaviors).expects('run').withArgs({
        data: { _schema: { _has: ['text'] }, value: 'hi' },
        display: display,
        name: 'thing',
        path: 'thing'
      }).once();
    }

    describe('createForm', function () {
      var fn = lib[this.title];

      it('name is required', function () {
        expectNoLogging();
        expect(function () {
          fn('', {}, el);
        }).to.throw(nameIsRequired);
      });

      it('schema is required', function () {
        expectNoLogging();
        expect(function () {
          fn('some name', {}, el);
        }).to.throw(schemaIsRequired);
      });

      it('can show basic template', function () {
        expectNoLogging();
        fn('some name', {_schema: {}}, el);

        expect(condense(el.firstElementChild.innerHTML)).to.equal(condense(`
        <div class="editor-modal">
          <section class="editor">
            <header>Some Name</header>
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
        //expectNoLogging();
        expectSingleItemBehavior('modal');

        fn('some name', singleItem, el);

        expect(condense(el.firstElementChild.innerHTML)).to.equal(condense(`
        <div class="editor-modal">
          <section class="editor">
            <header>Some Name</header>
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
    });

    describe('createInlineForm', function () {
      var fn = lib[this.title];

      it('name is required', function () {
        expectNoLogging();
        expect(function () {
          fn('', {}, el);
        }).to.throw(nameIsRequired);
      });

      it('schema is required', function () {
        expectNoLogging();
        expect(function () {
          fn('some name', {}, el);
        }).to.throw(schemaIsRequired);
      });

      it('can show basic template', function () {
        expectNoLogging();
        fn('some name', {_schema: {}}, el);

        expect(condense(el.firstElementChild.innerHTML)).to.equal(condense(`
        <form>
          <div class="input-container"></div>
          <div class="button-container">
            <button type="submit" class="save">Save</button>
          </div>
         </form>`));

        sandbox.verify();
      });

      it('can show item in template', function () {
        //expectNoLogging();
        expectSingleItemBehavior('inline');

        fn('some name', singleItem, el);

        expect(condense(el.firstElementChild.innerHTML)).to.equal(condense(`
        <form>
          <div class="input-container"></div>
          <div class="button-container">
            <button type="submit" class="save">Save</button>
          </div>
         </form>`));

        sandbox.verify();
      });
    });
  });
});

