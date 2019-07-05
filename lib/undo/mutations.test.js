import lib from './mutations';
import { SET_CURSOR, UNDO, REDO } from './mutationTypes';

describe('undo mutations', () => {
  describe(SET_CURSOR, () => {
    const fn = lib[SET_CURSOR];

    test(
      'sets the cursor',
      () => expect(fn({ undo: {} }, { cursor: 0, end: 0 }).undo.cursor).toBe(0)
    );
    test(
      'sets atStart true if cursor is 0',
      () => expect(fn({ undo: {} }, { cursor: 0, end: 0 }).undo.atStart).toBe(true)
    );
    test(
      'sets atStart false if cursor is not 0',
      () => expect(fn({ undo: {} }, { cursor: 1, end: 1 }).undo.atStart).toBe(false)
    );
    test(
      'sets atEnd true if cursor is at end',
      () => expect(fn({ undo: {} }, { cursor: 1, end: 1 }).undo.atEnd).toBe(true)
    );
    test(
      'sets atEnd false if cursor is not at end',
      () => expect(fn({ undo: {} }, { cursor: 0, end: 1 }).undo.atEnd).toBe(false)
    );
  });

  describe(UNDO, () => {
    const fn = lib[UNDO],
      pageData = { a: 'b' },
      history = [{ components: { foo: 'bar' }, pageData }, { components: { baz: 'qux' }, pageData }, { components: { quux: 'quuux' }, pageData }];

    test(
      'sets the cursor',
      () => expect(fn({ undo: { cursor: 1 } }, history).undo.cursor).toBe(0)
    );
    test(
      'sets atStart true if cursor is 0',
      () => expect(fn({ undo: { cursor: 1 } }, history).undo.atStart).toBe(true)
    );
    test(
      'sets atStart false if cursor is not 0',
      () => expect(fn({ undo: { cursor: 2 } }, history).undo.atStart).toBe(false)
    );
    // note: atEnd will never be true when undoing
    test(
      'sets atEnd false',
      () => expect(fn({ undo: { cursor: 1 } }, history).undo.atEnd).toBe(false)
    );
    test('clones components and pageData into store', () => {
      const state = {
        components: null,
        page: {
          data: null
        },
        undo: {
          cursor: 1
        }
      };

      fn(state, history);
      expect(state.components).toEqual(history[0].components);
      expect(state.page.data).toEqual(history[0].pageData);
    });
  });

  describe(REDO, () => {
    const fn = lib[REDO],
      pageData = { a: 'b' },
      history = [{ components: { foo: 'bar' }, pageData }, { components: { baz: 'qux' }, pageData }, { components: { quux: 'quuux' }, pageData }];

    test(
      'sets the cursor',
      () => expect(fn({ undo: { cursor: 0 } }, history).undo.cursor).toBe(1)
    );
    // note: atStart will never be true when redoing
    test(
      'sets atStart false',
      () => expect(fn({ undo: { cursor: 0 } }, history).undo.atStart).toBe(false)
    );
    test(
      'sets atEnd true if cursor is at end of history',
      () => expect(fn({ undo: { cursor: 1 } }, history).undo.atEnd).toBe(true)
    );
    test(
      'sets atEnd false if cursor is not at end of history',
      () => expect(fn({ undo: { cursor: 0 } }, history).undo.atEnd).toBe(false)
    );
    test('clones components and pageData into store', () => {
      const state = {
        components: null,
        page: {
          data: null
        },
        undo: {
          cursor: 1
        }
      };

      fn(state, history);
      expect(state.components).toEqual(history[2].components);
      expect(state.page.data).toEqual(history[2].pageData);
    });
  });
});
