var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./page-state'),
  edit = require('./edit'),
  db = require('./edit/db'),
  dom = require('@nymag/dom'),
  moment = require('moment');

describe(dirname, function () {
  describe(filename, function () {
    var fakePageUri = 'fakePage',
      sandbox, getDataOnly, getHead, get;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(dom, 'pageUri').returns(fakePageUri);
      getDataOnly = sandbox.stub(edit, 'getDataOnly');
      getHead = sandbox.stub(db, 'getHead');
      get = sandbox.stub(db, 'get');
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('get', function () {
      var fn = lib[this.title],
        scheduleRef = 'fakePage@scheduled',
        publishedRef = fakePageUri + '@published',
        fakeUrl = 'http://domain.com/page.html',
        fakeUri = db.urlToUri(fakeUrl),
        fakeArticleRef = 'domain.com/components/article/instances/fake',
        fakeArticle = {
          date: new Date(0)
        },
        fakeInstanceData = {
          url: fakeUrl,
          main: fakeArticleRef
        };

      function expectState(expectedState) {
        return function (state) {
          expect(state).to.eql(expectedState);
        };
      }

      it('gets scheduled when not published', function () {
        get.withArgs(scheduleRef).returns(Promise.resolve({ at: 1 }));
        get.withArgs(publishedRef).returns(Promise.reject());
        get.withArgs(fakePageUri).returns(Promise.resolve({}));
        return fn().then(expectState({ scheduled: true, scheduledAt: 1, published: false, publishedUrl: null, publishedAt: null, customUrl: null }));
      });

      it('gets published when not scheduled', function () {
        get.withArgs(scheduleRef).returns(Promise.reject());
        get.withArgs(publishedRef).returns(Promise.resolve(fakeInstanceData));
        get.withArgs(fakePageUri).returns(Promise.resolve({}));
        getDataOnly.withArgs(fakeArticleRef).returns(Promise.resolve(fakeArticle));
        getHead.withArgs(fakeUri).returns(Promise.resolve(true));
        return fn().then(expectState({ scheduled: false, scheduledAt: null, published: true, publishedUrl: fakeUrl, publishedAt: new Date(0), customUrl: null }));
      });

      it('gets scheduled and published', function () {
        get.withArgs(scheduleRef).returns(Promise.resolve({ at: 1 }));
        get.withArgs(publishedRef).returns(Promise.resolve(fakeInstanceData));
        get.withArgs(fakePageUri).returns(Promise.resolve({}));
        getDataOnly.withArgs(fakeArticleRef).returns(Promise.resolve(fakeArticle));
        getHead.withArgs(fakeUri).returns(Promise.resolve(true));
        return fn().then(expectState({ scheduled: true, scheduledAt: 1, published: true, publishedUrl: fakeUrl, publishedAt: new Date(0), customUrl: null }));
      });

      it('gets neither scheduled nor published', function () {
        get.withArgs(scheduleRef).returns(Promise.reject());
        get.withArgs(publishedRef).returns(Promise.reject());
        get.withArgs(fakePageUri).returns(Promise.resolve({}));
        return fn().then(expectState({ scheduled: false, scheduledAt: null, published: false, publishedUrl: null, publishedAt: null, customUrl: null }));
      });

      it('gets custom url', function () {
        get.withArgs(scheduleRef).returns(Promise.reject());
        get.withArgs(publishedRef).returns(Promise.reject());
        get.withArgs(fakePageUri).returns(Promise.resolve({ customUrl: 'http://domain.com/foo' }));
        return fn().then(expectState({ scheduled: false, scheduledAt: null, published: false, publishedUrl: null, publishedAt: null, customUrl: 'http://domain.com/foo' }));
      });
    });

    describe('toggleButton', function () {
      var fn = lib[this.title],
        button = dom.create('<button class="publish">Publish</button>');

      before(function () {
        document.body.appendChild(button);
      });

      it('toggles scheduled on', function () {
        fn('scheduled', true);
        expect(document.querySelector('.publish').classList.contains('scheduled')).to.equal(true);
      });

      it('toggles scheduled off', function () {
        fn('scheduled', false);
        expect(document.querySelector('.publish').classList.contains('scheduled')).to.equal(false);
      });

      it('toggles published on', function () {
        fn('published', true);
        expect(document.querySelector('.publish').classList.contains('published')).to.equal(true);
      });

      it('toggles published off', function () {
        fn('published', false);
        expect(document.querySelector('.publish').classList.contains('published')).to.equal(false);
      });
    });

    describe('formatTime', function () {
      var fn = lib[this.title];

      it('formats with calendar time', function () {
        var time = moment().subtract(5, 'hours');

        expect(fn(time.valueOf())).to.equal(time.calendar());
      });
    });

    describe('timeout', function () {
      var fn = lib[this.title];

      it('runs a function in the future', function (done) {
        var time = moment().add(2, 'seconds').calendar(),
          checkFn = function () {
            expect(true).to.equal(true);
            done();
          };

        fn(checkFn, time);
      });
    });
  });
});
