import * as components from '../core-data/components';
import * as lib from './template';

jest.mock('../core-data/components');

describe('component template', () => {
  beforeEach(() => {
    components.getTemplate.mockReturnValue(data => `hi ${data.locals.edit} ${data.text} (${data._ref}) (${data.componentVariation})!`);
    components.getLocals.mockReturnValue({ edit: true });
  });

  describe('compose', () => {
    const fn = lib.compose;

    test('gets data for leaf components', () => {
      expect(fn('foo', { a: 'b' })).toEqual({ a: 'b' });
    });

    test('gets data for branch components', () => {
      components.getData.mockReturnValue({ a: 'b' });
      expect(fn('foo', { child: { _ref: 'bar' }, c: 'd' })).toEqual({ child: { _ref: 'bar', a: 'b' }, c: 'd' });
    });

    test('throws error if child does not exist in store', () => {
      components.getData.mockReturnValue(undefined);
      expect(() => fn('foo', { child: { _ref: 'bar' } })).toThrow(Error);
    });
  });

  describe('render', () => {
    const fn = lib.render;

    test('renders with data and locals', () => {
      fn('foo', { _ref: 'foo', text: 'friend', componentVariation: 'foo_bar' }).then((res) => {
        expect(res.wholeText).toBe('hi true friend (foo) (foo_bar)!');
      });
    });

    test('adds _ref if not passed in', () => {
      fn('foo', { text: 'friend', componentVariation: 'foo_bar' }).then((res) => {
        expect(res.wholeText).toBe('hi true friend (foo) (foo_bar)!');
      });
    });

    test('adds componentVariation if not passed in', () => {
      fn('foo', { _ref: 'foo', text: 'friend' }).then((res) => {
        expect(res.wholeText).toBe('hi true friend (foo) (foo)!');
      });
    });
  });
});
