var lib = require('./render'),
  sinon = require('sinon'),
  ds = require('dollar-slice'),
  edit = require('./edit'),
  select = require('./select'),
  db = require('./edit/db'),
  references = require('./references');

describe('render service', function () {
  var ref = 'localhost/components/foo/id/bar',
    sandbox, dsStub, editStub;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    dsStub = sandbox.stub(ds); // .controller() and .get()
    dsStub.get.returnsArg(1);
    sandbox.stub(db);
    editStub = sandbox.stub(edit, 'getData');
    // make sure it's calling the select service with the right options
    sandbox.stub(select, 'handler', sandbox.spy());
  });

  afterEach(function () {
    sandbox.restore();
  });

  function stubEl() {
    var node = document.createElement('div');

    node.setAttribute(references.referenceAttribute, ref);
    return node;
  }

  describe('addComponentsHandlers', function () {
    var fn = lib[this.title];

    it('adds handlers for components with schema', function (done) {
      var el = stubEl();

      editStub.returns(Promise.resolve({ foo: 'bar'}));
      fn(el).then(function () {
        expect(select.handler.callCount).to.equal(1);
        expect(select.handler.calledWith(el, {
          ref: ref,
          path: null,
          data: { foo: 'bar' } // data is passed through
        })).to.equal(true);
        done();
      }).catch(function (e) { done(e); });
    });

    it('adds handlers for components without schema', function (done) {
      var el = stubEl();

      editStub.returns(Promise.reject(new Error('404')));
      fn(el).then(function () {
        expect(select.handler.callCount).to.equal(1);
        expect(select.handler.calledWith(el, {
          ref: ref,
          path: null,
          data: {} // no data is bassed through
        })).to.equal(true);
        done();
      }).catch(function (e) { done(e); });
    });
  });

  describe('reloadComponent', function () {
    var fn = lib[this.title];

    it('reloads a single component', function (done) {
      var el = stubEl();

      db.getHTML.returns(Promise.resolve(el));

      fn('fakeRef').then(function (newEl) {
        expect(newEl).to.equal(undefined);
        done();
      });
    });
  });
});
