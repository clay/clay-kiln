'use strict';
var edit = require('./edit'),
  db = require('./db');

describe('edit service', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getData()', function () {
    it('gets data', function (done) {
      sandbox.stub(db, 'getComponentJSONFromReference').returns(Promise.resolve({foo:'bar'}));
      edit.getData('foo').then(function (data) {
        expect(data).to.eql({foo:'bar'});
        done();
      });
    });
  });

  describe('getSchema()', function () {
    it('gets schema', function (done) {
      sandbox.stub(db, 'getSchemaFromReference').returns(Promise.resolve({foo:'bar'}));
      edit.getData('foo').then(function (data) {
        expect(data).to.eql({foo:'bar'});
        done();
      });
    });
  });
});