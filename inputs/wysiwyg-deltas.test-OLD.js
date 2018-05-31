import expect from 'expect';
import * as lib from './wysiwyg-deltas';
import Quill from 'quill/dist/quill.min.js';

const Delta = Quill.import('delta');

describe('wysiwyg deltas', () => {
  describe('renderDeltas', () => {
    const fn = lib.renderDeltas;

    test('renders deltas to string', () => {
      expect(fn({
        ops: [{
          insert: 'hello '
        }, {
          insert: 'world',
          attributes: { bold: true }
        }]
      })).to.eql('hello <strong>world</strong>');
    });

    test(
      'converts paragraphs to line breaks, removing extraneous line break between paragraphs',
      () => {
        expect(fn({
          ops: [{
            insert: 'hello'
          }, {
            insert: '\n\n'
          }, {
            insert: 'world'
          }]
        })).to.eql('hello<br /><br />world');
      }
    );

    test('preserves single line breaks', () => {
      expect(fn({
        ops: [{
          insert: 'hello'
        }, {
          insert: '\n'
        }, {
          insert: 'world'
        }]
      })).to.eql('hello<br />world');
    });
  });

  describe('generateDeltas', () => {
    const fn = lib.generateDeltas,
      fakeMatchers = [(node) => new Delta({ insert: node.textContent })];

    test(
      'generates empty delta for empty string',
      () => expect(fn('', fakeMatchers, fakeMatchers)).to.eql(new Delta())
    );

    test(
      'generates empty delta for empty element',
      () => expect(fn('<p></p>', fakeMatchers, fakeMatchers)).to.eql(new Delta())
    );

    test(
      'generates empty delta for things other than text or element',
      () => expect(fn('<!-- hi -->', fakeMatchers, fakeMatchers)).to.eql(new Delta())
    );

    test(
      'generates delta for text',
      () => expect(fn('hi', fakeMatchers, fakeMatchers)).to.eql(new Delta({ insert: 'hi' }))
    );

    test(
      'generates delta for element w/ text',
      () => expect(fn('<p>hi</p>', fakeMatchers, fakeMatchers)).to.eql(new Delta({ insert: 'hi' }))
    );

    // note: because we're not passing in any matchers, nothing fancy is happening to the tags
    test(
      'generates delta for element w/ child elements',
      () => expect(fn('<p><strong>hi</strong></p>', fakeMatchers, fakeMatchers)).to.eql(new Delta({ insert: 'hi' }))
    );
  });

  describe('deltaEndsWith', () => {
    const fn = lib.deltaEndsWith;

    test('returns false if delta does not end with specified text', () => {
      expect(fn(new Delta().insert('hi'), 'bye')).to.equal(false);
    });

    test('returns true if delta ends with specified text', () => {
      expect(fn(new Delta().insert('hi'), 'hi')).to.equal(true);
    });
  });

  describe('matchLineBreak', () => {
    const fn = lib.matchLineBreak;

    test('matches br tags without breaks in the delta', () => {
      expect(fn({ tagName: 'BR' }, new Delta().insert('hi')).ops).to.eql([{ insert: 'hi\n' }]);
    });

    test('does not match br tags with breaks in the delta', () => {
      expect(fn({ tagName: 'BR' }, new Delta().insert('hi\n')).ops).to.eql([{ insert: 'hi\n' }]); // no change
    });

    test('does not match other tags', () => {
      expect(fn({ tagName: 'P' }, new Delta().insert('hi')).ops).to.eql([{ insert: 'hi' }]); // no change
    });
  });

  describe('matchParagraphs', () => {
    const fn = lib.matchParagraphs;

    test('matches non-empty p tags without breaks in the delta', () => {
      expect(fn({ tagName: 'P', textContent: 'world' }, new Delta().insert('hello')).ops).to.eql([{ insert: 'hello\n' }]);
    });

    test('does not match non-empty p tags with breaks in the delta', () => {
      expect(fn({ tagName: 'P', textContent: 'world' }, new Delta().insert('hi\n')).ops).to.eql([{ insert: 'hi\n' }]); // no change
    });

    test('does not match empty p tags', () => {
      expect(fn({ tagName: 'P', textContent: '' }, new Delta().insert('hi')).ops).to.eql([{ insert: 'hi' }]); // no change
    });

    test('does not match other tags', () => {
      expect(fn({ tagName: 'SPAN', textContent: 'world' }, new Delta().insert('hi')).ops).to.eql([{ insert: 'hi' }]); // no change
    });
  });
});
