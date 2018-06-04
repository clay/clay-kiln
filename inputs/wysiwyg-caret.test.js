import * as lib from './wysiwyg-caret';

describe('wysiwyg caret', () => {
  describe('getNewlinesBeforeCaret', () => {
    const fn = lib.getNewlinesBeforeCaret;

    test('gets offset for empty field', () => expect(fn(null, 0)).toBe(0));
    test('gets offset for plain text', () => expect(fn('hi', 2)).toBe(2));
    test(
      'gets offset for single line of html',
      () => expect(fn('<strong>hi</strong>', 2)).toBe(2)
    );
    test(
      'gets offset for single paragraph of html',
      () => expect(fn('<p>hi</p>', 2)).toBe(2)
    );

    test(
      'gets offset for the first of two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p>', 4)).toBe(4)
    );

    // note: the caret will be at the beginning of the SECOND LINE, not the end of the first
    test(
      'gets offset for the second of two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p>', 5)).toBe(6)
    );

    test(
      'gets offset for more than two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p><p>bye</p>', 13)).toBe(15)
    );
  });

  describe('getLastOffsetWithNewlines', () => {
    const fn = lib.getLastOffsetWithNewlines;

    test('gets offset for empty field', () => expect(fn(null)).toBe(0));
    test('gets offset for plain text', () => expect(fn('hi')).toBe(2));
    test(
      'gets offset for single line of html',
      () => expect(fn('<strong>hi</strong>')).toBe(2)
    );
    test(
      'gets offset for single paragraph of html',
      () => expect(fn('<p>hi</p>')).toBe(2)
    );

    test(
      'gets offset for the first of two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p>')).toBe(12)
    );

    // note: the caret will be at the beginning of the SECOND LINE, not the end of the first
    test(
      'gets offset for the second of two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p>')).toBe(12)
    );

    test(
      'gets offset for more than two paragraphs',
      () => expect(fn('<p>hello</p><p>world</p><p>bye</p>')).toBe(17)
    );
  });
});
