var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./page-state'),
  references = require('./references'),
  edit = require('./edit'),
  dom = require('./dom');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox, getDataOnly;

    function stubCanonicalUrl() {
      var el = document.createElement('div');

      el.setAttribute(references.referenceAttribute, 'domain.com/components/clay-meta-url/instances/fakeInstance');
      return el;
    }

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(dom, 'find').returns(stubCanonicalUrl());
      getDataOnly = sandbox.stub(edit, 'getDataOnly');
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('get', function () {
      var fn = lib[this.title];

      function expectState(expectedState) {
        return function (state) {
          expect(state).to.eql(expectedState);
        };
      }

      it('gets scheduled state', function () {
        getDataOnly.onFirstCall().returns(Promise.resolve());
        getDataOnly.onSecondCall().returns(Promise.reject());
        return fn().then(expectState({ scheduled: true, published: false }));
      });

      it('gets published state', function () {
        getDataOnly.onFirstCall().returns(Promise.reject());
        getDataOnly.onSecondCall().returns(Promise.resolve({ url: 'foo' }));
        return fn().then(expectState({ scheduled: false, published: true }));
      });

      it('gets scheduled and published state', function () {
        getDataOnly.onFirstCall().returns(Promise.resolve());
        getDataOnly.onSecondCall().returns(Promise.resolve({ url: 'foo' }));
        return fn().then(expectState({ scheduled: true, published: true }));
      });

      it('gets neither state', function () {
        getDataOnly.onFirstCall().returns(Promise.reject());
        getDataOnly.onSecondCall().returns(Promise.reject());
        return fn().then(expectState({ scheduled: false, published: false }));
      });
    });
  });
});
