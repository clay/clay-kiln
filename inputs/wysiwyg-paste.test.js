import * as lib from './wysiwyg-paste';

describe('wysiwyg paste', () => {
  describe('splitParagraphs', () => {
    const fn = lib.splitParagraphs;

    test(
      'does not split on a single line break',
      () => expect(fn('one<br />two')).toEqual(['one<br />two'])
    );

    test(
      'splits on two line breaks',
      () => expect(fn('one<br /><br />two')).toEqual(['one', 'two'])
    );

    // note: preserve tag for matching rules
    test('splits on headers', () => {
      expect(fn('one<h1>two</h1>three')).toEqual(['one', '<h1>two</h1>', 'three']);
      expect(fn('one<h2>two</h2>three')).toEqual(['one', '<h2>two</h2>', 'three']);
      expect(fn('one<h3>two</h3>three')).toEqual(['one', '<h3>two</h3>', 'three']);
      expect(fn('one<h4>two</h4>three')).toEqual(['one', '<h4>two</h4>', 'three']);
    });

    test(
      'splits on blockquotes',
      () => expect(fn('one<blockquote>two</blockquote>three')).toEqual(['one', '<blockquote>two</blockquote>', 'three'])
    );
  });

  describe('cleanCharacters', () => {
    const fn = lib.cleanCharacters;

    test('removes line separator and paragraph separator characters', () => {
      expect(fn('hi\u2028')).toBe('hi');
      expect(fn('hi\u2029')).toBe('hi');
    });

    test('converts tabs to spaces', () => {
      expect(fn('hello\tworld')).toBe('hello world');
      expect(fn('hello\\tworld')).toBe('hello world');
    });

    test('converts newlines after periods to line breaks', () => {
      expect(fn('Hi.\nHow are you?')).toBe('Hi.<br />How are you?');
      expect(fn('Hi.\n123')).toBe('Hi.<br />123');
    });
    test(
      'converts newlines NOT after periods to spaces',
      () => expect(fn('one\ntwo')).toBe('one two')
    );
  });

  describe('matchComponents', () => {
    const fn = lib.matchComponents;

    test(
      'throws error if no rules match',
      () => expect(() => fn(['hi'])).toThrow(Error)
    );

    test('matches against a specific rule', () => {
      expect(fn(['<blockquote>hi</blockquote>'], [{
        match: /^<blockquote>(.*?)<\/blockquote>$/,
        component: 'blockquote',
        field: 'text'
      }])).toEqual([{
        match: /^<blockquote>(.*?)<\/blockquote>$/,
        component: 'blockquote',
        field: 'text',
        value: 'hi'
      }]);
    });

    test('matches against a default rule', () => {
      expect(fn(['hi'], [{
        match: /^(.*?)$/,
        component: 'foo',
        field: 'text'
      }])).toEqual([{
        match: /^(.*?)$/,
        component: 'foo',
        field: 'text',
        value: 'hi'
      }]);
    });

    test('removes matches that only contain whitespace', () => {
      expect(fn(['   '], [{
        match: /^(.*?)$/,
        component: 'foo',
        field: 'text'
      }])).toEqual([]);
    });

    test('removes matches that only contain a tag', () => {
      expect(fn(['<br />'], [{
        match: /^(.*?)$/,
        component: 'foo',
        field: 'text'
      }])).toEqual([]);
    });
  });

  describe('generatePasteRules', () => {
    const fn = lib.generatePasteRules;

    test('generates default rules', () => {
      expect(fn(null, 'foo', 'bar')).toEqual([{
        match: /^(.*)$/,
        component: 'foo',
        field: 'bar'
      }]);
    });

    test('throws error if rule has no regex', () => {
      expect(() => fn([{ component: 'foo' }])).toThrow(Error);
    });

    test('throws error if rule cannot be parsed as regex', () => {
      expect(() => fn([{ match: '$)($^\w)' }])).toThrow(Error);
    });

    test('matches on anchor tags if specified', () => {
      expect(fn([{
        match: '(.*?)',
        matchLink: true
      }])).toEqual([{
        match: /^(?:<a(?:.*?)>)?(.*?)(?:<\/a>)?$/,
        matchLink: true
      }]);
    });
  });
});
