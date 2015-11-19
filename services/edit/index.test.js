var lib = require('./'),
  db = require('./db'),
  site = require('./../site'),
  dom = require('./../dom'),
  cache = require('./cache'),
  control = require('./control'),
  progress = require('./../progress'),
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
    sandbox.stub(progress);

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
        canonicalUrl = prefix + uri,
        putData = {canonicalUrl: canonicalUrl};

      dom.uri.returns(canonicalUrl);
      db.getText.returns(Promise.resolve(data));

      return putData;
    }

    it('publishes page with version', function () {
      var data = expectPublish('/thing@thing.html', '/pages/thing@otherthing');

      cache.getDataOnly.returns(resolveReadOnly({}));
      db.save.withArgs(prefix + '/pages/thing@published').returns(resolveReadOnly(data));

      return fn().then(function (result) {
        expect(result).to.deep.equal('place.com/pages/thing.html');
      });
    });

    it('publishes page without version', function () {
      var data = expectPublish('/thing.html', '/pages/thing');

      cache.getDataOnly.returns(resolveReadOnly({}));
      db.save.withArgs(prefix + '/pages/thing@published').returns(resolveReadOnly(data));

      return fn().then(function (result) {
        expect(result).to.deep.equal('place.com/pages/thing.html');
      });
    });

    it('publishes bare page', function () {
      var data = expectPublish('/pages/thing.html', '/pages/thing');

      cache.getDataOnly.returns(resolveReadOnly({}));
      db.save.withArgs(prefix + '/pages/thing@published').returns(resolveReadOnly(data));

      return fn().then(function (result) {
        expect(result).to.deep.equal('place.com/pages/thing.html');
      });
    });

    it('publishes page without root ref', function () {
      var data = expectPublish('/thing.html', '/pages/thing');

      cache.getDataOnly.returns(resolveReadOnly({_ref: 'whatever'}));
      db.save.withArgs(prefix + '/pages/thing@published').returns(resolveReadOnly(data));

      return fn().then(function (result) {
        expect(result).to.deep.equal('place.com/pages/thing.html');
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

  describe('createPage', function () {
    var fn = lib[this.title];

    it('creates a page from /pages/new', function () {
      var data = {};

      cache.getDataOnly.returns(resolveReadOnly(data));
      db.create.returns(Promise.resolve({}));

      return fn().then(function () {
        sinon.assert.calledWith(cache.getDataOnly, prefix + '/pages/new');
        sinon.assert.calledWith(db.create, sinon.match.string, data);
      });
    });

    it('removes reference from cached data', function () {
      var data = {_ref: 'something'},
        expectedData = {};

      cache.getDataOnly.returns(resolveReadOnly(data));
      db.create.returns(Promise.resolve({}));

      return fn().then(function () {
        sinon.assert.calledWith(db.create, sinon.match.string, expectedData);
      });
    });

    it('returns new url', function () {
      var data = {};

      cache.getDataOnly.returns(resolveReadOnly(data));
      db.create.returns(Promise.resolve(data));

      return fn().then(function (url) {
        expect(url).to.equal('place.com/b');
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

  describe('createUri', function () {
    var fn = lib[this.title];

    it('adds to db', function () {
      var url = 'http://domain:3333/path',
        uri = 'domain/path/some-id',
        expectedTarget = 'place.com/uris/ZG9tYWluL3BhdGg=',
        expectedBody = 'domain/path/some-id';

      db.isUrl.returns(true);
      db.isUri.returns(true);
      db.saveText.returns(resolveReadOnly({}));

      return fn(url, uri).then(function () {
        sinon.assert.calledWithExactly(db.saveText, expectedTarget, expectedBody);
      });
    });
  });

  describe('removeUri', function () {
    var fn = lib[this.title];

    it('removes from db', function () {
      var url = 'http://domain:3333/path',
        expectedTarget = 'place.com/uris/aHR0cDovL2RvbWFpbjozMzMzL3BhdGg=';

      db.isUrl.returns(true);
      db.removeText.returns(resolveReadOnly({}));

      return fn(url).then(function () {
        sinon.assert.calledWithExactly(db.removeText, expectedTarget);
      });
    });
  });
});
