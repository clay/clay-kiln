var lib = require('./schema-fields'),
  db = require('./db'),
  site = require('./../site'),
  dom = require('./../dom');

describe('schema-fields service', function () {
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

    it('number to object with schema', function () {
      expect(fn({
        num: {}
      }, {
        num: 123
      }))
        .to.deep.equal({
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
      }))
        .to.deep.equal({
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
      }))
        .to.deep.equal({
          num: undefined,
          _schema: {}
        });
    });

    it('null without schema', function () {
      expect(fn({}, {
        num: null
      }))
        .to.deep.equal({
          num: null,
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
      }))
        .to.deep.equal({
          num: 123,
          _schema: {}
        });
    });

    it('text without schema', function () {
      expect(fn({}, {
        num: '123'
      }))
        .to.deep.equal({
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

  describe('remove', function () {
    var fn = lib[this.title];

    it('number to object with schema', function () {
      expect(fn({num: {_schema: {}, value: 123}, _schema: {num: {}}})).to.deep.equal({num: 123});
    });

    it('text to object with schema', function () {
      expect(fn({num: {_schema: {}, value: '123'}, _schema: {num: {}}})).to.deep.equal({num: '123'});
    });

    it('undefined value with schema to undefined value', function () {
      expect(fn({num: {_schema: {}, value: undefined}, _schema: {num: {}}})).to.deep.equal({num: undefined});
    });

    it('null value with schema to null value', function () {
      expect(fn({num: {_schema: {}, value: null}, _schema: {num: {}}})).to.deep.equal({num: null});
    });

    it('undefined without schema', function () {
      expect(fn({num: undefined})).to.deep.equal({num: undefined});
    });

    it('null without schema', function () {
      expect(fn({num: null})).to.deep.equal({num: null});
    });

    it('number without schema', function () {
      expect(fn({num: 123})).to.deep.equal({num: 123});
    });

    it('text without schema', function () {
      expect(fn({num: '123'})).to.deep.equal({num: '123'});
    });
  });
});
