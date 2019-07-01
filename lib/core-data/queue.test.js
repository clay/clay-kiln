import * as lib from './queue';

describe('queue', () => {
  describe('add', () => {
    const fn = lib.add;

    test('runs promises sequentially', () => {
      let data = { a: 0, b: 0 };

      function update(prop) {
        data[prop]++;
        if (prop === 'a') {
          expect(data.a).toBe(1);
          expect(data.b).toBe(0);
        } else {
          expect(data.a).toBe(1);
          expect(data.b).toBe(1);
        }

        return Promise.resolve();
      }

      return Promise.resolve(data)
        .then(() => {
          fn(update, ['a']);
          fn(update, ['b']);
        });
    });

    test('caches promises', () => {
      let data = { a: 0 };

      function update() {
        data.a++;

        return Promise.resolve();
      }

      fn(update);

      return fn(update).then(() => {
        expect(data.a).toBe(1);
      });
    });
  });
});
