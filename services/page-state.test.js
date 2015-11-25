var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./page-state'),
  references = require('./references'),
  edit = require('./edit'),
  db = require('./edit/db'),
  dom = require('./dom');

describe(dirname, function () {
  describe(filename, function () {
    var fakeInstanceRef = 'domain.com/components/clay-meta-url/instances/fakeInstance',
      sandbox, getDataOnly, getHead;

    function stubCanonicalUrl() {
      var el = document.createElement('div');

      el.setAttribute(references.referenceAttribute, fakeInstanceRef);
      return el;
    }

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(dom, 'find').returns(stubCanonicalUrl());
      getDataOnly = sandbox.stub(edit, 'getDataOnly');
      getHead = sandbox.stub(db, 'getHead');
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('get', function () {
      var fn = lib[this.title],
        pageRef = 'null@scheduled',
        fakeUrl = 'http://domain.com/page.html',
        fakeUri = db.urlToUri(fakeUrl),
        fakeInstanceData = {
          url: fakeUrl
        };

      function expectState(expectedState) {
        return function (state) {
          expect(state).to.eql(expectedState);
        };
      }

      it('gets scheduled state (published url is null if not published)', function () {
        getHead.withArgs(pageRef).returns(Promise.resolve(true));
        getDataOnly.withArgs(fakeInstanceRef).returns(Promise.reject());
        return fn().then(expectState({ scheduled: true, published: false, publishedUrl: null }));
      });

      it('gets published state (and published url)', function () {
        getHead.withArgs(pageRef).returns(Promise.resolve(false));
        getDataOnly.withArgs(fakeInstanceRef).returns(Promise.resolve(fakeInstanceData));
        getHead.withArgs(fakeUri).returns(Promise.resolve(true));
        return fn().then(expectState({ scheduled: false, published: true, publishedUrl: fakeUrl }));
      });

      it('gets scheduled and published state (and published url)', function () {
        getHead.withArgs(pageRef).returns(Promise.resolve(true));
        getDataOnly.withArgs(fakeInstanceRef).returns(Promise.resolve(fakeInstanceData));
        getHead.withArgs(fakeUri).returns(Promise.resolve(true));
        return fn().then(expectState({ scheduled: true, published: true, publishedUrl: fakeUrl }));
      });

      it('gets neither state', function () {
        getHead.withArgs(pageRef).returns(Promise.resolve(false));
        getDataOnly.withArgs(fakeInstanceRef).returns(Promise.reject());
        return fn().then(expectState({ scheduled: false, published: false, publishedUrl: null }));
      });
    });
  });
});
