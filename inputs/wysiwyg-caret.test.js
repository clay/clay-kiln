import expect from 'expect';
import * as lib from './wysiwyg-caret';

describe('wysiwyg caret', () => {
  describe('getNewlinesBeforeCaret', () => {
    const fn = lib.getNewlinesBeforeCaret;

    test('gets offset for empty field', () => expect(fn(null, 0)).to.equal(0));
    test('gets offset for plain text', () => expect(fn('hi', 2)).to.equal(2));
    test(
      'gets offset for single line of html',
      () => expect(fn('<strong>hi</strong>', 2)).to.equal(2)
    );
    test(
      'gets offset for single paragraph of html',
      () => expect(fn('<p>hi</p>', 2)).to.equal(2)
    );

    test(
      'gets offset for the first of two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p>', 4)).to.equal(4)
    );

    // note: the caret will be at the beginning of the SECOND LINE, not the end of the first
    test(
      'gets offset for the second of two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p>', 5)).to.equal(6)
    );

    test(
      'gets offset for more than two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p><p>bye</p>', 13)).to.equal(15)
    );
  });

  describe('getLastOffsetWithNewlines', () => {
    const fn = lib.getLastOffsetWithNewlines;

    test('gets offset for empty field', () => expect(fn(null)).to.equal(0));
    test('gets offset for plain text', () => expect(fn('hi')).to.equal(2));
    test(
      'gets offset for single line of html',
      () => expect(fn('<strong>hi</strong>')).to.equal(2)
    );
    test(
      'gets offset for single paragraph of html',
      () => expect(fn('<p>hi</p>')).to.equal(2)
    );

    test(
      'gets offset for the first of two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p>')).to.equal(12)
    );

    // note: the caret will be at the beginning of the SECOND LINE, not the end of the first
    test(
      'gets offset for the second of two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p>')).to.equal(12)
    );

    test(
      'gets offset for more than two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p><p>bye</p>')).to.equal(17)
    );
  });
});
