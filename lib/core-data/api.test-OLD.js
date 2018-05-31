import expect from 'expect';
import _ from 'lodash';
import { inspect } from 'util';
import * as lib from './api';
import rest from '../utils/rest';
import { refAttr } from '../utils/references';

let uri = 'domain.com/thing',
  url = 'http://domain.com/thing',
  goodObj = { ok: 'good' },
  goodText = 'abc',
  badObj = new Error('oh no!');

describe('api', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(rest, 'send');
  });

  afterEach(() => {
    sandbox.restore();
  });

  function respond(data) {
    const action = _.isError(data) ? 'reject' : 'resolve';

    data = _.isString(data) ? data : JSON.stringify(data);

    rest.send.returns(Promise[action]({
      status: 200,
      json: () => Promise.resolve(JSON.parse(data)),
      text: () => Promise.resolve(data)
    }));
  }

  function respondError(code) {
    rest.send.returns(Promise.resolve({
      status: code,
      statusText: 'nope'
    }));
  }

  /**
   * create tests to block bad uris
   * @param  {Function} fn
   * @param {boolean} catchErrors false to not test for error throwing (helpful for api.getHead)
   */
  function createUriBlockTests(fn, catchErrors) {
    test('throws on protocol', () => expect(() => fn('http://foo')).to.throw());
    test('throws on starting slash', () => expect(() => fn('/foo')).to.throw());
    test('throws on port', () => expect(() => fn('foo:3000')).to.throw());

    if (catchErrors !== false) {
      test('throws on 404', (done) => {
        respondError(404);
        fn('foo').then((result) => done('should throw: ' + inspect(result, {depth: 10})), () => done());
      });
      test('throws on 500', done => {
        respondError(500);
        fn('foo').then((result) => done('should throw: ' + inspect(result, {depth: 10})), () => done());
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
        expect(res).to.deep.equal(goodData);
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
        expect(rest.send).to.have.been.calledWith('http://domain.com/_components/foo/schema');
      });
    });
  });

  describe('getObject', () => {
    const fn = lib.getObject;

    createCRUDTests(fn, goodObj, badObj);
  });

  describe('getJSON', () => {
    const fn = lib.getJSON;

    test('throws on lack of protocol', () => expect(() => fn('foo')).to.throw());

    test('returns data', () => {
      respond(goodObj);
      return fn(url).then((res) => {
        expect(res).to.deep.equal(goodObj);
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

      return fn('foo').then((res) => expect(res).to.equal(true));
    });

    test('returns false if resource responds with 4xx error', () => {
      respondError(404);

      return fn('foo').then((res) => expect(res).to.equal(false));
    });

    test('returns false if resource responds with 5xx error', () => {
      respondError(500);

      return fn('foo').then((res) => expect(res).to.equal(false));
    });
  });

  describe('getHTML', () => {
    const fn = lib.getHTML;

    createUriBlockTests(fn);

    test('returns html with data-uri', () => {
      respond('<span></span>');
      return fn(uri).then((res) => {
        expect(res.getAttribute(refAttr)).to.equal(uri);
      });
    });

    test('returns html fragment with data-uri', () => {
      respond('<span></span><span></span>');
      return fn(uri).then((res) => {
        expect(res.firstElementChild.getAttribute(refAttr)).to.equal(uri);
      });
    });

    test('returns html comment without data-uri', () => {
      respond('<!-- test -->');
      return fn(uri).then((res) => {
        expect(res.nodeType).to.equal(res.TEXT_NODE);
      });
    });

    test('throws on bad html', (done) => {
      respond('<spa');
      fn('foo').then(() => done('should throw')).catch(() => done());
    });

    test('gets html with query (deprecated)', () => {
      respond('<span></span>');
      return fn(uri, '&hi').then(() => {
        expect(rest.send).to.have.been.calledWith('http://domain.com/thing.html?edit=true&sitecss=false&js=false&hi');
      });
    });
  });

  describe('save', () => {
    const fn = lib.save;

    createCRUDTests(fn, goodObj, badObj);

    test('disables server-side hooks', () => {
      respond(goodObj);
      return fn(uri, goodObj, false).then(() => {
        expect(rest.send).to.have.been.calledWith('http://domain.com/thing?componenthooks=false');
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
        expect(rest.send).to.have.been.calledWith('http://domain.com/thing?componenthooks=false');
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
