var lib = require('./publish-validation'),
  dom = require('./dom'),
  edit = require('./edit');

// defaults for chai
chai.config.showDiff = true;
chai.config.truncateThreshold = 0;

describe('publish-validation service', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.spy(dom, 'create');
    sandbox.stub(dom, 'find');
    sandbox.stub(dom, 'findAll');
    sandbox.stub(edit);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('validate', function () {
    var fn = lib[this.title];

    it('handles empty rules', function () {
      var rules = [],
        expectedResults = [];

      return fn(rules).then(function (results) {
        expect(results).to.deep.equal(expectedResults);
      });
    });

    it('handles rules with errors', function () {
      var rules = [ { validate: function () { return ['bad']; } } ];

      return fn(rules).then(function (results) {
        expect(results.length).to.equal(1);
      });
    });

    it('handles rules with no errors', function () {
      var rules = [ { validate: function () { return []; } } ];

      return fn(rules).then(function (results) {
        expect(results.length).to.equal(0);
      });
    });

    it('handles rules that throw errors', function () {
      var rules = [ { validate: function () { throw new Error('hey'); } } ];

      return fn(rules).then(function (results) {
        expect(results.length).to.equal(1);
      });
    });

    it('avoids rules that are disabled', function () {
      var rules = [ { enabled: false, validate: function () { throw new Error('hey'); } } ];

      return fn(rules).then(function (results) {
        expect(results.length).to.equal(0);
      });
    });

    it('allows access to component data and sorted list of components', function () {
      var spy = sandbox.spy(),
        ref = '/components/a',
        data = {},
        rules = [{ validate: spy }];

      dom.findAll.withArgs('[data-uri]').returns([dom.create('<section data-uri="' + ref + '" />')]);
      edit.getData.withArgs(ref).returns(Promise.resolve(data));

      return fn(rules).then(function () {
        expect(spy.args[0][0]).to.deep.equal({refs: {'/components/a': {}}, components: ['a']});
      });
    });
  });
});
