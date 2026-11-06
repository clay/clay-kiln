import _ from 'lodash';
import ctx, { markOutOfTouch, isOutOfTouch } from './context';
import {
  isQuiet, lockFor, busyText, takeoverDialog, takeOver, afterSync, isClaiming, resetLocks, takenOverText, overFor, checkedIn, replacedText
} from './locks';
import { refreshNow, fetchLatest } from './remote';
import { fieldsEditedInForm } from './forms';
import { COLLAB_CLAIM } from './mutationTypes';

jest.mock('./remote', () => ({ refreshNow: jest.fn(() => Promise.resolve()), fetchLatest: jest.fn() }));
jest.mock('./forms', () => ({ fieldsEditedInForm: jest.fn(() => ['text']) }));

const uri = 'site/_components/paragraph/instances/a',
  NOW = 1000000,
  ada = { id: 'u-ada', name: 'Ada Lovelace', color: '#f00' },
  grace = { id: 'u-grace', name: 'Grace Hopper', color: '#00f' };

/**
 * Someone else's tab with something open.
 * @param {object} [focus]
 * @param {object} [props] { user, tab, state, seen }
 * @returns {object} presence entry
 */
function entry(focus, props) {
  return _.assign({
    tab: 'tab9', user: grace, state: 'active', seen: NOW, focus: focus === null ? null : _.assign({ uri, path: 'text', quiet: 0 }, focus)
  }, props);
}

/**
 * A store with presence and (optionally) a form open in this tab.
 * @param {object[]} others
 * @param {object} [form] state.ui.currentForm
 * @returns {object}
 */
function makeStore(others, form) {
  const subscribers = [],
    store = {
      state: {
        collab: {
          connected: true, others, claim: null
        },
        ui: { currentForm: form || null }
      },
      subscribers,
      subscribe: jest.fn((fn) => {
        subscribers.push(fn);

        return () => _.pull(subscribers, fn);
      }),
      commit: jest.fn((type, payload) => {
        if (type === COLLAB_CLAIM) {
          store.state.collab.claim = payload;
        }
        _.each(subscribers.slice(), fn => fn({ type, payload }, store.state));
      }),
      dispatch: jest.fn((action) => {
        if (action === 'unfocus' || action === 'closeForm') {
          store.state.ui.currentForm = null;
        }

        return Promise.resolve();
      })
    };

  return store;
}

/**
 * Let pending promises finish.
 * @returns {Promise}
 */
function settle() {
  return new Promise(resolve => jest.requireActual('timers').setImmediate(resolve));
}

