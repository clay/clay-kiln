import * as api from './api';
import * as lib from './amphora-api';

const prefix = 'domain.com',
  list = ['one', 'two', 'three'];

describe('amphora api', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(api);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getList', () => {
    const fn = lib.getList;

    it('resolves with list', () => {
      api.getJSON.returns(Promise.resolve(list));
      return fn(prefix, 'items').then((res) => {
        expect(res).to.eql(list);
      });
    });

    it('resolves with flattened list', () => {
      const objList = [{ text: 'one' }, { text: 'two' }, { text: 'three' }];

      api.getJSON.returns(Promise.resolve(objList));
      return fn(prefix, 'items').then((res) => {
        expect(res).to.eql(list);
      });
    });

    it('rejects on api errors', () => {
      api.getJSON.returns(Promise.reject('nope'));
      return fn(prefix, 'items').catch((e) => {
        expect(e).to.equal('nope');
      });
    });
  });
});
