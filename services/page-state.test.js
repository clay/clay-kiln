var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./page-state'),
  edit = require('./edit'),
  db = require('./edit/db'),
  dom = require('./dom'),
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
        fakeInstanceData = {
          url: fakeUrl
        };

      function expectState(expectedState) {
        return function (state) {
          expect(state).to.eql(expectedState);
        };
      }

      it('gets scheduled state (published url is null if not published)', function () {
        get.withArgs(scheduleRef).returns(Promise.resolve({ at: 1 }));
        getDataOnly.withArgs(publishedRef).returns(Promise.reject());
        return fn().then(expectState({ scheduled: true, scheduledAt: 1, published: false, publishedUrl: null }));
      });

      it('gets published state (and published url)', function () {
        get.withArgs(scheduleRef).returns(Promise.reject());
        getDataOnly.withArgs(publishedRef).returns(Promise.resolve(fakeInstanceData));
        getHead.withArgs(fakeUri).returns(Promise.resolve(true));
        return fn().then(expectState({ scheduled: false, scheduledAt: null, published: true, publishedUrl: fakeUrl }));
      });

      it('gets scheduled and published state (and published url)', function () {
        get.withArgs(scheduleRef).returns(Promise.resolve({ at: 1 }));
        getDataOnly.withArgs(publishedRef).returns(Promise.resolve(fakeInstanceData));
        getHead.withArgs(fakeUri).returns(Promise.resolve(true));
        return fn().then(expectState({ scheduled: true, scheduledAt: 1, published: true, publishedUrl: fakeUrl }));
      });

      it('gets neither state', function () {
        get.withArgs(scheduleRef).returns(Promise.reject());
        getDataOnly.withArgs(publishedRef).returns(Promise.reject());
        return fn().then(expectState({ scheduled: false, scheduledAt: null, published: false, publishedUrl: null }));
      });
    });

    describe('toggleScheduled', function () {
      var fn = lib[this.title],
        button = dom.create(`<div class="kiln-toolbar-inner"><button class="publish">Publish</button></div>`);

      before(function () {
        document.body.appendChild(button);
      });

      it('toggles on', function () {
        fn(true);
        expect(document.querySelector('.kiln-toolbar-inner .publish').classList.contains('scheduled')).to.equal(true);
      });

      it('toggles off', function () {
        fn(false);
        expect(document.querySelector('.kiln-toolbar-inner .publish').classList.contains('scheduled')).to.equal(false);
      });
    });

    describe('formatTime', function () {
      var fn = lib[this.title];

      it('formats with calendar time', function () {
        var time = moment().subtract(5, 'hours');

        expect(fn(time.valueOf())).to.equal(time.calendar());
      });
    });
  });
});
