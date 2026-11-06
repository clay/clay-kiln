import _ from 'lodash';
import ctx, { noteUnguarded, setRev, getRev } from './context';
import { start, stop, sync } from './client';
import { catchUp } from './remote';
import { retryHeldSaves } from '../core-data/connection';

jest.mock('./remote', () => ({ handleEvents: jest.fn(), flushPending: jest.fn(), catchUp: jest.fn() }));
jest.mock('../core-data/connection', () => ({ retryHeldSaves: jest.fn() }));

const page = 'site/_pages/p',
  cmpt = 'site/_components/text/instances/a';

/**
 * A store with what collaboration reads, and amphora's edit-mode settings.
 * @param {object} [config] locals.collaboration overrides
 * @returns {object}
 */
function makeStore(config) {
  return {
    state: {
      locals: {
        collaboration: _.assign({
          enabled: true, path: '/_collab', cursor: 5, gap: 'g1'
        }, config)
      },
      page: { uri: page },
      site: { prefix: 'site' },
      components: { [cmpt]: { text: 'a' } },
      user: { username: 'ada' },
      ui: {}
    },
    commit: jest.fn(),
    dispatch: jest.fn(() => Promise.resolve()),
    subscribe: jest.fn(() => _.noop)
  };
}

/**
 * A successful sync response.
 * @param {object} [body]
 * @returns {object}
 */
function ok(body) {
  return {
    status: 200,
    body: _.assign({
      now: 1, epoch: 'e1', gap: 'g1', cursor: 5, resync: false, presence: [], events: []
    }, body)
  };
}

/**
 * Answer syncs with these responses, in order (the last one repeats).
 * @param {...object} responses { status, body }
 */
function respond(...responses) {
  window.fetch = jest.fn(() => {
    const res = responses.length > 1 ? responses.shift() : responses[0];

    return Promise.resolve({ ok: res.status === 200, status: res.status, json: () => Promise.resolve(res.body) });
  });
}

/**
 * @returns {object} the body of the latest sync request
 */
function lastRequest() {
  return JSON.parse(_.last(window.fetch.mock.calls)[1].body);
}

/**
 * Let pending promises (a sync, a catch-up) finish.
 * @returns {Promise}
 */
function settle() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Sync now, and let it (and anything it starts) finish.
 * @returns {Promise}
 */
function syncNow() {
  return sync().then(settle);
}

