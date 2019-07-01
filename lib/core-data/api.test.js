import _ from 'lodash';
import { inspect } from 'util';
import * as lib from './api';
import rest from '../utils/rest';
import { refAttr } from '../utils/references';

jest.mock('../utils/rest');

let uri = 'domain.com/thing',
  url = 'http://domain.com/thing',
  goodObj = { ok: 'good' },
  goodText = 'abc',
  badObj = new Error('oh no!');

describe('api', () => {
  function respond(data) {
    const action = _.isError(data) ? 'reject' : 'resolve';

    data = _.isString(data) ? data : JSON.stringify(data);

    rest.send.mockReturnValue(Promise[action]({ // resolve or reject based on test
      status: 200,
      json: () => Promise.resolve(JSON.parse(data)),
      text: () => Promise.resolve(data)
    }));
  }

  function respondError(code) {
    rest.send.mockResolvedValue({
      status: code,
      statusText: 'nope'
    });
  }

  /**
   * create tests to block bad uris
   * @param  {Function} fn
   * @param {boolean} catchErrors false to not test for error throwing (helpful for api.getHead)
   */
  function createUriBlockTests(fn, catchErrors) {
    test('throws on protocol', () => expect(() => fn('http://foo')).toThrow());

    test('throws on starting slash', () => expect(() => fn('/foo')).toThrow());

    test('throws on port', () => expect(() => fn('foo:3000')).toThrow());

    if (catchErrors !== false) {
      test('throws on 404', (done) => {
        respondError(404);
        fn('foo').then(result => done('should throw: ' + inspect(result, { depth: 10 })), () => done());
      });

      test('throws on 500', (done) => {
        respondError(500);
        fn('foo').then(result => done('should throw: ' + inspect(result, { depth: 10 })), () => done());
      });
    }
  }

  /**
   * create repeated CRUD tests
   * @param  {Function} fn
   * @param {*} goodData
   * @param {*} badData
   * @param  {boolean}   [catchErrors]
   */
  function createCRUDTests(fn, goodData, badData, catchErrors) {
    createUriBlockTests(fn, catchErrors);

    test('returns data', () => {
      respond(goodData);

      return fn(uri).then((res) => {
        expect(res).toEqual(goodData);
      });
    });

    test('throws on bad data', (done) => {
      respond(badData);
      fn('foo').then(() => done('should throw')).catch(() => done());
    });
  }

  describe('getSchema', () => {
    const fn = lib.getSchema;

    createCRUDTests(fn, goodObj, badObj);

    test('gets schema for a component', () => {
      respond(goodObj);

      return fn('domain.com/_components/foo').then(() => {
        expect(rest.send).toHaveBeenCalledWith('http://domain.com/_components/foo/schema', {
          credentials: 'same-origin', headers: { 'X-Clay-User': undefined }, method: 'GET', url: 'domain.com/_components/foo/schema'
        });
      });
    });
  });

  describe('getObject', () => {
    const fn = lib.getObject;

    createCRUDTests(fn, goodObj, badObj);
  });

  describe('getJSON', () => {
    const fn = lib.getJSON;

    test('returns data', () => {
      respond(goodObj);

      return fn(url).then((res) => {
        expect(res).toEqual(goodObj);
      });
    });

    test('throws on bad data', (done) => {
      respond(badObj);
      fn(url).then(() => done('should throw')).catch(() => done());
    });
  });

  describe('getText', () => {
    const fn = lib.getText;

    createCRUDTests(fn, goodText, badObj);
  });

  describe('getHead', () => {
    const fn = lib.getHead;

    createUriBlockTests(fn, false);

    test('returns true if resource exists', () => {
      respond('some text');

      return fn('foo').then(res => expect(res).toBe(true));
    });

    test('returns false if resource responds with 4xx error', () => {
      respondError(404);

      return fn('foo').then(res => expect(res).toBe(false));
    });

    test('returns false if resource responds with 5xx error', () => {
      respondError(500);

      return fn('foo').then(res => expect(res).toBe(false));
    });
  });

  describe('getHTML', () => {
    const fn = lib.getHTML;

    createUriBlockTests(fn);

    test('returns html with data-uri', () => {
      respond('<span></span>');

      return fn(uri).then((res) => {
        expect(res.getAttribute(refAttr)).toBe(uri);
      });
    });

    test('returns html fragment with data-uri', () => {
      respond('<span></span><span></span>');

      return fn(uri).then((res) => {
        expect(res.firstElementChild.getAttribute(refAttr)).toBe(uri);
      });
    });

    test('returns html comment without data-uri', () => {
      respond('<!-- test -->');

      return fn(uri).then((res) => {
        expect(res.nodeType).toBe(res.TEXT_NODE);
      });
    });

    test('throws on bad html', (done) => {
      respond('<spa');
      fn('foo').then(() => done('should throw')).catch(() => done());
    });

    test('gets html with query (deprecated)', () => {
      respond('<span></span>');

      return fn(uri, '&hi').then(() => {
        expect(rest.send).toHaveBeenCalledWith('http://domain.com/thing.html?edit=true&sitecss=false&js=false&hi', {
          credentials: 'same-origin', headers: { 'X-Clay-User': undefined }, method: 'GET', url: 'domain.com/thing.html?edit=true&sitecss=false&js=false&hi'
        });
      });
    });
  });

  describe('save', () => {
    const fn = lib.save;

    createCRUDTests(fn, goodObj, badObj);

    test('disables server-side hooks', () => {
      respond(goodObj);

      return fn(uri, goodObj, false).then(() => {
        expect(rest.send).toHaveBeenCalledWith('http://domain.com/thing?hooks=false', {
          body: '{"ok":"good"}', credentials: 'same-origin', headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Clay-User': undefined }, method: 'PUT', url: 'domain.com/thing?hooks=false'
        });
      });
    });
  });

  describe('saveText', () => {
    const fn = lib.saveText;

    createCRUDTests(fn, goodText, badObj);
  });

  describe('create', () => {
    const fn = lib.create;

    createCRUDTests(fn, goodObj, badObj);

    test('disables server-side hooks', () => {
      respond(goodObj);

      return fn(uri, goodObj, false).then(() => {
        expect(rest.send).toHaveBeenCalledWith('http://domain.com/thing?hooks=false', {
          body: '{"ok":"good"}', credentials: 'same-origin', headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Clay-User': undefined }, method: 'POST', url: 'domain.com/thing?hooks=false'
        });
      });
    });
  });

  describe('remove', () => {
    const fn = lib.remove;

    createCRUDTests(fn, goodObj, badObj);
  });

  describe('removeText', () => {
    const fn = lib.removeText;

    createCRUDTests(fn, goodText, badObj);
  });
});
