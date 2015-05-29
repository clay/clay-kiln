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

    it('gets data with schema', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({some:'data'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({some:'schema'}));
      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({some: 'data', _schema: {some: 'schema'}});
      });
    });

    it('gets deep data with deep schema', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({some: {more: 'things'}}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({some: {more: {_things: 'to know'}}}));
      return fn('foo').then(function (data) {
        return expect(data).to.deep.equal({
          some: {
            more: {
              value: 'things',
              _schema: {_things: 'to know'}
            },
            _schema: {more: {_things: 'to know'}}
          },
          _schema: {some: {more: {_things: 'to know'}}}
        });
      });
    });
  });

  describe('getDataOnly', function () {
    var fn = lib[this.title];

    it('gets data', function () {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({foo:'bar'}));
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({foo:'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({foo:'bar'});
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