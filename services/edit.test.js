var lib = require('./edit'),
  db = require('./db'),
  dom = require('./dom');

describe('edit service', function () {
  var sandbox;

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
        return expect(data.some.more._schema).to.deep.equal({_things: 'to know', _name: 'more'});
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
          _schema: {
            _name: 'num'
          },
          value: 123
        },
        _schema: {
          num: { _name: 'num' }
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
          _schema: {
            _name: 'num'
          },
          value: '123'
        },
        _schema: {
          num: { _name: 'num' }
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

  describe('getUriDestination', function () {
    var fn = lib[this.title];

    it('gets page from string', function () {
      var data = '/pages/thing';

      sandbox.stub(db, 'getTextFromReference').returns(Promise.resolve(data));

      return fn('place.com/thing/thing').then(function (result) {
        expect(result).to.equal(data);
      });
    });

    it('gets page from location', function () {
      var data = '/pages/thing';

      sandbox.stub(dom, 'uri').returns('place.com/thing/thing');
      sandbox.stub(db, 'getTextFromReference').returns(Promise.resolve(data));

      return fn().then(function (result) {
        expect(result).to.equal(data);
      });
    });

    it('gets page from redirect uri', function () {
      var redirect = '/uris/cGxhY2UuY29tL3RoaW5nL3RoaW5n',
        data = '/pages/thing',
        stub = sandbox.stub(db, 'getTextFromReference');

      stub.withArgs(redirect).returns(Promise.resolve(data));
      stub.returns(Promise.resolve(redirect));
      sandbox.stub(dom, 'uri').returns('place.com/thing/thing');

      return fn().then(function (result) {
        expect(result).to.equal(data);
      });
    });
  });

  describe('publishPage', function () {
    var fn = lib[this.title];

    function expectPublish(uri, pageRef) {
      var data = pageRef,
        putData = {};

      sandbox.stub(dom, 'uri').returns(uri);
      sandbox.stub(db, 'getTextFromReference').returns(Promise.resolve(data));
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve(putData));
      sandbox.mock(db).expects('putToReference').withArgs('/pages/thing@published').returns(Promise.resolve(putData));

      return putData;
    }

    it('publishes page with version', function () {
      var data = expectPublish('place.com/thing@thing.html', '/pages/thing@otherthing');

      return fn().then(function (result) {
        sandbox.verify();
        expect(result).to.equal(data);
      });
    });

    it('publishes page without version', function () {
      var data = expectPublish('place.com/thing.html', '/pages/thing');

      return fn().then(function (result) {
        sandbox.verify();
        expect(result).to.equal(data);
      });
    });
  });
});
