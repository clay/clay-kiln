import * as lib from './actions';
import { isActive } from '../collab/context';
import {
  lockFor, takeOver, isClaiming
} from '../collab/locks';

jest.mock('../collab/context', () => ({ isActive: jest.fn(() => false) }));
jest.mock('../collab/locks', () => Object.assign({}, jest.requireActual('../collab/locks'), {
  lockFor: jest.fn(() => null),
  takeOver: jest.fn(() => Promise.resolve()),
  isClaiming: jest.fn(() => false)
}));

describe('decorator actions', () => {
  describe('focus, while collaborating', () => {
    const uri = 'site/_components/paragraph/instances/a',
      grace = { tab: 't1', user: { id: 'g', name: 'Grace Hopper' }, focus: { uri, path: 'text', label: 'Paragraph' } };

    function makeStore() {
      return {
        state: { ui: {} },
        commit: jest.fn(),
        dispatch: jest.fn(() => Promise.resolve())
      };
    }

    beforeEach(() => {
      isActive.mockReturnValue(true);
      lockFor.mockReset();
      takeOver.mockClear();
      isClaiming.mockReturnValue(false);
    });

    afterEach(() => isActive.mockReturnValue(false));

    test('says who is editing a field instead of opening it, with no way around it', () => {
      const store = makeStore();

      lockFor.mockReturnValue({
        uri, path: 'text', holder: grace, busy: true
      });

      return lib.focus(store, { uri, path: 'text' }).then(() => {
        expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', 'Grace Hopper is editing this');
        expect(store.dispatch).not.toHaveBeenCalledWith('openConfirm', expect.anything());
        expect(store.commit).not.toHaveBeenCalledWith('FOCUS', expect.anything());
      });
    });

    test('offers to take over a field whoever has it open has gone quiet on', () => {
      const store = makeStore(),
        lock = {
          uri, path: 'text', holder: grace, busy: false, away: false, own: false
        };

      lockFor.mockReturnValue(lock);
      lib.focus(store, { uri, path: 'text' });

      const [action, config] = store.dispatch.mock.calls[0];

      expect(action).toBe('openConfirm');
      expect(config).toMatchObject({ title: 'Grace Hopper has this open', button: 'Take over' });
      expect(config.text).not.toMatch(/anyway/i);
    });

    test('does nothing more while it is already taking that field over', () => {
      const store = makeStore();

      isClaiming.mockReturnValue(true);

      return lib.focus(store, { uri, path: 'text' }).then(() => {
        expect(store.dispatch).not.toHaveBeenCalled();
        expect(lockFor).not.toHaveBeenCalled();
      });
    });
  });

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
