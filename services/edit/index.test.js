var lib = require('./'),
  db = require('./../db'),
  site = require('./../site'),
  dom = require('./../dom'),
  cache = require('./cache'),
  sinon = require('sinon');

describe('edit service', function () {
  var sandbox,
    prefix = 'place.com';

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub(db);
    sandbox.stub(dom);
    sandbox.stub(site);
    sandbox.stub(cache);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getUriDestination', function () {
    var fn = lib[this.title];

    beforeEach(function () {
      site.set({
        prefix: prefix
      });
    });

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

    beforeEach(function () {
      site.set({
        prefix: prefix
      });
    });

    function expectPublish(uri, pageRef) {
      var data = prefix + pageRef,
        putData = {};

      dom.uri.returns(prefix + uri);
      db.getText.returns(Promise.resolve(data));
      db.get.returns(Promise.resolve(putData));
      db.save.withArgs(prefix + '/pages/thing@published').returns(Promise.resolve(putData));

      return putData;
    }

    it('publishes page with version', function () {
      var data = expectPublish('/thing@thing.html', '/pages/thing@otherthing');

      cache.getDataOnly.returns(Promise.resolve({}));

      return fn().then(function (result) {
        expect(result).to.equal(data);
      });
    });

    it('publishes page without version', function () {
      var data = expectPublish('/thing.html', '/pages/thing');

      cache.getDataOnly.returns(Promise.resolve({}));

      return fn().then(function (result) {
        expect(result).to.equal(data);
      });
    });

    it('publishes bare page', function () {
      var data = expectPublish('/pages/thing.html', '/pages/thing');

      cache.getDataOnly.returns(Promise.resolve({}));

      return fn().then(function (result) {
        expect(result).to.equal(data);
      });
    });
  });

  describe('removeFromParentList', function () {
    var fn = lib[this.title];

    beforeEach(function () {
      db.get.returns(Promise.resolve({a: [{_ref: 'b'}, {_ref: 'c'}]}));
      db.save.returns(Promise.resolve({}));
      db.getSchema.returns(Promise.resolve({}));
      site.addProtocol.returns('place.com/b');
      site.addPort.returns('place.com/b');
    });

    it('removes the item from the data', function () {
      return fn({el: {}, ref: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expect(db.save.calledWith('d', {a: [{_ref: 'c'}]})).to.equal(true);
      });
    });

    it('removes the item from the DOM', function () {
      var domEl = document.createElement('div');

      return fn({el: domEl, ref: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expect(dom.removeElement.calledWith(domEl)).to.equal(true);
      });
    });
  });

  describe('addToParentList', function () {
    var fn = lib[this.title];

    beforeEach(function () {
      db.get.returns(Promise.resolve({a: [{_ref: 'b'}, {_ref: 'c'}]}));
      db.save.returns(Promise.resolve({}));
      db.getSchema.returns(Promise.resolve({}));
      db.getHTML.returns(document.createElement('div'));
    });

    it('adds the item to the list data', function () {
      return fn({ref: 'newRef', prevRef: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expect(db.save.calledWith('d', {a: [{_ref: 'b'}, {_ref: 'newRef'}, {_ref: 'c'}]})).to.equal(true);
      });
    });

    it('adds the item to the end of the list data', function () {
      return fn({ref: 'newRef', prevRef: null, parentField: 'a', parentRef: 'd'}).then(function () {
        expect(db.save.calledWith('d', {a: [{_ref: 'b'}, {_ref: 'c'}, {_ref: 'newRef'}]})).to.equal(true);
      });
    });

    it('returns a new element', function () {
      return fn({ref: 'newRef', prevRef: 'b', parentField: 'a', parentRef: 'd'}).then(function (el) {
        expect(el instanceof Element).to.equal(true);
      });
    });
  });

  describe('createComponent', function () {
    var fn = lib[this.title];

    beforeEach(function () {
      site.get.withArgs('prefix').returns(prefix);
      db.create.returns(Promise.resolve({}));
    });

    it('creates a component with data', function () {
      return fn('fakeName', {fake: 'data'}).then(function () {
        expect(db.create.calledWith(prefix + '/components/fakeName/instances', {fake: 'data'})).to.equal(true);
      });
    });

    it('creates a component without data', function () {
      var bootstrapJson = {a: 1};

      db.get.returns(Promise.resolve(bootstrapJson));
      return fn('fakeName').then(function () {
        expect(db.create .calledWith(prefix + '/components/fakeName/instances', bootstrapJson)).to.equal(true);
      });
    });
  });
});
