import expect from 'expect';
import lib from './mutations';
import { SET_CURSOR, UNDO, REDO } from './mutationTypes';

define('undo mutations', () => {
  describe(SET_CURSOR, () => {
    const fn = lib[SET_CURSOR];

    test(
      'sets the cursor',
      () => expect(fn({ undo: {} }, { cursor: 0, end: 0 }).undo.cursor).to.equal(0)
    );
    test(
      'sets atStart true if cursor is 0',
      () => expect(fn({ undo: {} }, { cursor: 0, end: 0 }).undo.atStart).to.equal(true)
    );
    test(
      'sets atStart false if cursor is not 0',
      () => expect(fn({ undo: {} }, { cursor: 1, end: 1 }).undo.atStart).to.equal(false)
    );
    test(
      'sets atEnd true if cursor is at end',
      () => expect(fn({ undo: {} }, { cursor: 1, end: 1 }).undo.atEnd).to.equal(true)
    );
    test(
      'sets atEnd false if cursor is not at end',
      () => expect(fn({ undo: {} }, { cursor: 0, end: 1 }).undo.atEnd).to.equal(false)
    );
  });

  describe(UNDO, () => {
    const fn = lib[UNDO],
      pageData = { a: 'b' },
      history = [{ components: { foo: 'bar' }, pageData }, { components: { baz: 'qux' }, pageData }, { components: { quux: 'quuux' }, pageData }];

    test(
      'sets the cursor',
      () => expect(fn({ undo: { cursor: 1} }, history).undo.cursor).to.equal(0)
    );
    test(
      'sets atStart true if cursor is 0',
      () => expect(fn({ undo: { cursor: 1} }, history).undo.atStart).to.equal(true)
    );
    test(
      'sets atStart false if cursor is not 0',
      () => expect(fn({ undo: { cursor: 2} }, history).undo.atStart).to.equal(false)
    );
    // note: atEnd will never be true when undoing
    test(
      'sets atEnd false',
      () => expect(fn({ undo: { cursor: 1} }, history).undo.atEnd).to.equal(false)
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
      expect(state.components).to.eql(history[0].components);
      expect(state.page.data).to.eql(history[0].pageData);
    });
  });

  describe(REDO, () => {
    const fn = lib[REDO],
      pageData = { a: 'b' },
      history = [{ components: { foo: 'bar' }, pageData }, { components: { baz: 'qux' }, pageData }, { components: { quux: 'quuux' }, pageData }];

    test(
      'sets the cursor',
      () => expect(fn({ undo: { cursor: 0} }, history).undo.cursor).to.equal(1)
    );
    // note: atStart will never be true when redoing
    test(
      'sets atStart false',
      () => expect(fn({ undo: { cursor: 0} }, history).undo.atStart).to.equal(false)
    );
    test(
      'sets atEnd true if cursor is at end of history',
      () => expect(fn({ undo: { cursor: 1} }, history).undo.atEnd).to.equal(true)
    );
    test(
      'sets atEnd false if cursor is not at end of history',
      () => expect(fn({ undo: { cursor: 0} }, history).undo.atEnd).to.equal(false)
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
      expect(state.components).to.eql(history[2].components);
      expect(state.page.data).to.eql(history[2].pageData);
    });
  });
});