describe('collab locks', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    _.assign(ctx, {
      active: true, config: {}, clock: 0, syncedAt: NOW, me: 'u-ada', tab: 'tab5', store: null, outOfTouch: {}, saving: {}
    });
    refreshNow.mockClear();
    fetchLatest.mockReset();
    fieldsEditedInForm.mockReturnValue(['text']);
    resetLocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('isQuiet', () => {
    it('is not while they are typing or changed it in the last minute', () => {
      expect(isQuiet(entry({ typing: true, quiet: 120000 }))).toBe(false);
      expect(isQuiet(entry({ quiet: 30000 }))).toBe(false);
    });

    it('is once a minute has passed without changes, counting since their tab last checked in', () => {
      expect(isQuiet(entry({ quiet: 60000 }))).toBe(true);
      expect(isQuiet(entry({ quiet: 55000 }, { seen: NOW - 6000 }))).toBe(true);
    });

    it('is when their tab is in the background, idle, or stopped checking in', () => {
      expect(isQuiet(entry({}, { state: 'hidden' }))).toBe(true);
      expect(isQuiet(entry({}, { state: 'idle' }))).toBe(true);
      expect(isQuiet(entry({ typing: true }, { seen: NOW - 20000 }))).toBe(true);
    });

    it('is not while they are asking for it themselves (unless their tab stopped checking in)', () => {
      expect(isQuiet(entry({ claim: true, quiet: 600000 }, { state: 'hidden' }))).toBe(false);
      expect(isQuiet(entry({ claim: true }, { seen: NOW - 20000 }))).toBe(true);
    });

    it('is when the server does not say how long it has been (never blocks on what it cannot tell)', () => {
      expect(isQuiet(entry({ quiet: null }, { seen: undefined }))).toBe(true);
    });

    it('waits as long as the server says', () => {
      ctx.config.takeoverAfter = 120000;
      expect(isQuiet(entry({ quiet: 90000 }))).toBe(false);
    });
  });

  describe('lockFor', () => {
    it('lets anyone open what nobody has open, or a different field of the same component', () => {
      expect(lockFor(makeStore([]), uri, 'text')).toBe(null);
      expect(lockFor(makeStore([entry({ path: 'title' })]), uri, 'text')).toBe(null);
      expect(lockFor(makeStore([entry(null)]), uri, 'text')).toBe(null);
    });

    it('says someone is editing it while they are working on it', () => {
      const lock = lockFor(makeStore([entry({ quiet: 2000 })]), uri, 'text');

      expect(lock).toMatchObject({ busy: true, holder: { user: grace } });
      expect(busyText(lock)).toBe('Grace Hopper is editing this');
    });

    it('counts a form for the whole component, either way round', () => {
      expect(lockFor(makeStore([entry({ path: null })]), uri, 'text').busy).toBe(true);
      expect(lockFor(makeStore([entry({ path: 'text' })]), uri, null).busy).toBe(true);
    });

    it('offers to take over once they have gone quiet', () => {
      const lock = lockFor(makeStore([entry({ quiet: 90000, unsaved: true })]), uri, 'text'),
        dialog = takeoverDialog(lock);

      expect(lock).toMatchObject({
        busy: false, away: false, unsaved: true, own: false
      });
      expect(dialog.title).toBe('Grace Hopper has this open');
      expect(dialog.button).toBe('Take over');
      expect(dialog.text).toBe('Grace Hopper has Paragraph open but hasn\'t changed it for a while. If you take over, anything they typed is saved first, and they\'ll see that you took over.');
      expect(dialog.text).not.toMatch(/sync|revision|collab|server|vpn/i);
      expect(takeoverDialog(lockFor(makeStore([entry({ quiet: 90000 })]), uri, 'text')).text)
        .toBe('Grace Hopper has Paragraph open but hasn\'t changed it for a while. If you take over, they\'ll see that you took over.');
    });

    it('says when they have stepped away (tab in the background, or idle)', () => {
      const lock = lockFor(makeStore([entry({ quiet: 0 }, { state: 'hidden' })]), uri, 'text');

      expect(takeoverDialog(lock).text).toMatch(/^Grace Hopper has Paragraph open but has stepped away\. If you take over/);
    });

    it('says when they are not connected, and warns that their unsaved changes will be replaced', () => {
      const lock = lockFor(makeStore([entry({ quiet: 0 }, { seen: NOW - 30000 })]), uri, 'text'),
        unsaved = lockFor(makeStore([entry({ quiet: 0, unsaved: true }, { seen: NOW - 30000 })]), uri, 'text');

      expect(lock).toMatchObject({ busy: false, away: true, unsaved: false });
      expect(takeoverDialog(lock)).toMatchObject({ text: 'Grace Hopper has Paragraph open but isn\'t connected right now.', button: 'Take over' });
      expect(takeoverDialog(unsaved)).toMatchObject({
        title: 'Grace Hopper has this open',
        text: 'Grace Hopper isn\'t connected and has unsaved changes in Paragraph. If you take over, your version replaces them.',
        button: 'Take over'
      });
    });

    it('treats someone asking for it as editing it', () => {
      expect(lockFor(makeStore([entry({ claim: true })]), uri, 'text')).toMatchObject({ busy: true, holder: { user: grace } });
    });

    it('offers to open it here when it is open in this user\'s other tab, even mid-sentence', () => {
      const lock = lockFor(makeStore([entry({ typing: true }, { user: ada })]), uri, 'text');

      expect(lock).toMatchObject({ busy: false, own: true });
      expect(takeoverDialog(lock)).toMatchObject({ title: 'You have this open in another tab', button: 'Open here' });
    });

    it('never blocks when it cannot tell who is here', () => {
      const store = makeStore([entry({ typing: true })]);

      store.state.collab.connected = false;
      expect(lockFor(store, uri, 'text')).toBe(null);

      store.state.collab.connected = true;
      ctx.syncedAt = NOW - 60000;
      expect(lockFor(store, uri, 'text')).toBe(null);
    });
  });

  describe('taking over', () => {
    it('asks for the field, and opens it with their changes once they have closed it', () => {
      const store = makeStore([entry({ quiet: 90000 })]),
        open = jest.fn();

      ctx.store = store;

      return takeOver(store, lockFor(store, uri, 'text'), open).then(() => {
        expect(store.dispatch).toHaveBeenCalledWith('unfocus');
        expect(store.state.collab.claim).toMatchObject({
          uri, path: 'text', label: 'Paragraph', by: { user: grace }
        });
        expect(isClaiming(store, uri, 'text')).toBe(true);

        afterSync(store, false); // they haven't seen it yet
        expect(open).not.toHaveBeenCalled();

        store.state.collab.others = [entry(null)]; // they saved and closed it
        afterSync(store, false);

        return settle();
      }).then(() => {
        expect(refreshNow).toHaveBeenCalledWith(store, uri, { user: grace });
        expect(open).toHaveBeenCalledTimes(1);
        expect(store.state.collab.claim).toBe(null);
      });
    });

    it('backs off if they start typing again before they see it', () => {
      const store = makeStore([entry({ quiet: 90000 })]),
        open = jest.fn();

      ctx.store = store;

      return takeOver(store, lockFor(store, uri, 'text'), open).then(() => {
        store.state.collab.others = [entry({ typing: true, quiet: 0 })];
        afterSync(store, false);

        return settle();
      }).then(() => {
        expect(open).not.toHaveBeenCalled();
        expect(store.state.collab.claim).toBe(null);
        expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', 'Grace Hopper is editing this');
      });
    });

    it('opens it anyway if their tab does not answer within a few seconds', () => {
      const store = makeStore([entry({ quiet: 90000 }, { state: 'hidden' })]),
        open = jest.fn();

      jest.useFakeTimers({ doNotFake: ['Date', 'setImmediate'] });
      ctx.store = store;

      return takeOver(store, lockFor(store, uri, 'text'), open).then(() => {
        jest.advanceTimersByTime(9000);
        expect(refreshNow).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1000);
        expect(refreshNow).toHaveBeenCalled();
        jest.useRealTimers();

        return settle();
      }).then(() => expect(open).toHaveBeenCalledTimes(1));
    });

    it('does not wait for a tab that stopped checking in, and opens over it (it drops what it had not saved)', () => {
      const store = makeStore([entry({ quiet: 0, unsaved: true }, { seen: NOW - 30000 })]),
        open = jest.fn(() => expect(overFor({ uri, path: 'text' })).toEqual(['tab9']));

      ctx.store = store;

      return takeOver(store, lockFor(store, uri, 'text'), open)
        .then(() => new Promise(resolve => setTimeout(resolve, 5)))
        .then(settle)
        .then(() => {
          expect(open).toHaveBeenCalledTimes(1);
          // the dialog already said their unsaved changes would be replaced: no second question
          expect(store.dispatch).not.toHaveBeenCalledWith('openConfirm', expect.anything());
        });
    });

    it('asks again before replacing unsaved changes when a tab that seemed around does not answer', () => {
      const store = makeStore([entry({ quiet: 90000, unsaved: true })]),
        open = jest.fn(() => expect(overFor({ uri, path: 'text' })).toEqual(['tab9']));

      jest.useFakeTimers({ doNotFake: ['Date', 'setImmediate'] });
      ctx.store = store;

      return takeOver(store, lockFor(store, uri, 'text'), open).then(() => {
        jest.advanceTimersByTime(10000);

        const [, question] = _.find(store.dispatch.mock.calls, ['0', 'openConfirm']);

        expect(question).toMatchObject({
          title: 'Grace Hopper isn\'t answering',
          text: 'Take over Paragraph anyway? Your version will replace Grace Hopper\'s unsaved changes.',
          button: 'Take over'
        });
        store.commit('OPEN_CONFIRM', question);
        question.onConfirm();
        store.commit('CLOSE_CONFIRM');
        jest.advanceTimersByTime(1);
        jest.useRealTimers();

        return settle();
      }).then(() => expect(open).toHaveBeenCalledTimes(1));
    });

    it('gives up if the user says no', () => {
      const store = makeStore([entry({ quiet: 90000, unsaved: true })]),
        open = jest.fn();

      jest.useFakeTimers({ doNotFake: ['Date', 'setImmediate'] });
      ctx.store = store;

      return takeOver(store, lockFor(store, uri, 'text'), open).then(() => {
        jest.advanceTimersByTime(10000);
        store.commit('OPEN_CONFIRM', {});
        store.commit('CLOSE_CONFIRM');
        jest.advanceTimersByTime(1);
        jest.useRealTimers();

        return settle();
      }).then(() => {
        expect(open).not.toHaveBeenCalled();
        expect(store.state.collab.claim).toBe(null);
      });
    });

    it('opens without asking when the tab that does not answer had nothing unsaved', () => {
      const store = makeStore([entry({ quiet: 90000 })]),
        open = jest.fn();

      jest.useFakeTimers({ doNotFake: ['Date', 'setImmediate'] });
      ctx.store = store;

      return takeOver(store, lockFor(store, uri, 'text'), open).then(() => {
        jest.advanceTimersByTime(10000);
        jest.useRealTimers();

        return settle();
      }).then(() => {
        expect(store.dispatch).not.toHaveBeenCalledWith('openConfirm', expect.anything());
        expect(open).toHaveBeenCalledTimes(1);
      });
    });

    it('stops asking when they let go after all', () => {
      const store = makeStore([entry({ quiet: 90000, unsaved: true })]),
        open = jest.fn();

      jest.useFakeTimers({ doNotFake: ['Date', 'setImmediate'] });
      ctx.store = store;

      return takeOver(store, lockFor(store, uri, 'text'), open).then(() => {
        jest.advanceTimersByTime(10000);
        store.state.collab.others = [entry(null)]; // they saved and closed it
        afterSync(store, false);
        jest.useRealTimers();

        return settle();
      }).then(() => {
        expect(store.dispatch).toHaveBeenCalledWith('closeConfirm');
        expect(open).toHaveBeenCalledTimes(1);
        expect(overFor({ uri, path: 'text' })).toBeUndefined();
      });
    });

    it('lets the first of two people taking over at once go first', () => {
      const store = makeStore([entry({ quiet: 90000 })]),
        open = jest.fn();

      ctx.store = store;

      return takeOver(store, lockFor(store, uri, 'text'), open).then(() => {
        store.state.collab.others = [entry({ quiet: 90000 }), entry({ claim: true }, { tab: 'tab1', user: { id: 'u-linus', name: 'Linus Torvalds' } })];
        afterSync(store, false);
      }).then(() => {
        expect(store.state.collab.claim).toBe(null);
        expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', 'Linus Torvalds is editing this');
      });
    });
  });

  describe('handing over', () => {
    const form = { uri, path: 'text', fields: { text: 'typed' } };

    it('saves and closes the form when someone asks for it and this user has gone quiet, and says who took over', () => {
      const store = makeStore([entry({ claim: true }, { user: grace })], form);

      afterSync(store, true);

      return settle().then(() => {
        expect(store.dispatch).toHaveBeenCalledWith('unfocus');
        expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', {
          message: 'Grace Hopper took over Paragraph — your changes were saved', duration: 8000
        });
      });
    });

    it('does not mention saving when nothing changed', () => {
      const store = makeStore([entry({ claim: true })], form);

      fieldsEditedInForm.mockReturnValue([]);
      afterSync(store, true);

      return settle().then(() => expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', expect.objectContaining({ message: 'Grace Hopper took over Paragraph' })));
    });

    it('keeps the form while this user is working on it', () => {
      const store = makeStore([entry({ claim: true })], form);

      afterSync(store, false);
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('ignores a tab that stopped checking in, or someone quiet on it too', () => {
      const store = makeStore([entry({ claim: true }, { seen: NOW - 30000 }), entry({ quiet: 90000 }, { tab: 'tab8' })], form);

      afterSync(store, true);
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('hands over to someone actively editing it too (both opened it at once, or this tab was away)', () => {
      const store = makeStore([entry({ typing: true })], form);

      afterSync(store, true);
      expect(store.dispatch).toHaveBeenCalledWith('unfocus');

      return settle().then(() => expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', expect.objectContaining({
        message: 'Grace Hopper is editing Paragraph now — your changes were saved'
      })));
    });

    it('always hands over to this user\'s other tab', () => {
      const store = makeStore([entry({ claim: true }, { user: ada })], form);

      afterSync(store, false);

      return settle().then(() => expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', expect.objectContaining({
        message: 'You opened Paragraph in another tab — your changes here were saved'
      })));
    });

    it('waits to say so until the tab is in front', () => {
      const store = makeStore([entry({ claim: true })], form);
      let hidden = true;

      jest.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
      afterSync(store, true);

      return settle().then(() => {
        expect(store.dispatch).not.toHaveBeenCalledWith('showSnackbar', expect.anything());
        hidden = false;
        document.dispatchEvent(new Event('visibilitychange'));
        expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', expect.objectContaining({ message: 'Grace Hopper took over Paragraph — your changes were saved' }));
      });
    });

    it('does not say the changes were saved when the save failed (that says so itself)', () => {
      const store = makeStore([entry({ claim: true })], form);

      store.dispatch.mockImplementation((action) => {
        if (action === 'unfocus') {
          store.state.ui.currentForm = null;
          store.commit('FINISH_PROGRESS', 'error');
        }

        return Promise.resolve();
      });
      afterSync(store, true);

      return settle().then(() => expect(store.dispatch).not.toHaveBeenCalledWith('showSnackbar', expect.anything()));
    });

    it('does not keep trying when the form will not close', () => {
      const store = makeStore([entry({ claim: true })], form);

      store.dispatch.mockImplementation(() => Promise.resolve()); // validation keeps it open
      afterSync(store, true);

      return settle().then(() => {
        afterSync(store, true);
        expect(_.filter(store.dispatch.mock.calls, ['0', 'unfocus'])).toHaveLength(1);
      });
    });

    it('lets go without saving when someone took it over while this tab was away, and offers a copy', () => {
      const store = makeStore([entry({ over: ['tab5'] })], form);

      afterSync(store, false); // even mid-sentence: they were told their version replaces this

      return settle().then(() => {
        expect(store.commit).toHaveBeenCalledWith('UN_FOCUS');
        expect(store.dispatch).toHaveBeenCalledWith('closeForm', { discard: true });
        expect(store.dispatch).not.toHaveBeenCalledWith('unfocus');
        expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', expect.objectContaining({
          message: 'Grace Hopper took over Paragraph while you were away', action: 'Copy your text'
        }));
      });
    });

    it('lets go without saving when it was out of touch with changes and someone has it open now', () => {
      const store = makeStore([entry({ quiet: 90000 })], form);

      markOutOfTouch([uri]);
      afterSync(store, false);

      return settle().then(() => {
        expect(store.dispatch).toHaveBeenCalledWith('closeForm', { discard: true });
        expect(isOutOfTouch(uri)).toBe(false);
      });
    });

    it('just says who has it when there was nothing unsaved to lose', () => {
      const store = makeStore([entry({ over: ['tab5'] })], form);

      fieldsEditedInForm.mockReturnValue([]);
      afterSync(store, false);

      return settle().then(() => expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', expect.objectContaining({
        message: 'Grace Hopper is editing Paragraph now'
      })));
    });

    it('lets go when it was out of touch and someone changed the field it is editing meanwhile (no stale typing)', () => {
      const store = makeStore([], form);

      markOutOfTouch([uri]);
      ctx.formBase = {
        uri, path: 'text', fields: { text: 'base' }, data: {}
      };
      store.state.collab.pending = { [uri]: { by: { user: grace }, rev: 7 } };
      fetchLatest.mockReturnValue(Promise.resolve({ data: { text: 'grace changed it' }, rev: 7 }));
      afterSync(store, false);

      return settle().then(() => {
        expect(store.dispatch).toHaveBeenCalledWith('closeForm', { discard: true });
        expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', expect.objectContaining({
          message: 'Grace Hopper took over Paragraph while you were away', action: 'Copy your text'
        }));
      });
    });

    it('keeps the form when what changed meanwhile was another field (it merges)', () => {
      const store = makeStore([], form);

      markOutOfTouch([uri]);
      ctx.formBase = {
        uri, path: 'text', fields: { text: 'base' }, data: {}
      };
      store.state.collab.pending = { [uri]: { by: { user: grace }, rev: 8 } };
      fetchLatest.mockReturnValue(Promise.resolve({ data: { text: 'base', title: 'grace changed this' }, rev: 8 }));
      afterSync(store, false);

      return settle().then(() => {
        afterSync(store, false); // checked once per change
        expect(fetchLatest).toHaveBeenCalledTimes(1);
        expect(store.dispatch).not.toHaveBeenCalledWith('closeForm', expect.anything());
      });
    });

    it('still hands over (saving) when it was out of touch but someone is only asking', () => {
      const store = makeStore([entry({ claim: true })], form);

      markOutOfTouch([uri]);
      afterSync(store, true);
      expect(store.dispatch).toHaveBeenCalledWith('unfocus');
    });

    it('counts itself out of touch after a long gap, for the open form and saves still on their way', () => {
      const store = makeStore([], form);

      ctx.saving = { 'site/_components/other/instances/b': 1 };
      checkedIn(store, 5000);
      expect(isOutOfTouch(uri)).toBe(false);
      checkedIn(store, 13000);
      expect(isOutOfTouch(uri)).toBe(true);
      expect(isOutOfTouch('site/_components/other/instances/b')).toBe(true);
    });

    it('words the notice plainly', () => {
      expect(takenOverText(entry({ claim: true }), 'Headline', true)).toBe('Grace Hopper took over Headline — your changes were saved');
      expect(takenOverText(entry({ claim: true }, { user: ada }), 'Headline', false)).toBe('You opened Headline in another tab');
      expect(takenOverText(entry({ typing: true }), 'Headline', true)).toBe('Grace Hopper is editing Headline now — your changes were saved');
      expect(takenOverText(entry({}, { user: ada }), 'Headline', false)).toBe('You\'re editing Headline in another tab');
      expect(replacedText(entry({}), 'Headline')).toBe('Grace Hopper took over Headline while you were away');
      expect(replacedText(entry({}, { user: ada }), 'Headline')).toBe('You opened Headline in another tab');
    });
  });
});
