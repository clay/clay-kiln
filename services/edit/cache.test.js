var _ = require('lodash'),
  lib = require('./cache'),
  db = require('./../db'),
  expect = require('chai').expect,
  sinon = require('sinon');

describe('cache service', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub(db);

    lib.getData.cache = new _.memoize.Cache();
    lib.getDataOnly.cache = new _.memoize.Cache();
    lib.getSchema.cache = new _.memoize.Cache();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getData', function () {
    var fn = lib[this.title];

    it('returns data with schema', function () {
      db.get.returns(Promise.resolve({some: 'data'}));
      db.getSchema.returns(Promise.resolve({some: 'schema'}));
      return fn('foo').then(function (data) {
        expect(data).to.include.keys('_schema');
      });
    });

    it('returns data with self-reference', function () {
      db.get.returns(Promise.resolve({some: 'data'}));
      db.getSchema.returns(Promise.resolve({some: 'schema'}));
      return fn('foo').then(function (data) {

        console.log(data);

        expect(data).to.include.keys('_ref');
      });
    });

    it('gets deep data with deep schema', function () {
      db.get.returns(Promise.resolve({some: {more: 'things'}}));
      db.getSchema.returns(Promise.resolve({some: {more: {_things: 'to know'}}}));
      return fn('foo').then(function (data) {
        return expect(data.some.more._schema).to.deep.equal({_things: 'to know'});
      });
    });
  });

  describe('getDataOnly', function () {
    var fn = lib[this.title];

    it('does not have schema', function () {
      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.not.include.keys('_schema');
      });
    });

    it('returns self-reference', function () {
      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.include.keys('_ref');
      });
    });
  });

  describe('getSchema', function () {
    var fn = lib[this.title];

    it('gets schema', function () {
      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn('foo').then(function (data) {
        expect(data).to.deep.equal({foo: 'bar'});
      });
    });
  });
});