import _ from 'lodash';
import lib from './mutations';
import { CREATE_SNAPSHOT, UNDO, REDO } from './mutationTypes';

const A = { foo: 'bar' },
  B = { baz: 'qux' },
  snapA = {
    components: { A },
    pageData: { layout: 'C', main: ['A'] }
  },
  snapB = {
    components: { A, B },
    pageData: { layout: 'C', main: ['A', 'B'] }
  };

define('undo mutations', () => {
  describe(CREATE_SNAPSHOT, () => {
    const fn = lib[CREATE_SNAPSHOT];

    it('creates snapshot of current components and page data', () => {
      expect(fn({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: [],
          cursor: 0
        }
      })).to.eql({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: [snapA],
          cursor: 0
        }
      });
    });

    it('removes old snapshots once it hits max length', () => {
      const oldHistory = ['first'].concat(_.repeat('*', 49).split(''));

      expect(fn({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: oldHistory,
          cursor: 49
        }
      })).to.eql({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: _.repeat('*', 49).split('').concat([snapA]),
          cursor: 49
        }
      });
    });
  });

  describe(UNDO, () => {
    const fn = lib[UNDO];

    it('does nothing if it cannot undo', () => {
      expect(fn({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: [snapA],
          cursor: 0
        }
      })).to.eql({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: [snapA],
          cursor: 0
        }
      });
    });

    it('steps backwards once', () => {
      expect(fn({
        components: snapB.components,
        page: { data: snapB.pageData },
        undo: {
          history: [snapA, snapB],
          cursor: 1
        }
      })).to.eql({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: [snapA, snapB],
          cursor: 0
        }
      });
    });
  });

  describe(REDO, () => {
    const fn = lib[REDO];

    it('does nothing if it cannot redo', () => {
      expect(fn({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: [snapA],
          cursor: 0
        }
      })).to.eql({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: [snapA],
          cursor: 0
        }
      });
    });

    it('steps forwards once', () => {
      expect(fn({
        components: snapA.components,
        page: { data: snapA.pageData },
        undo: {
          history: [snapA, snapB],
          cursor: 0
        }
      })).to.eql({
        components: snapB.components,
        page: { data: snapB.pageData },
        undo: {
          history: [snapA, snapB],
          cursor: 1
        }
      });
    });
  });
});
