import _ from 'lodash';
import ctx, { noteUnguarded, setRev, getRev } from './context';
import { start, stop, sync } from './client';
import { catchUp } from './remote';
import { COLLAB_STALE } from './mutationTypes';

jest.mock('./remote', () => ({ handleEvents: jest.fn(), flushPending: jest.fn(), catchUp: jest.fn() }));

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

describe('collab client', () => {
  let store;

  beforeEach(() => {
    catchUp.mockReset();
    catchUp.mockReturnValue(Promise.resolve({ changed: [], failed: [] }));
  });

  afterEach(() => {
    stop();
  });

  test('carries on without re-reading the page while nothing goes wrong', () => {
    respond(ok());
    store = makeStore();
    start(store);

    return settle()
      .then(() => sync())
      .then(settle)
      .then(() => {
        expect(catchUp).not.toHaveBeenCalled();
        expect(ctx.unverified).toBe(false);
      });
  });

  test('re-reads the page once the server can reach its store again after a 503', () => {
    respond({ status: 503, body: {} }, ok());
    store = makeStore();
    start(store);
    setRev(cmpt, 4);

    return settle()
      .then(() => {
        // until then, saves merge with what the server has
        expect(ctx.unverified).toBe(true);
        expect(getRev(cmpt)).toBe(undefined);
        expect(catchUp).not.toHaveBeenCalled();
      })
      .then(() => sync())
      .then(settle)
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(1);
        expect(ctx.unverified).toBe(false);
        expect(store.commit).toHaveBeenCalledWith(COLLAB_STALE, false);
      });
  });

  test('does not re-read the page after other failures (the network, a deploy)', () => {
    respond({ status: 502, body: {} }, ok());
    store = makeStore();
    start(store);

    return settle()
      .then(() => sync())
      .then(settle)
      .then(() => expect(catchUp).not.toHaveBeenCalled());
  });

  test('re-reads the page when the server says saves went around collaboration (a new gap)', () => {
    respond(ok({ gap: 'g1' }), ok({ gap: 'g2' }));
    store = makeStore();
    start(store);

    return settle()
      .then(() => expect(catchUp).not.toHaveBeenCalled())
      .then(() => sync())
      .then(settle)
      .then(() => expect(catchUp).toHaveBeenCalledTimes(1));
  });

  test('re-reads the page when it was rendered while the server could not reach its store', () => {
    respond(ok({ gap: 'g1' }));
    store = makeStore({ cursor: null, gap: null });
    start(store);

    return settle().then(() => expect(catchUp).toHaveBeenCalledTimes(1));
  });

  test('asks the editor to reload when it could not re-read everything', () => {
    respond({ status: 503, body: {} }, ok());
    catchUp.mockReturnValue(Promise.resolve({ changed: [cmpt], failed: ['site/_components/text/instances/b'] }));
    store = makeStore();
    start(store);

    return settle()
      .then(() => sync())
      .then(settle)
      .then(() => {
        expect(store.commit).toHaveBeenCalledWith(COLLAB_STALE, true);
        expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', 'Updated with changes saved while live collaboration was interrupted');
      });
  });

  test('re-reads the page at most every 30 seconds, and again after that if it is still unsure', () => {
    let now = 1000000;

    jest.spyOn(Date, 'now').mockImplementation(() => now);
    respond(ok({ gap: 'g1' }), ok({ gap: 'g2' }), ok({ gap: 'g3' }), ok({ gap: 'g3' }));
    store = makeStore();
    start(store);

    return settle()
      .then(() => sync()) // g2: re-read
      .then(settle)
      .then(() => sync()) // g3, right after: wait
      .then(settle)
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(1);
        expect(ctx.unverified).toBe(true);
        now += 31000;
      })
      .then(() => sync())
      .then(settle)
      .then(() => {
        expect(catchUp).toHaveBeenCalledTimes(2);
        expect(ctx.unverified).toBe(false);
        Date.now.mockRestore();
      });
  });

  test('reports saves that went through without a revision until the server has them', () => {
    respond(ok(), { status: 503, body: {} }, ok());
    store = makeStore();
    start(store);

    return settle()
      .then(() => noteUnguarded(cmpt, page))
      .then(() => sync()) // fails: keep them
      .then(settle)
      .then(() => {
        expect(lastRequest().unguarded).toEqual([{ uri: cmpt, doc: page }]);
        expect(ctx.unguarded).toEqual({ [cmpt]: { doc: page } });
      })
      .then(() => sync())
      .then(settle)
      .then(() => {
        expect(lastRequest().unguarded).toEqual([{ uri: cmpt, doc: page }]);
        expect(ctx.unguarded).toEqual({});
      })
      .then(() => sync())
      .then(() => expect(lastRequest().unguarded).toBe(undefined));
  });
});
