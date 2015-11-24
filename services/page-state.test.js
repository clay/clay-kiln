var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./page-state'),
  edit = require('./edit');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox, getDataOnly;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      getDataOnly = sandbox.stub(edit, 'getDataOnly');
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('get', function () {
      var fn = lib[this.title],
        scheduledRef = 'null@scheduled',
        pubbedRef = 'null@published';

      function expectState(expectedState) {
        return function (state) {
          expect(state).to.eql(expectedState);
        };
      }

      it('gets scheduled state', function () {
        getDataOnly.withArgs(scheduledRef).returns(Promise.resolve());
        getDataOnly.withArgs(pubbedRef).returns(Promise.reject());
        return fn().then(expectState({ scheduled: true, published: false }));
      });

      it('gets published state', function () {
        getDataOnly.withArgs(scheduledRef).returns(Promise.reject());
        getDataOnly.withArgs(pubbedRef).returns(Promise.resolve());
        return fn().then(expectState({ scheduled: false, published: true }));
      });

      it('gets scheduled and published state', function () {
        getDataOnly.withArgs(scheduledRef).returns(Promise.resolve());
        getDataOnly.withArgs(pubbedRef).returns(Promise.resolve());
        return fn().then(expectState({ scheduled: true, published: true }));
      });

      it('gets neither state', function () {
        getDataOnly.withArgs(scheduledRef).returns(Promise.reject());
        getDataOnly.withArgs(pubbedRef).returns(Promise.reject());
        return fn().then(expectState({ scheduled: false, published: false }));
      });
    });
  });
});
