import lib from './page-state';
import * as api from '../core-data/api';
import { urlToUri } from '../utils/urls';

describe('page-state', () => {
  let sandbox, get, getHead;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    get = sandbox.stub(api, 'getObject');
    getHead = sandbox.stub(api, 'getHead');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('get', () => {
    const fn = lib,
      fakePageUri = 'fakePage',
      scheduleRef = 'fakePage@scheduled',
      publishedRef = fakePageUri + '@published',
      fakeUrl = 'http://domain.com/page.html',
      fakeUri = urlToUri(fakeUrl),
      fakeArticleRef = 'domain.com/components/article/instances/fake',
      fakeArticle = {
        date: new Date(0)
      },
      fakeInstanceData = {
        url: fakeUrl,
        main: fakeArticleRef
      };

    function expectState(expectedState) {
      return (state) => expect(state).to.eql(expectedState);
    }

    it('gets scheduled when not published', () => {
      get.withArgs(scheduleRef).returns(Promise.resolve({ at: 1 }));
      get.withArgs(publishedRef).returns(Promise.reject());
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      return fn(fakePageUri).then(expectState({ scheduled: true, scheduledAt: 1, published: false, publishedUrl: null, publishedAt: null, customUrl: null }));
    });

    it('gets published when not scheduled', () => {
      get.withArgs(scheduleRef).returns(Promise.reject());
      get.withArgs(publishedRef).returns(Promise.resolve(fakeInstanceData));
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      get.withArgs(fakeArticleRef).returns(Promise.resolve(fakeArticle));
      getHead.withArgs(fakeUri).returns(Promise.resolve(true));
      return fn(fakePageUri).then(expectState({ scheduled: false, scheduledAt: null, published: true, publishedUrl: fakeUrl, publishedAt: new Date(0), customUrl: null }));
    });

    it('gets scheduled and published', () => {
      get.withArgs(scheduleRef).returns(Promise.resolve({ at: 1 }));
      get.withArgs(publishedRef).returns(Promise.resolve(fakeInstanceData));
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      get.withArgs(fakeArticleRef).returns(Promise.resolve(fakeArticle));
      getHead.withArgs(fakeUri).returns(Promise.resolve(true));
      return fn(fakePageUri).then(expectState({ scheduled: true, scheduledAt: 1, published: true, publishedUrl: fakeUrl, publishedAt: new Date(0), customUrl: null }));
    });

    it('gets neither scheduled nor published', () => {
      get.withArgs(scheduleRef).returns(Promise.reject());
      get.withArgs(publishedRef).returns(Promise.reject());
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      return fn(fakePageUri).then(expectState({ scheduled: false, scheduledAt: null, published: false, publishedUrl: null, publishedAt: null, customUrl: null }));
    });

    it('gets published without url', () => {
      get.withArgs(scheduleRef).returns(Promise.reject());
      get.withArgs(publishedRef).returns(Promise.resolve({}));
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      getHead.withArgs(fakeUri).returns(Promise.resolve(true));
      return fn(fakePageUri).then(expectState({ scheduled: false, scheduledAt: null, published: false, publishedUrl: null, publishedAt: null, customUrl: null }));
    });

    it('gets published with improper url', () => {
      get.withArgs(scheduleRef).returns(Promise.reject());
      get.withArgs(publishedRef).returns(Promise.resolve(fakeInstanceData));
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      getHead.withArgs(fakeUri).returns(Promise.resolve(false));
      return fn(fakePageUri).then(expectState({ scheduled: false, scheduledAt: null, published: false, publishedUrl: null, publishedAt: null, customUrl: null }));
    });

    it('gets published without article ref', () => {
      get.withArgs(scheduleRef).returns(Promise.reject());
      get.withArgs(publishedRef).returns(Promise.resolve({ url: fakeUrl }));
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      getHead.withArgs(fakeUri).returns(Promise.resolve(true));
      return fn(fakePageUri).then(expectState({ scheduled: false, scheduledAt: null, published: true, publishedUrl: fakeUrl, publishedAt: null, customUrl: null }));
    });

    it('gets published with article ref in array', () => {
      get.withArgs(scheduleRef).returns(Promise.reject());
      get.withArgs(publishedRef).returns(Promise.resolve({ url: fakeUrl, main: [fakeArticleRef] }));
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      getHead.withArgs(fakeUri).returns(Promise.resolve(true));
      get.withArgs(fakeArticleRef).returns(Promise.resolve(fakeArticle));
      return fn(fakePageUri).then(expectState({ scheduled: false, scheduledAt: null, published: true, publishedUrl: fakeUrl, publishedAt: new Date(0), customUrl: null }));
    });

    it('gets published with article ref in object', () => {
      get.withArgs(scheduleRef).returns(Promise.reject());
      get.withArgs(publishedRef).returns(Promise.resolve({ url: fakeUrl, main: { weirdKey: fakeArticleRef } }));
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      getHead.withArgs(fakeUri).returns(Promise.resolve(true));
      get.withArgs(fakeArticleRef).returns(Promise.resolve(fakeArticle));
      return fn(fakePageUri).then(expectState({ scheduled: false, scheduledAt: null, published: true, publishedUrl: fakeUrl, publishedAt: new Date(0), customUrl: null }));
    });

    it('gets published without deep article ref', () => {
      get.withArgs(scheduleRef).returns(Promise.reject());
      get.withArgs(publishedRef).returns(Promise.resolve({ url: fakeUrl, main: [] }));
      get.withArgs(fakePageUri).returns(Promise.resolve({}));
      getHead.withArgs(fakeUri).returns(Promise.resolve(true));
      return fn(fakePageUri).then(expectState({ scheduled: false, scheduledAt: null, published: true, publishedUrl: fakeUrl, publishedAt: null, customUrl: null }));
    });

    it('gets custom url', () => {
      get.withArgs(scheduleRef).returns(Promise.reject());
      get.withArgs(publishedRef).returns(Promise.reject());
      get.withArgs(fakePageUri).returns(Promise.resolve({ customUrl: 'http://domain.com/foo' }));
      return fn(fakePageUri).then(expectState({ scheduled: false, scheduledAt: null, published: false, publishedUrl: null, publishedAt: null, customUrl: 'http://domain.com/foo' }));
    });
  });
});
