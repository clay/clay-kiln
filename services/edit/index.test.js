var lib = require('./'),
  db = require('./db'),
  site = require('./../site'),
  dom = require('./../dom'),
  cache = require('./cache'),
  control = require('./control'),
  sinon = require('sinon');

describe('edit service', function () {
  var sandbox,
    prefix = 'place.com';

  /**
   * @param {*} data
   * @returns {Promise}
   */
  function resolveReadOnly(data) {
    data = control.setReadOnly(data);
    return Promise.resolve(data);
  }

  function expectSavedAs(expectedData) {
    expect(cache.saveThrough.args[0][0]).to.deep.equal(expectedData, 'Expected saved value');
  }

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub(db);
    sandbox.stub(dom);
    sandbox.stub(site);
    sandbox.stub(cache);

    // not under test
    site.get.withArgs('prefix').returns(prefix);
    site.addProtocol.returns('place.com/b');
    site.addPort.returns('place.com/b');

    db.getHTML.returns(document.createElement('div'));
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getUriDestination', function () {
    var fn = lib[this.title];

    it('gets page from string', function () {
      var data = prefix + '/pages/thing';

      db.getText.returns(Promise.resolve(data));
      dom.uri.throws();

      return fn(prefix + '/thing/thing').then(function (result) {
        expect(result).to.equal(data);
      });
    });

    it('gets page from location', function () {
      var data = prefix + '/pages/thing';

      db.getText.returns(Promise.resolve(data));
      dom.uri.returns(prefix + '/thing/thing');

      return fn().then(function (result) {
        expect(result).to.equal(data);
      });
    });

    it('gets page from redirect uri', function () {
      var redirect = prefix + '/uris/cGxhY2UuY29tL3RoaW5nL3RoaW5n',
        data = prefix + '/pages/thing';

      db.getText.withArgs(redirect).returns(Promise.resolve(data));
      db.getText.returns(Promise.resolve(redirect));
      dom.uri.returns(prefix + '/thing/thing');

      return fn().then(function (result) {
        expect(result).to.equal(data);
      });
    });
  });

  describe('publishPage', function () {
    var fn = lib[this.title];

    function expectPublish(uri, pageRef) {
      var data = prefix + pageRef,
        putData = {};

      dom.uri.returns(prefix + uri);
      db.getText.returns(Promise.resolve(data));

      return putData;
    }

    it('publishes page with version', function () {
      var data = expectPublish('/thing@thing.html', '/pages/thing@otherthing');

      cache.getDataOnly.returns(resolveReadOnly({}));
      db.save.withArgs(prefix + '/pages/thing@published').returns(resolveReadOnly({}));

      return fn().then(function (result) {
        expect(result).to.deep.equal(data);
      });
    });

    it('publishes page without version', function () {
      var data = expectPublish('/thing.html', '/pages/thing');

      cache.getDataOnly.returns(resolveReadOnly({}));
      db.save.withArgs(prefix + '/pages/thing@published').returns(resolveReadOnly({}));

      return fn().then(function (result) {
        expect(result).to.deep.equal(data);
      });
    });

    it('publishes bare page', function () {
      var data = expectPublish('/pages/thing.html', '/pages/thing');

      cache.getDataOnly.returns(resolveReadOnly({}));
      db.save.withArgs(prefix + '/pages/thing@published').returns(resolveReadOnly({}));

      return fn().then(function (result) {
        expect(result).to.deep.equal(data);
      });
    });
  });

  describe('removeFromParentList', function () {
    var fn = lib[this.title];

    it('removes the item from the data', function () {
      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveThrough.returns(resolveReadOnly({}));

      return fn({el: {}, ref: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expectSavedAs({a: [{_ref: 'c'}], _schema: {a: {}}, _ref: 'd'});
      });
    });

    it('removes the item from the DOM', function () {
      var domEl = document.createElement('div');

      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveThrough.returns(resolveReadOnly({}));

      return fn({el: domEl, ref: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expect(dom.removeElement.calledWith(domEl)).to.equal(true);
      });
    });
  });

  describe('addToParentList', function () {
    var fn = lib[this.title];

    it('adds the item to the list data', function () {
      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveThrough.returns(resolveReadOnly({}));

      return fn({ref: 'newRef', prevRef: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expectSavedAs({a: [{_ref: 'b'}, {_ref: 'newRef'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'});
      });
    });

    it('adds the item to the end of the list data', function () {
      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveThrough.returns(resolveReadOnly({}));

      return fn({ref: 'newRef', prevRef: null, parentField: 'a', parentRef: 'd'}).then(function () {
        expectSavedAs({a: [{_ref: 'b'}, {_ref: 'c'}, {_ref: 'newRef'}], _schema: {a: {}}, _ref: 'd'});
      });
    });

    it('returns a new element', function () {
      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveThrough.returns(resolveReadOnly({}));

      return fn({ref: 'newRef', prevRef: 'b', parentField: 'a', parentRef: 'd'}).then(function (el) {
        expect(el instanceof Element).to.equal(true);
      });
    });
  });

  describe('createComponent', function () {
    var fn = lib[this.title];

    it('creates a component with data', function () {
      cache.createThrough.returns(resolveReadOnly({}));

      return fn('fakeName', {fake: 'data'}).then(function () {
        expect(cache.createThrough.calledWith(prefix + '/components/fakeName/instances', {fake: 'data'})).to.equal(true);
      });
    });

    it('creates a component without data', function () {
      var bootstrapJson = {a: 1};

      cache.createThrough.returns(resolveReadOnly({}));
      cache.getDataOnly.returns(resolveReadOnly(bootstrapJson));

      return fn('fakeName').then(function () {
        expect(cache.createThrough.calledWith(prefix + '/components/fakeName/instances', bootstrapJson)).to.equal(true);
      });
    });
  });
});
