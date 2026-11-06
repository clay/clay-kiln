import { isUnreachable, holdWhileUnreachable, retryHeldSaves } from './connection';
import store from './store';
import { HELD_SAVES } from '../toolbar/mutationTypes';

jest.mock('./store', () => ({ state: { ui: {} }, commit: jest.fn() }));

/**
 * an error like core-data/api's
 * @param {number} [status] none: the request never got an answer
 * @param {*} [body]
 * @returns {Error}
 */
function requestError(status, body) {
  const err = new Error('nope');

  err.response = status ? {
    status,
    clone() {
      return { json: () => body === undefined ? Promise.reject(new SyntaxError('not json')) : Promise.resolve(body) };
    }
  } : { statusText: 'Cannot send data' };

  return err;
}

describe('connection', () => {
  describe('isUnreachable', () => {
    test('no answer, or a gateway\'s, means the CMS can\'t be reached (offline, a deploy)', () => Promise.all([
      isUnreachable(requestError()),
      isUnreachable(requestError(403)), // a gateway or proxy: not amphora's JSON
      isUnreachable(requestError(502)),
      isUnreachable(requestError(503, { code: 503 })),
      isUnreachable(requestError(504))
    ]).then(results => expect(results).toEqual([true, true, true, true, true])));

    test('amphora saying no is a real failure', () => Promise.all([
      isUnreachable(requestError(403, { code: 403, message: 'Forbidden' })),
      isUnreachable(requestError(400, { code: 400 })),
      isUnreachable(requestError(404, { code: 404 })),
      isUnreachable(requestError(500)),
      isUnreachable(new Error('Model.save failed'))
    ]).then(results => expect(results).toEqual([false, false, false, false, false])));
  });

  describe('holdWhileUnreachable', () => {
    beforeEach(() => store.commit.mockClear());

    test('keeps a save while the CMS can\'t be reached and sends it once it can', () => {
      const save = jest.fn()
        .mockImplementationOnce(() => Promise.reject(requestError(403)))
        .mockImplementationOnce(() => Promise.reject(requestError()))
        .mockImplementationOnce(() => Promise.resolve('saved'));
      // wake it right away whenever it starts waiting (instead of after a few seconds)
      const wake = setInterval(retryHeldSaves, 5);

      return holdWhileUnreachable(save).then((result) => {
        clearInterval(wake);
        expect(result).toBe('saved');
        expect(save).toHaveBeenCalledTimes(3);
        // held once, released once
        expect(store.commit.mock.calls).toEqual([[HELD_SAVES, 1], [HELD_SAVES, -1]]);
      });
    });

    test('fails as before for anything else', () => {
      const err = requestError(403, { code: 403 });

      return holdWhileUnreachable(() => Promise.reject(err)).then(() => {
        throw new Error('should have failed');
      }, (e) => {
        expect(e).toBe(err);
        expect(store.commit).not.toHaveBeenCalled();
      });
    });
  });
});