describe('collab client', () => {
  let store;

  beforeEach(() => {
    catchUp.mockReset();
    catchUp.mockReturnValue(Promise.resolve({ changed: [], waiting: [], failed: [] }));
  });

  afterEach(() => {
    stop();
    jest.restoreAllMocks();
  });

  test('carries on without re-reading the page while nothing goes wrong', () => {
    respond(ok());
    store = makeStore();
    start(store);

    return settle()
      .then(syncNow)
      .then(syncNow)
      .then(() => {
        expect(catchUp).not.toHaveBeenCalled();
        expect(ctx.unverified).toBe(false);
      });
  });

  test('re-reads the page once it reconnects after a 503, one sync later (the feed names who it can first)', () => {
    respond({ status: 503, body: {} }, ok());
    store = makeStore();
    start(store);
    setRev(cmpt, 4);

    return settle()
      .then(() => {
        // until then, saves merge with what the server has
        expect(ctx.unverified).toBe(true);
        expect(getRev(cmpt)).toBe(undefined);
      })
      .then(syncNow)
      .then(() => expect(catchUp).not.toHaveBeenCalled())
      .then(syncNow)
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(1);
        expect(catchUp.mock.calls[0][1]).toBe(undefined); // everything
        expect(ctx.unverified).toBe(false);
        // quietly: no reload prompt, no message
        expect(store.dispatch).not.toHaveBeenCalledWith('showSnackbar', expect.anything());
        expect(_.map(store.commit.mock.calls, 0)).not.toContain('COLLAB_STALE');
      });
  });

  test('does not re-read the page after other failures (the network, a deploy)', () => {
    respond({ status: 502, body: {} }, ok());
    store = makeStore();
    start(store);

    return settle()
      .then(syncNow)
      .then(syncNow)
      .then(() => expect(catchUp).not.toHaveBeenCalled());
  });

  test('re-reads the page when the server says saves went around collaboration (a new gap)', () => {
    respond(ok({ gap: 'g1' }), ok({ gap: 'g2' }));
    store = makeStore();
    start(store);

    return settle()
      .then(syncNow) // learns g2
      .then(() => {
        expect(ctx.unverified).toBe(true);
        expect(catchUp).not.toHaveBeenCalled();
      })
      .then(syncNow)
      .then(() => expect(catchUp).toHaveBeenCalledTimes(1));
  });

  test('re-reads the page when it was rendered while the server could not reach its store', () => {
    respond(ok({ gap: 'g1' }));
    store = makeStore({ cursor: null, gap: null });
    start(store);

    return settle()
      .then(syncNow)
      .then(() => expect(catchUp).toHaveBeenCalledTimes(1));
  });

  test('re-reads what it could not, later and on its own (backing off), never asking for a reload', () => {
    let now = 1000000;

    jest.spyOn(Date, 'now').mockImplementation(() => now);
    respond({ status: 503, body: {} }, ok());
    catchUp
      .mockReturnValueOnce(Promise.resolve({ changed: [], waiting: [], failed: [cmpt] }))
      .mockReturnValueOnce(Promise.resolve({ changed: [], waiting: [], failed: [cmpt] }))
      .mockReturnValue(Promise.resolve({ changed: [], waiting: [], failed: [] }));
    store = makeStore();
    start(store);

    return settle()
      .then(syncNow)
      .then(syncNow) // everything: cmpt fails
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(1);
        expect(ctx.unsure).toEqual({ [cmpt]: true });
        expect(ctx.unverified).toBe(false);
      })
      .then(syncNow) // too soon to try again
      .then(() => { now += 31000; })
      .then(syncNow) // just cmpt: fails again
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(2);
        expect(catchUp.mock.calls[1][1]).toEqual([cmpt]);
        now += 31000;
      })
      .then(syncNow) // backing off: 60s now
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(2);
        now += 31000;
      })
      .then(syncNow)
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(3);
        expect(ctx.unsure).toEqual({});
        expect(store.dispatch).not.toHaveBeenCalledWith('showSnackbar', expect.anything());
      });
  });

  test('re-reads the page at most every 30 seconds, and again after that if it is still unsure', () => {
    let now = 1000000;

    jest.spyOn(Date, 'now').mockImplementation(() => now);
    respond(ok({ gap: 'g1' }), ok({ gap: 'g2' }), ok({ gap: 'g2' }), ok({ gap: 'g3' }), ok({ gap: 'g3' }));
    store = makeStore();
    start(store);

    return settle()
      .then(syncNow) // g2
      .then(syncNow) // re-read
      .then(syncNow) // g3, right after
      .then(syncNow) // too soon: wait
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(1);
        expect(ctx.unverified).toBe(true);
        now += 31000;
      })
      .then(syncNow)
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(2);
        expect(ctx.unverified).toBe(false);
      });
  });

  test('reports saves that went through without a revision until the server has them', () => {
    respond(ok(), { status: 503, body: {} }, ok());
    store = makeStore();
    start(store);

    return settle()
      .then(() => noteUnguarded(cmpt, page))
      .then(syncNow) // fails: keep them
      .then(() => {
        expect(lastRequest().unguarded).toEqual([{ uri: cmpt, doc: page }]);
        expect(ctx.unguarded).toEqual({ [cmpt]: { doc: page, at: expect.any(Number) } });
      })
      .then(syncNow)
      .then(() => {
        expect(lastRequest().unguarded).toEqual([{ uri: cmpt, doc: page }]);
        expect(ctx.unguarded).toEqual({});
      })
      .then(() => sync())
      .then(() => expect(lastRequest().unguarded).toBe(undefined));
  });

  test('reports saves an earlier tab could not, before it was closed', () => {
    respond({ status: 503, body: {} });
    store = makeStore();
    start(store);

    return settle()
      .then(() => {
        noteUnguarded(cmpt, page);
        stop(); // the tab closes before the server could be told
        respond(ok());
        store = makeStore();
        start(store); // another page on the site
      })
      .then(settle)
      .then(() => {
        expect(lastRequest().unguarded).toEqual([{ uri: cmpt, doc: page }]);
        expect(window.localStorage.getItem('kiln-collab-unguarded:site')).toBe(null); // reported: forgotten
      });
  });

  test('tells others how long the open form has gone unchanged, and asks for a field it is taking over', () => {
    respond(ok({ presence: [{ self: true, tab: 't-self', user: { id: 'u-ada', name: 'Ada' } }], now: 5000 }));
    store = makeStore();
    store.state.ui.currentForm = { uri: cmpt, path: 'text' };
    start(store);

    return settle()
      .then(() => {
        expect(lastRequest().focus).toMatchObject({
          uri: cmpt, path: 'text', label: 'Text', unsaved: false
        });
        expect(lastRequest().focus.quiet).toBeGreaterThanOrEqual(0);
        expect(lastRequest().focus.claim).toBeUndefined();
        expect(ctx).toMatchObject({ me: 'u-ada', tab: 't-self' });
        store.state.ui.currentForm = null;
        store.state.collab = { claim: { uri: cmpt, path: 'text', label: 'Text' } };
      })
      .then(syncNow)
      .then(() => expect(lastRequest().focus).toEqual({
        uri: cmpt, path: 'text', label: 'Text', typing: false, quiet: 0, claim: true
      }));
  });

  test('counts its open form as out of touch when it could not check in for a while (someone may have taken it over)', () => {
    let now = 1000000;

    jest.spyOn(Date, 'now').mockImplementation(() => now);
    respond(ok());
    store = makeStore();
    store.state.ui.currentForm = { uri: cmpt, path: 'text', fields: { text: 'typed' } };
    ctx.formBase = {
      uri: cmpt, path: 'text', fields: { text: 'a' }, data: {}
    };
    start(store);

    return settle()
      .then(() => {
        now += 3000;
      })
      .then(syncNow)
      .then(() => {
        expect(ctx.outOfTouch).toEqual({});
        expect(lastRequest().focus.unsaved).toBe(true);
        now += 60000; // asleep, or offline
      })
      .then(syncNow)
      .then(() => expect(ctx.outOfTouch).toEqual({ [cmpt]: expect.any(Number) }));
  });

  test('checks in every few seconds while it has a form open, even in a background tab (someone may be waiting for it)', () => {
    jest.useFakeTimers();
    jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    respond(ok());
    store = makeStore();
    start(store);

    return Promise.resolve()
      .then(() => jest.advanceTimersByTimeAsync(0))
      .then(() => {
        expect(window.fetch).toHaveBeenCalledTimes(1);
        store.state.ui.currentForm = { uri: cmpt, path: 'text' };
      })
      .then(() => jest.advanceTimersByTimeAsync(20000)) // without a form: once every 20s
      .then(() => expect(window.fetch).toHaveBeenCalledTimes(2))
      .then(() => jest.advanceTimersByTimeAsync(5000)) // with one: every 5s
      .then(() => {
        expect(window.fetch).toHaveBeenCalledTimes(3);
        jest.useRealTimers();
      });
  });

  test('checks back every few seconds while the CMS can\'t be reached (a gateway\'s 403), and sends held saves once it can', () => {
    jest.useFakeTimers();
    respond({ status: 403, body: 'Forbidden' }, { status: 403, body: 'Forbidden' }, ok());
    store = makeStore();
    store.state.ui.heldSaves = 1;
    store.state.collab = { failures: 1, others: [] }; // as kiln's mutations would have it
    start(store);

    return Promise.resolve()
      .then(() => jest.advanceTimersByTimeAsync(0))
      .then(() => {
        expect(window.fetch).toHaveBeenCalledTimes(1);
        expect(retryHeldSaves).not.toHaveBeenCalled();
      })
      .then(() => jest.advanceTimersByTimeAsync(3000))
      .then(() => expect(window.fetch).toHaveBeenCalledTimes(2))
      .then(() => jest.advanceTimersByTimeAsync(3000))
      .then(() => {
        expect(window.fetch).toHaveBeenCalledTimes(3);
        expect(retryHeldSaves).toHaveBeenCalled();
        jest.useRealTimers();
      });
  });
});
