var lib = require('./group-fields'),
  db = require('./db'),
  site = require('./../site'),
  dom = require('./../dom');

describe('group-fields service', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub(db);
    sandbox.stub(dom);
    sandbox.stub(site);
  });

  afterEach(function () {
    sandbox.restore();
  });


  describe('add', function () {
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

  describe('remove', function () {
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
});
