var lib = require('./edit'),
  db = require('./db'),
  site = require('./site'),
  dom = require('./dom');

describe('edit service', function () {
  var sandbox,
    prefix = 'place.com';

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    lib.setDataCache({});
    lib.setSchemaCache({});
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getData', function () {
    var fn = lib[this.title];

    it('returns data with schema', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({some: 'data'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({some: 'schema'}));
      return fn('foo').then(function (data) {
        expect(data).to.include.keys('_schema');
      });
    });

    it('returns data with self-reference', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({some: 'data'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({some: 'schema'}));
      return fn('foo').then(function (data) {
        expect(data).to.include.keys('_ref');
      });
    });

    it('gets deep data with deep schema', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({some: {more: 'things'}}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({some: {more: {_things: 'to know'}}}));
      return fn('foo').then(function (data) {
        return expect(data.some.more._schema).to.deep.equal({_things: 'to know'});
      });
    });
  });

  describe('getDataOnly', function () {
    var fn = lib[this.title];

    it('does not have schema', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({foo: 'bar'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({foo: 'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.not.include.keys('_schema');
      });
    });

    it('returns self-reference', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({foo: 'bar'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({foo: 'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.include.keys('_ref');
      });
    });
  });

  describe('getSchema', function () {
    var fn = lib[this.title];

    it('gets schema', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({foo: 'bar'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({foo: 'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({foo: 'bar'});
      });
    });
  });

  describe('addSchemaToData', function () {
    var fn = lib[this.title];

    it('number to object with schema', function () {
      expect(fn({
        num: {}
      }, {
        num: 123
      })).to.deep.equal({
        num: {
          _schema: {},
          value: 123
        },
        _schema: {
          num: {}
        }
      });
    });

    it('text to object with schema', function () {
      expect(fn({
        num: {}
      }, {
        num: '123'
      })).to.deep.equal({
        num: {
          _schema: {},
          value: '123'
        },
        _schema: {
          num: {}
        }
      });
    });

    it('undefined without schema', function () {
      expect(fn({}, {
        num: undefined
      })).to.deep.equal({
        num: undefined,
        _schema: {}
      });
    });

    it('missing property (different than undefined) with schema', function () {
      var schema = {num: {}},
        data = {};

      expect(fn(schema, data)).to.deep.equal({
        num: {_schema: {}, value: undefined},
        _schema: {num: {}}
      });
    });

    it('number without schema', function () {
      expect(fn({}, {
        num: 123
      })).to.deep.equal({
        num: 123,
        _schema: {}
      });
    });

    it('text without schema', function () {
      expect(fn({}, {
        num: '123'
      })).to.deep.equal({
        num: '123',
        _schema: {}
      });
    });

    it('ignores keywords', function () {
      var schema = {
          _groups: {num: {fields: []}}
        },
        data = {},
        result = {_schema: schema};

      expect(fn(schema, data)).to.deep.equal(result);
    });
  });

  describe('removeSchemaFromData', function () {
    var fn = lib[this.title];

    it('number to object with schema', function () {
      expect(fn({ num: { _schema: {}, value: 123 }, _schema: { num: {} } })).to.deep.equal({ num: 123 });
    });

    it('text to object with schema', function () {
      expect(fn({ num: { _schema: {}, value: '123' }, _schema: { num: {} } })).to.deep.equal({ num: '123' } );
    });

    it('undefined without schema', function () {
      expect(fn({ num: undefined })).to.deep.equal({ num: undefined });
    });

    it('number without schema', function () {
      expect(fn({ num: 123 })).to.deep.equal({ num: 123 });
    });

    it('text without schema', function () {
      expect(fn({ num: '123' })).to.deep.equal({ num: '123' } );
    });
  });

  describe('addGroupFieldsToData', function () {
    var fn = lib[this.title];

    it('accepts no groups', function () {
      var schema = {a: {}},
        data = {a: {}};

      expect(fn(data, schema)).to.deep.equal(data);
    });

    it('does nothing when given no groups', function () {
      var schema = {a: {}, _groups: {}},
        data = {a: {}};

      expect(fn(data, schema)).to.deep.equal(data);
    });

    it('creates single group', function () {
      var schema = {a: {}, _groups: {b: {fields: ['a']}}},
        data = {a: {}},
        result = {a: {}, b: {value: [{}], _schema: {_name: 'b', fields: ['a']}}};

      expect(fn(data, schema)).to.deep.equal(result);
    });

    it('ignores non-object groups properties', function () {
      var schema = {a: {}, _groups: {b: {fields: ['a']}, _c: 'hey'}},
        data = {a: {}},
        result = {a: {}, b: {value: [{}], _schema: {_name: 'b', fields: ['a']}}};

      expect(fn(data, schema)).to.deep.equal(result);
    });
  });

  describe('removeGroupFieldsFromData', function () {
    var fn = lib[this.title];

    it('accepts if there are no groups', function () {
      var schema = {a: {}},
        data = {a: {}};

      // explicitly return original object reference if no groups
      expect(fn(data, schema)).to.equal(data);
    });

    it('removes single group', function () {
      var schema = {a: {}, _groups: {b: {fields: ['a']}}},
        data = {a: {}, b: {value: [{}], _schema: {_name: 'b', fields: ['a']}}},
        result = {a: {}};

      // not edited in-place
      expect(fn(data, schema)).to.not.equal(data);

      // groups are removed
      expect(fn(data, schema)).to.deep.equal(result);
    });
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

      sandbox.stub(db, 'getTextFromReference').returns(Promise.resolve(data));

      return fn(prefix + '/thing/thing').then(function (result) {
        expect(result).to.equal(data);
      });
    });

    it('gets page from location', function () {
      var data = prefix + '/pages/thing';

      sandbox.stub(dom, 'uri').returns(prefix + '/thing/thing');
      sandbox.stub(db, 'getTextFromReference').returns(Promise.resolve(data));

      return fn().then(function (result) {
        expect(result).to.equal(data);
      });
    });

    it('gets page from redirect uri', function () {
      var redirect = prefix + '/uris/cGxhY2UuY29tL3RoaW5nL3RoaW5n',
        data = prefix + '/pages/thing',
        stub = sandbox.stub(db, 'getTextFromReference');

      stub.withArgs(redirect).returns(Promise.resolve(data));
      stub.returns(Promise.resolve(redirect));
      sandbox.stub(dom, 'uri').returns(prefix + '/thing/thing');

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
      var data = pageRef,
        putData = {};

      sandbox.stub(dom, 'uri').returns(uri);
      sandbox.stub(db, 'getTextFromReference').returns(Promise.resolve(data));
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve(putData));
      sandbox.mock(db).expects('putToReference').withArgs(prefix + '/pages/thing@published').returns(Promise.resolve(putData));

      return putData;
    }

    it('publishes page with version', function () {
      var data = expectPublish(prefix + '/thing@thing.html', prefix + '/pages/thing@otherthing');

      return fn().then(function (result) {
        sandbox.verify();
        expect(result).to.equal(data);
      });
    });

    it('publishes page without version', function () {
      var data = expectPublish(prefix + '/thing.html', prefix + '/pages/thing');

      return fn().then(function (result) {
        sandbox.verify();
        expect(result).to.equal(data);
      });
    });

    it('publishes bare page', function () {
      var data = expectPublish(prefix + '/pages/thing.html', prefix + '/pages/thing');

      return fn().then(function (result) {
        sandbox.verify();
        expect(result).to.equal(data);
      });
    });
  });

  describe('removeFromParentList', function () {
    var fn = lib[this.title];

    beforeEach(function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({a: [{_ref: 'b'}, {_ref: 'c'}]}));
      sandbox.stub(db, 'putToReference').returns(Promise.resolve({}));
      sandbox.stub(dom, 'removeElement');
      sandbox.stub(site, 'addProtocol').returns('place.com/b');
      sandbox.stub(site, 'addPort').returns('place.com/b');
    });

    it('removes the item from the data', function () {
      return fn({el: {}, ref: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expect(db.putToReference.calledWith('d', {a: [{_ref: 'c'}]})).to.equal(true);
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
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({a: [{_ref: 'b'}, {_ref: 'c'}]}));
      sandbox.stub(db, 'putToReference').returns(Promise.resolve({}));
      sandbox.stub(db, 'getComponentHTMLFromReference').returns(document.createElement('div'));
      sandbox.stub(dom, 'removeElement');
    });

    it('adds the item to the list data', function () {
      return fn({ref: 'newRef', prevRef: 'b', parentField: 'a', parentRef: 'd'}).then(function () {
        expect(db.putToReference.calledWith('d', {a: [{_ref: 'b'}, {_ref: 'newRef'}, {_ref: 'c'}]})).to.equal(true);
      });
    });

    it('adds the item to the end of the list data', function () {
      return fn({ref: 'newRef', prevRef: null, parentField: 'a', parentRef: 'd'}).then(function () {
        expect(db.putToReference.calledWith('d', {a: [{_ref: 'b'}, {_ref: 'c'}, {_ref: 'newRef'}]})).to.equal(true);
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
      sandbox.stub(db, 'postToReference').returns(Promise.resolve({}));
    });

    it('creates a component with data', function () {
      return fn('fakeName', {fake: 'data'}).then(function () {
        expect(db.postToReference.calledWith(prefix + '/components/fakeName/instances', {fake: 'data'})).to.equal(true);
      });
    });

    it('creates a component without data', function () {
      var bootstrapJson = {a: 1};

      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve(bootstrapJson));
      return fn('fakeName').then(function () {
        expect(db.postToReference .calledWith(prefix + '/components/fakeName/instances', bootstrapJson)).to.equal(true);
      });
    });
  });
});
