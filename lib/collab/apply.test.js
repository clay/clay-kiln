import ctx from './context';
import { conflictNotice, notifyConflicts, awayNotice } from './apply';

jest.mock('../core-data/api');
jest.mock('../component-data/model');
jest.mock('../component-data/create', () => ({ resolveSchema: () => Promise.resolve() }));
jest.mock('../core-data/store', () => ({ state: { components: {} }, commit: jest.fn(), dispatch: jest.fn() }));
jest.mock('../undo/actions', () => ({ rebaseHistory: jest.fn() }));

const uri = 'site/_components/paragraph/instances/a',
  ada = { id: 'a', name: 'Ada' };

describe('collab apply', () => {
  describe('notifyConflicts, for changes from before this tab was out of touch', () => {
    beforeEach(() => {
      ctx.store = { state: { collab: { activity: [] } } };
      ctx.me = 'me';
    });

    test('says who took it over, that theirs stayed, and offers a copy of what you typed', () => {
      const store = { dispatch: jest.fn() };

      notifyConflicts(store, uri, [{
        path: 'text', mine: 'my <em>words</em>', theirs: 'theirs', kept: 'theirs'
      }], { user: ada });

      expect(store.dispatch).toHaveBeenCalledWith('showSnackbar', expect.objectContaining({
        message: 'Ada took over Paragraph while you were away', action: 'Copy your text'
      }));
    });

    test('words it plainly when nobody can be named, or it was this user in another tab', () => {
      expect(awayNotice(uri, null)).toBe('Paragraph was changed while you were away');
      expect(awayNotice(uri, { user: { id: 'me', name: 'Me' } })).toBe('You changed Paragraph in another tab while this one was away');
    });
  });

  describe('conflictNotice', () => {
    beforeEach(() => {
      ctx.store = { state: { collab: { activity: [] } } };
      ctx.unverified = false;
      ctx.missed = {};
    });

    test('names who the server says saved it last', () => {
      expect(conflictNotice(uri, ['Text'], { user: ada })).toEqual({ message: 'Ada also changed Text — kept your version', action: 'Use Ada\'s' });
    });

    test('names who the feed says changed it, if the server didn\'t say', () => {
      ctx.store.state.collab.activity = [{ uri, user: ada }];

      expect(conflictNotice(uri, ['Text']).message).toBe('Ada also changed Text — kept your version');
      // the server says nobody is known for the version merged with: an older change by Ada doesn't count
      expect(conflictNotice(uri, ['Text'], null).message).toBe('Someone also changed Text — kept your version');
    });

    test('says it changed while you were reconnecting when nobody can be named', () => {
      ctx.missed[uri] = true;

      expect(conflictNotice(uri, ['Text'], null)).toEqual({ message: 'Text was updated while you were reconnecting — kept your version', action: 'Use theirs' });
      ctx.missed = {};
      ctx.unverified = true;
      expect(conflictNotice(uri, ['Headline', 'Teaser'], { user: null }).message).toBe('Headline, Teaser were updated while you were reconnecting — kept your version');
    });

    test('falls back to "Someone" otherwise (a script, say)', () => {
      expect(conflictNotice(uri, ['Text'])).toEqual({ message: 'Someone also changed Text — kept your version', action: 'Use theirs' });
    });
  });
});
