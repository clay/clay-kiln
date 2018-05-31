import expect from 'expect';
import * as lib from './wysiwyg-paste';

describe('wysiwyg paste', () => {
  describe('splitParagraphs', () => {
    const fn = lib.splitParagraphs;

    test(
      'does not split on a single line break',
      () => expect(fn('one<br />two')).to.eql(['one<br />two'])
    );

    test(
      'splits on two line breaks',
      () => expect(fn('one<br /><br />two')).to.eql(['one', 'two'])
    );

    // note: preserve tag for matching rules
    test('splits on headers', () => {
      expect(fn('one<h1>two</h1>three')).to.eql(['one', '<h1>two</h1>', 'three']);
      expect(fn('one<h2>two</h2>three')).to.eql(['one', '<h2>two</h2>', 'three']);
      expect(fn('one<h3>two</h3>three')).to.eql(['one', '<h3>two</h3>', 'three']);
      expect(fn('one<h4>two</h4>three')).to.eql(['one', '<h4>two</h4>', 'three']);
    });

    test(
      'splits on blockquotes',
      () => expect(fn('one<blockquote>two</blockquote>three')).to.eql(['one', '<blockquote>two</blockquote>', 'three'])
    );
  });

  describe('cleanCharacters', () => {
    const fn = lib.cleanCharacters;

    test('removes line separator and paragraph separator characters', () => {
      expect(fn('hi\u2028')).to.equal('hi');
      expect(fn('hi\u2029')).to.equal('hi');
    });

    test('converts tabs to spaces', () => {
      expect(fn('hello\tworld')).to.equal('hello world');
      expect(fn('hello\\tworld')).to.equal('hello world');
    });

    test('converts newlines after periods to line breaks', () => {
      expect(fn('Hi.\nHow are you?')).to.equal('Hi.<br />How are you?');
      expect(fn('Hi.\n123')).to.equal('Hi.<br />123');
    });
    test(
      'converts newlines NOT after periods to spaces',
      () => expect(fn('one\ntwo')).to.equal('one two')
    );
  });

  describe('matchComponents', () => {
    const fn = lib.matchComponents;

    test(
      'throws error if no rules match',
      () => expect(() => fn(['hi'])).to.throw(Error)
    );

    test('matches against a specific rule', () => {
      expect(fn(['<blockquote>hi</blockquote>'], [{
        match: /^<blockquote>(.*?)<\/blockquote>$/,
        component: 'blockquote',
        field: 'text'
      }])).to.eql([{
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
      }])).to.eql([{
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
      }])).to.eql([]);
    });

    test('removes matches that only contain a tag', () => {
      expect(fn(['<br />'], [{
        match: /^(.*?)$/,
        component: 'foo',
        field: 'text'
      }])).to.eql([]);
    });
  });

  describe('generatePasteRules', () => {
    const fn = lib.generatePasteRules;

    test('generates default rules', () => {
      expect(fn(null, 'foo', 'bar')).to.eql([{
        match: /^(.*)$/,
        component: 'foo',
        field: 'bar'
      }]);
    });

    test('throws error if rule has no regex', () => {
      expect(() => fn([{ component: 'foo' }])).to.throw(Error);
    });

    test('throws error if rule cannot be parsed as regex', () => {
      expect(() => fn([{ match: '$)($^\w)' }])).to.throw(Error);
    });

    test('matches on anchor tags if specified', () => {
      expect(fn([{
        match: '(.*?)',
        matchLink: true
      }])).to.eql([{
        match: /^(?:<a(?:.*?)>)?(.*?)(?:<\/a>)?$/,
        matchLink: true
      }]);
    });
  });
});
