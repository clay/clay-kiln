var lib = require('./'),
  db = require('./db'),
  site = require('./../site'),
  dom = require('@nymag/dom'),
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
    expect(cache.saveForHTML.args[0][0]).to.deep.equal(expectedData, 'Expected saved value');
  }

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub(db);
    sandbox.stub(dom);
    sandbox.stub(cache);
    sandbox.stub(progress);
    sandbox.stub(site);

    // not under test
    site.get.withArgs('prefix').returns(prefix);
    site.addProtocol.returns('place.com/b');
    site.addPort.returns('place.com/b');

    db.getHTML.returns(document.createElement('div'));
    db.getHTMLWithQuery.returns(document.createElement('div'));
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('publishPage', function () {
    var fn = lib[this.title],
      fakeUrl = 'http://place.com/fake-url.html';

    it('publishes page with version', function () {
      var data = { url: fakeUrl };

      dom.pageUri.returns('thing');
      cache.getDataOnly.returns(resolveReadOnly(data));
      db.save.withArgs('thing@published').returns(resolveReadOnly(data));

      return fn().then(function (result) {
        expect(result).to.deep.equal(data.url);
      });
    });
  });

  describe('removeFromParentList', function () {
    var fn = lib[this.title];

    it('removes the item from component data', function () {
      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveThrough.returns(resolveReadOnly({}));
      cache.saveForHTML.returns(Promise.resolve('some html'));

      return fn({el: {}, ref: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expectSavedAs({a: [{_ref: 'c'}], _schema: {a: {}}, _ref: 'd'});
      });
    });

    it('removes the item from page data', function () {
      cache.getData.returns(resolveReadOnly({a: {value: 'a'}, _schema: {a: {}}, _ref: 'd'}));
      db.get.returns(resolveReadOnly({ a: ['b', 'c' ], _ref: 'e'}));
      dom.pageUri.returns('e');
      db.save.returns(resolveReadOnly({}));
      db.getHTML.returns(Promise.resolve('some html'));

      return fn({el: {}, ref: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expect(db.save.calledWith('e', {a: ['c']})).to.equal(true);
      });
    });

    it('removes the item from the DOM', function () {
      var domEl = document.createElement('div');

      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveThrough.returns(resolveReadOnly({}));
      cache.saveForHTML.returns(Promise.resolve('some html'));

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
      cache.saveForHTML.returns(Promise.resolve('some html'));

      return fn({ref: 'newRef', prevRef: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expectSavedAs({a: [{_ref: 'b'}, {_ref: 'newRef'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'});
      });
    });

    it('adds the item to the end of the list data', function () {
      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveThrough.returns(resolveReadOnly({}));
      cache.saveForHTML.returns(Promise.resolve('some html'));

      return fn({ref: 'newRef', prevRef: null, parentField: 'a', parentRef: 'd'}).then(function () {
        expectSavedAs({a: [{_ref: 'b'}, {_ref: 'c'}, {_ref: 'newRef'}], _schema: {a: {}}, _ref: 'd'});
      });
    });

    it('returns a new element', function () {
      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveThrough.returns(resolveReadOnly({}));
      cache.saveForHTML.returns(Promise.resolve('some html'));

      return fn({ref: 'newRef', parentField: 'a', parentRef: 'd'}).then(function (el) {
        expect(el instanceof Element).to.equal(true);
      });
    });

    it('adds the item to page data', function () {
      cache.getData.returns(resolveReadOnly({a: {value: 'a'}, _schema: {a: {}}, _ref: 'd'}));
      db.get.returns(resolveReadOnly({a: ['b', 'c'], _ref: 'e'}));
      dom.pageUri.returns('e');
      db.save.returns(resolveReadOnly({}));
      db.getHTML.returns(Promise.resolve('some html'));

      return fn({ref: 'newRef', prevRef: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expect(db.save.calledWith('e', {a: ['b', 'newRef', 'c']})).to.equal(true);
      });
    });

    it('adds the item to the end of page data', function () {
      cache.getData.returns(resolveReadOnly({a: {value: 'a'}, _schema: {a: {}}, _ref: 'd'}));
      db.get.returns(resolveReadOnly({a: [], _ref: 'e'}));
      dom.pageUri.returns('e');
      db.save.returns(resolveReadOnly({}));
      db.getHTML.returns(Promise.resolve('some html'));

      return fn({ref: 'newRef', prevRef: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expect(db.save.calledWith('e', {a: ['newRef']})).to.equal(true);
      });
    });
  });

  describe('addMultipleToParentList', function () {
    var fn = lib[this.title];

    it('adds items to the list data', function () {
      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveForHTML.returns(Promise.resolve('some html'));

      return fn({refs: ['newRef', 'otherRef'], prevRef: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expectSavedAs({a: [{_ref: 'b'}, {_ref: 'newRef'}, {_ref: 'otherRef'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'});
      });
    });

    it('adds the item to the end of the list data', function () {
      cache.getData.returns(resolveReadOnly({a: [{_ref: 'b'}, {_ref: 'c'}], _schema: {a: {}}, _ref: 'd'}));
      cache.saveForHTML.returns(Promise.resolve('some html'));

      return fn({refs: ['newRef', 'otherRef'], prevRef: null, parentField: 'a', parentRef: 'd'}).then(function () {
        expectSavedAs({a: [{_ref: 'b'}, {_ref: 'c'}, {_ref: 'newRef'}, {_ref: 'otherRef'}], _schema: {a: {}}, _ref: 'd'});
      });
    });
  });

  describe('getPageUrl', function () {
    const fn = lib[this.title];

    it('gets a url', function () {
      expect(fn()).to.equal('place.com/b.html');
    });
  });

  describe('createPage', function () {
    var fn = lib[this.title];

    it('creates a page from /pages/new', function () {
      var data = {};

      cache.getDataOnly.returns(resolveReadOnly(data));
      db.create.returns(Promise.resolve({}));

      cache.getDataOnly(prefix + '/pages/new');

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

    it('clones child component in componentlist', function () {
      var baseData = {
          a: [{
            _ref: prefix + '/components/fakeChild'
          }]
        },
        childData = {
          _ref: prefix + '/components/fakeChild/instances/0'
        },
        newData = {
          a: [{
            _ref: prefix + '/components/fakeChild/instances/0'
          }]
        };

      cache.getDataOnly.withArgs(prefix + '/components/fakeName').returns(resolveReadOnly(baseData));
      cache.createThrough.withArgs(prefix + '/components/fakeName/instances').returns(resolveReadOnly(baseData));
      cache.getDataOnly.withArgs(prefix + '/components/fakeChild').returns(resolveReadOnly({}));
      cache.createThrough.withArgs(prefix + '/components/fakeChild/instances').returns(resolveReadOnly(childData));
      cache.saveThrough.returnsArg(0);

      return fn('fakeName').then(function (res) {
        expect(res).to.deep.equal(newData);
        expect(cache.createThrough.calledWith(prefix + '/components/fakeName/instances', baseData)).to.equal(true);
        expect(cache.createThrough.calledWith(prefix + '/components/fakeChild/instances')).to.equal(true);
        expect(cache.saveThrough.calledWith(newData)).to.equal(true);
      });
    });

    it('clones multiple child components in componentlist', function () {
      var baseData = {
          a: [{
            _ref: prefix + '/components/fakeChild'
          }, {
            _ref: prefix + '/components/fakeChild2'
          }]
        },
        child1Data = {
          _ref: prefix + '/components/fakeChild/instances/0'
        },
        child2Data = {
          _ref: prefix + '/components/fakeChild2/instances/0'
        },
        newData = {
          a: [{
            _ref: prefix + '/components/fakeChild/instances/0'
          }, {
            _ref: prefix + '/components/fakeChild2/instances/0'
          }]
        };

      cache.getDataOnly.withArgs(prefix + '/components/fakeName').returns(resolveReadOnly(baseData));
      cache.createThrough.withArgs(prefix + '/components/fakeName/instances').returns(resolveReadOnly(baseData));

      cache.getDataOnly.withArgs(prefix + '/components/fakeChild').returns(resolveReadOnly({}));
      cache.createThrough.withArgs(prefix + '/components/fakeChild/instances').returns(resolveReadOnly(child1Data));

      cache.getDataOnly.withArgs(prefix + '/components/fakeChild2').returns(resolveReadOnly({}));
      cache.createThrough.withArgs(prefix + '/components/fakeChild2/instances').returns(resolveReadOnly(child2Data));

      cache.saveThrough.returnsArg(0);

      return fn('fakeName').then(function (res) {
        expect(res).to.deep.equal(newData);
        expect(cache.createThrough.calledWith(prefix + '/components/fakeName/instances', baseData)).to.equal(true);
        expect(cache.createThrough.calledWith(prefix + '/components/fakeChild/instances')).to.equal(true);
        expect(cache.createThrough.calledWith(prefix + '/components/fakeChild2/instances')).to.equal(true);
        expect(cache.saveThrough.calledWith(newData)).to.equal(true);
      });
    });
  });

  describe('removeUri', function () {
    var fn = lib[this.title];

    it('throws error when passing in url', function () {
      var url = 'http://domain:3333/path';

      db.isUrl.returns(true);
      db.removeText.returns(resolveReadOnly({}));

      function result() {
        return fn(url);
      }

      expect(result).to.throw(TypeError);
    });

    it('removes from db', function () {
      var uri = 'domain/path',
        expectedTarget = 'place.com/uris/ZG9tYWluL3BhdGg=';

      db.isUri.returns(true);
      db.removeText.returns(resolveReadOnly({}));

      return fn(uri).then(function () {
        sinon.assert.calledWithExactly(db.removeText, expectedTarget);
      });
    });
  });

  describe('schedulePublish', function () {
    var fn = lib[this.title];

    it('POSTs to /schedule', function () {
      var data = {
        at: 1,
        publish: 'fakeRef'
      };

      db.create.returns(Promise.resolve({}));

      return fn(data).then(function () {
        sinon.assert.calledWith(db.create, sinon.match.string, data);
      });
    });

    describe('getComponentRef', function () {
      var fn = lib[this.title];

      it('resolves a component reference', function () {
        dom.pageUri.returns('/pages/foo');
        function expectRef(ref) {
          expect(ref).to.equal('/components/fakeRef');
        }
        return fn('/components/fakeRef').then(expectRef);
      });

      it('resolves a layout reference from a page uri', function () {
        dom.pageUri.returns('/pages/foo');
        cache.getDataOnly.returns(Promise.resolve({ layout: '/components/fakeLayout' }));
        function expectRef(ref) {
          expect(ref).to.equal('/components/fakeLayout');
        }
        return fn('/pages/foo').then(expectRef);
      });
    });
  });

  describe('getHTMLWithQuery', function () {
    var fn = lib[this.title],
      url = 'fake/uri/to/component',
      query = '?query=foobar';



    it('throws error if not passing in a query', function () {
      function result() {
        return fn(url);
      }
      expect(result).to.throw();
    });

    it('returns html for a component', function () {
      db.getHTMLWithQuery.returns(Promise.resolve('some html'));

      function result() {
        return fn(url, query);
      }

      result().then(function (resp) {
        expect(resp).to.equal('some html');
      });
    });
  });
});
