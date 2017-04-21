import * as store from './store';
import * as lib from './queue';

describe('queue', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(store);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('add', () => {
    const fn = lib.add;

    it('runs promises sequentially', () => {
      let data = { a: 0, b: 0 };

      function update(prop) {
        data[prop]++;
        return Promise.resolve();
      }

      fn(update, ['a']).then(() => {
        expect(data.a).to.equal(1);
        expect(data.b).to.equal(0);
      });
      return fn(update, ['b']).then(() => {
        expect(data.a).to.equal(1);
        expect(data.b).to.equal(1);
      });
    });

    it('caches promises', () => {
      let data = { a: 0 };

      function update() {
        data.a++;
        return Promise.resolve();
      }

      fn(update);
      return fn(update).then(() => {
        expect(data.a).to.equal(1);
      });
    });
  });
});
