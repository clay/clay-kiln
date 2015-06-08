'use strict';
var lib = require('./edit'),
  db = require('./db');

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
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({some:'data'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({some:'schema'}));
      return fn('foo').then(function (data) {
        expect(data).to.include.keys('_schema');
      });
    });

    it('returns data with self-reference', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({some:'data'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({some:'schema'}));
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
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({foo:'bar'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({foo:'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.not.include.keys('_schema');
      });
    });

    it('returns self-reference', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({foo:'bar'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({foo:'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.include.keys('_ref');
      });
    });
  });

  describe('getSchema', function () {
    var fn = lib[this.title];

    it('gets schema', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({foo:'bar'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({foo:'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({foo:'bar'});
      });
    });
  });
});