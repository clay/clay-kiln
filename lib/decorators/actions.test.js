import * as lib from './actions';

describe('decorator actions', () => {
  describe('unselect', () => {
    const fn = lib.unselect;

    test('does not unselect if nothing selected', () => {
      const store = {
        commit: jest.fn()
      };

      store.state = { ui: { currentSelection: {} } };

      return fn(store);
      expect(store.commit.called).toBe(false);
    });

    test('unselects if something is selected', () => {
      const el = document.createElement('div'),
        store = {
          commit: jest.fn()
        };

      el.classList.add('selected');
      store.state = { ui: { currentSelection: { el } } };

      return fn(store);
      expect(store.commit).to.have.been.calledWith('UN_SELECT');
      expect(el.classList.contains('selected')).toBe(false);
    });
  });
});
