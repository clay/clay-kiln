var _ = require('lodash'),
  lib = require('./cache'),
  db = require('./db'),
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

    it('returns read-only data', function () {
      db.get.returns(Promise.resolve({some: 'data'}));
      db.getSchema.returns(Promise.resolve({some: 'schema'}));
      return fn('foo').then(function (data) {
        expect(Object.isFrozen(data)).to.equal(true);
      });
    });

    it('returns data with self-reference', function () {
      db.get.returns(Promise.resolve({some: 'data'}));
      db.getSchema.returns(Promise.resolve({some: 'schema'}));
      return fn('foo').then(function (data) {
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

    it('returns read-only data', function () {
      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn('foo').then(function (data) {
        expect(Object.isFrozen(data)).to.equal(true);
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

    it('returns read-only data', function () {
      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn('foo').then(function (data) {
        expect(Object.isFrozen(data)).to.equal(true);
      });
    });
  });

  describe('saveThrough', function () {
    var fn = lib[this.title];

    it('saves', function () {
      var data = {_ref: 'foo'};

      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.save.returns(Promise.resolve({foo: 'bar'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn(data).then(function () {
        expect(db.save.called).to.equal(true);
      });
    });

    it('returns read-only', function () {
      var data = {_ref: 'foo'};

      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.save.returns(Promise.resolve({foo: 'bar'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn(data).then(function (result) {
        expect(Object.isFrozen(result)).to.equal(true);
      });
    });

    it('remembers through getDataOnly (caches return values)', function () {
      var uri = 'foo',
        data = {_ref: uri},
        fetched = {foo: 'bar1'},
        returnSelf = {foo: 'bar2'},
        schema = {foo: 'bar'};

      db.get.returns(Promise.resolve(fetched));
      db.save.returns(Promise.resolve(returnSelf));
      db.getSchema.returns(Promise.resolve(schema));
      return fn(data).then(function () {
        expect(lib.getDataOnly.cache.get(uri)).to.deep.equal({foo: 'bar2', _ref: uri});
      });
    });

    it('remembers through getData(caches return values)', function () {
      var uri = 'foo',
        data = {_ref: uri},
        fetched = {foo: 'bar1'},
        returnSelf = {foo: 'bar2'},
        schema = {foo: 'bar'};

      db.get.returns(Promise.resolve(fetched));
      db.save.returns(Promise.resolve(returnSelf));
      db.getSchema.returns(Promise.resolve(schema));
      return fn(data).then(function () {
        expect(lib.getData.cache.get(uri)).to.deep.equal({foo: 'bar2', _ref: uri, _schema: schema});
      });
    });
  });

  describe('createThrough', function () {
    var fn = lib[this.title];

    it('creates', function () {
      var data = {};

      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.create.returns(Promise.resolve({foo: 'bar', _ref: 'fooSelf'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn('foo', data).then(function () {
        expect(db.create.called).to.equal(true);
      });
    });

    it('returns read-only', function () {
      var data = {};

      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.create.returns(Promise.resolve({foo: 'bar', _ref: 'fooSelf'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn('foo', data).then(function (result) {
        expect(Object.isFrozen(result)).to.equal(true);
      });
    });

    it('throws without self reference', function (done) {
      var data = {};

      db.get.returns(Promise.resolve({foo: 'bar'}));
      db.create.returns(Promise.resolve({foo: 'bar'}));
      db.getSchema.returns(Promise.resolve({foo: 'bar'}));
      return fn('foo', data).then(function (result) {
        done('should throw: ' + result);
      }, function () {
        done();
      });
    });

    it('remembers through getDataOnly (caches return values)', function () {
      var data = {},
        uri = 'foo',
        selfUri = 'selfFoo',
        fetched = {foo: 'bar1'},
        returnSelf = {foo: 'bar2', _ref: selfUri},
        schema = {foo: 'bar'};

      db.get.returns(Promise.resolve(fetched));
      db.create.returns(Promise.resolve(returnSelf));
      db.getSchema.returns(Promise.resolve(schema));
      return fn(uri, data).then(function () {
        expect(lib.getDataOnly.cache.get(selfUri)).to.deep.equal({foo: 'bar2', _ref: selfUri});
      });
    });

    it('remembers through getData (caches return values)', function () {
      var data = {},
        uri = 'foo',
        selfUri = 'selfFoo',
        fetched = {foo: 'bar1'},
        returnSelf = {foo: 'bar2', _ref: selfUri},
        schema = {foo: 'bar'};

      db.get.returns(Promise.resolve(fetched));
      db.create.returns(Promise.resolve(returnSelf));
      db.getSchema.returns(Promise.resolve(schema));
      return fn(uri, data).then(function () {
        expect(lib.getData.cache.get(selfUri)).to.deep.equal({foo: 'bar2', _ref: selfUri, _schema: schema});
      });
    });
  });
});