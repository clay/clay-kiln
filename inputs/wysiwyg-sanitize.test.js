import * as lib from './wysiwyg-sanitize';

/**
 * simple tag expectation for passthroughs
 * @param {function} fn to test
 * @param  {string} tagName
 */
function expectTag(fn, tagName) {
  expect(fn(`<${tagName}>hi</${tagName}>`)).toBe(`<${tagName}>hi</${tagName}>`);
}

describe('wysiwyg sanitize', () => {
  describe('sanitizeInlineHTML', () => {
    const fn = lib.sanitizeInlineHTML;

    test(
      'unescapes html tags',
      () => expect(fn('&lt;strong&gt;hi&lt;/strong&gt;')).toBe('<strong>hi</strong>')
    );

    test('allows strong, em, a (with href), br, s, sup, sub', () => {
      expectTag(fn, 'strong');
      expectTag(fn, 'em');
      expect(fn('<a href="http://google.com">hi</a>')).toBe('<a href="http://google.com">hi</a>');
      // note: need to test <br> inside other text, so it isn't removed
      expect(fn('hello<br />world')).toBe('hello<br />world');
      expectTag(fn, 's');
      expect(fn('<span class="kiln-phrase">hi</span>')).toBe('<span class="kiln-phrase">hi</span>');
      expect(fn('<span class="kiln-phrase clay-annotated">hi</span>')).toBe('<span class="kiln-phrase clay-annotated">hi</span>');
      expect(fn('<span class="kiln-phrase clay-designed">hi</span>')).toBe('<span class="kiln-phrase clay-designed">hi</span>');
      expectTag(fn, 'sup');
      expectTag(fn, 'sub');
    });

    test('transforms div to p (and converts to br)', () => {
      expect(fn('<div>hi</div>')).toBe('hi');
      expect(fn('<p>hi</p>')).toBe('hi');
      expect(fn('<div>hello</div><div>world</div>')).toBe('hello<br />world');
      expect(fn('<p>hello</p><p>world</p>')).toBe('hello<br />world');
    });

    test('transforms b, i, strike, and spans', () => {
      expect(fn('<b>hi</b>')).toBe('<strong>hi</strong>');
      expect(fn('<i>hi</i>')).toBe('<em>hi</em>');
      expect(fn('<strike>hi</strike>')).toBe('<s>hi</s>');
      expect(fn('<span style="font-weight: 700">hi</span>')).toBe('<strong>hi</strong>');
      expect(fn('<span style="font-style: italic">hi</span>')).toBe('<em>hi</em>');
    });

    test('disallows spans other than phrases', () => {
      expect(fn('<span>hi</span>')).toBe('hi');
      // no .kiln-phrase class
      expect(fn('<span class="clay-annotated">hi</span>')).toBe('hi');
      expect(fn('<span class="clay-designed">hi</span>')).toBe('hi');
    });

    test('disallows attributes other than a[href]', () => {
      expect(fn('<strong data-disable-me>hi</strong>')).toBe('<strong>hi</strong>');
      expect(fn('<em class="cool">hi</em>')).toBe('<em>hi</em>');
    });

    test('decodes html entities', () => {
      expect(fn('&hellip;')).toBe('…');
    });

    test('lowercases tags', () => {
      expect(fn('<STRONG>hi</STRONG>')).toBe('<strong>hi</strong>');
    });

    test('trims line breaks at the beginning and end', () => {
      expect(fn('<br />hi')).toBe('hi');
      expect(fn('<br /><br />hi')).toBe('hi');
      expect(fn('hi<br />')).toBe('hi');
      expect(fn('hi<br /><br />')).toBe('hi');
    });
  });

  describe('sanitizeMultiComponentHTML', () => {
    const fn = lib.sanitizeMultiComponentHTML;

    test(
      'unescapes html tags',
      () => expect(fn('&lt;strong&gt;hi&lt;/strong&gt;')).toBe('<strong>hi</strong>')
    );

    test('allows strong, em, a (with href), br, s, sup, sub', () => {
      expectTag(fn, 'strong');
      expectTag(fn, 'em');
      expect(fn('<a href="http://google.com">hi</a>')).toBe('<a href="http://google.com">hi</a>');
      // note: need to test <br> inside other text, so it isn't removed
      expect(fn('hello<br />world')).toBe('hello<br />world');
      expectTag(fn, 's');
      expect(fn('<span class="kiln-phrase">hi</span>')).toBe('<span class="kiln-phrase">hi</span>');
      expect(fn('<span class="kiln-phrase clay-annotated">hi</span>')).toBe('<span class="kiln-phrase clay-annotated">hi</span>');
      expect(fn('<span class="kiln-phrase clay-designed">hi</span>')).toBe('<span class="kiln-phrase clay-designed">hi</span>');
      expectTag(fn, 'sup');
      expectTag(fn, 'sub');
    });

    test(
      'transforms div to p (and converts to br) for well-formed paragraphs',
      () => {
        // well-formed paragraphs are split by <p>
        expect(fn('<div>hi</div>')).toBe('hi');
        expect(fn('<p>hi</p>')).toBe('hi');
        expect(fn('<div>hello</div><div>world</div>')).toBe('hello<br /><br />world');
        expect(fn('<p>hello</p><p>world</p>')).toBe('hello<br /><br />world');
      }
    );

    test(
      'transforms div to p (and converts to br) for malformed paragraphs',
      () => {
        // malformed paragraphs are split by <p><br /></p>
        expect(fn('<div>hi</div>')).toBe('hi');
        expect(fn('<p>hi</p>')).toBe('hi');
        expect(fn('hello<div><br /></div>world')).toBe('hello<br /><br />world');
        expect(fn('hello<p><br /></p>world')).toBe('hello<br /><br />world');
      }
    );

    test(
      'adds extra line breaks to blockquotes and headers in malformed paragraphs',
      () => {
        expect(fn('<p><blockquote>Foo</blockquote><br />Bar</p><p><br /></p>')).toBe('<blockquote>Foo</blockquote><br /><br />Bar');
        expect(fn('<p><h2>Foo</h2><br />Bar</p><p><br /></p>')).toBe('<h2>Foo</h2><br /><br />Bar');
      }
    );

    test('parses multiple non-graf tags in malformed paragraphs', () => {
      expect(fn('<p><h2>Foo</h2><br />Bar<h3>Baz</h3><br /></p><p><br /></p>')).toBe('<h2>Foo</h2><br /><br />Bar<h3>Baz</h3><br /><br />');
    });

    test('transforms b, i, strike, and spans', () => {
      expect(fn('<b>hi</b>')).toBe('<strong>hi</strong>');
      expect(fn('<i>hi</i>')).toBe('<em>hi</em>');
      expect(fn('<strike>hi</strike>')).toBe('<s>hi</s>');
      expect(fn('<span style="font-weight: 700">hi</span>')).toBe('<strong>hi</strong>');
      expect(fn('<span style="font-style: italic">hi</span>')).toBe('<em>hi</em>');
    });

    test('disallows spans other than phrases', () => {
      expect(fn('<span>hi</span>')).toBe('hi');
      // no .kiln-phrase class
      expect(fn('<span class="clay-annotated">hi</span>')).toBe('hi');
      expect(fn('<span class="clay-designed">hi</span>')).toBe('hi');
    });

    test('disallows attributes other than a[href]', () => {
      expect(fn('<strong data-disable-me>hi</strong>')).toBe('<strong>hi</strong>');
      expect(fn('<em class="cool">hi</em>')).toBe('<em>hi</em>');
    });

    test('decodes html entities', () => {
      expect(fn('&hellip;')).toBe('…');
    });

    test('lowercases tags', () => {
      expect(fn('<STRONG>hi</STRONG>')).toBe('<strong>hi</strong>');
    });

    test('trims line breaks at the beginning and end', () => {
      expect(fn('<br />hi')).toBe('hi');
      expect(fn('<br /><br />hi')).toBe('hi');
      expect(fn('hi<br />')).toBe('hi');
      expect(fn('hi<br /><br />')).toBe('hi');
    });
  });

  describe('sanitizeBlockHTML', () => {
    const fn = lib.sanitizeBlockHTML;

    test(
      'unescapes html tags',
      () => expect(fn('&lt;strong&gt;hi&lt;/strong&gt;')).toBe('<strong>hi</strong>')
    );

    test('allows strong, em, a (with href), br, s, sup, sub', () => {
      expectTag(fn, 'strong');
      expectTag(fn, 'em');
      expect(fn('<a href="http://google.com">hi</a>')).toBe('<a href="http://google.com">hi</a>');
      // note: need to test <br> inside other text, so it isn't removed
      expect(fn('hello<br />world')).toBe('hello<br />world');
      expectTag(fn, 's');
      expect(fn('<span class="kiln-phrase">hi</span>')).toBe('<span class="kiln-phrase">hi</span>');
      expect(fn('<span class="kiln-phrase clay-annotated">hi</span>')).toBe('<span class="kiln-phrase clay-annotated">hi</span>');
      expect(fn('<span class="kiln-phrase clay-designed">hi</span>')).toBe('<span class="kiln-phrase clay-designed">hi</span>');
      expectTag(fn, 'sup');
      expectTag(fn, 'sub');
    });

    test(
      'allows headers (1-4), blockquote, lists (ul, ol, li), paragraphs',
      () => {
        expectTag(fn, 'h1');
        expectTag(fn, 'h2');
        expectTag(fn, 'h3');
        expectTag(fn, 'h4');
        expectTag(fn, 'blockquote');
        expect(fn('<ul><li>hi</li></ul>')).toBe('<ul><li>hi</li></ul>');
        expect(fn('<ol><li>hi</li></ol>')).toBe('<ol><li>hi</li></ol>');
        expectTag(fn, 'p');
      }
    );

    test('transforms div to p', () => {
      expect(fn('<div>hi</div>')).toBe('<p>hi</p>');
    });

    test('does not convert p to br', () => {
      expect(fn('<p>hi</p>')).toBe('<p>hi</p>');
    });

    test('transforms b, i, strike, and spans', () => {
      expect(fn('<b>hi</b>')).toBe('<strong>hi</strong>');
      expect(fn('<i>hi</i>')).toBe('<em>hi</em>');
      expect(fn('<strike>hi</strike>')).toBe('<s>hi</s>');
      expect(fn('<span style="font-weight: 700">hi</span>')).toBe('<strong>hi</strong>');
      expect(fn('<span style="font-style: italic">hi</span>')).toBe('<em>hi</em>');
    });

    test('disallows spans other than phrases', () => {
      expect(fn('<span>hi</span>')).toBe('hi');
      // no .kiln-phrase class
      expect(fn('<span class="clay-annotated">hi</span>')).toBe('hi');
      expect(fn('<span class="clay-designed">hi</span>')).toBe('hi');
    });

    test('disallows attributes other than a[href]', () => {
      expect(fn('<strong data-disable-me>hi</strong>')).toBe('<strong>hi</strong>');
      expect(fn('<em class="cool">hi</em>')).toBe('<em>hi</em>');
    });

    test('decodes html entities', () => {
      expect(fn('&hellip;')).toBe('…');
    });

    test('lowercases tags', () => {
      expect(fn('<STRONG>hi</STRONG>')).toBe('<strong>hi</strong>');
    });

    test('trims line breaks at the beginning and end', () => {
      expect(fn('<br />hi')).toBe('hi');
      expect(fn('<br /><br />hi')).toBe('hi');
      expect(fn('hi<br />')).toBe('hi');
      expect(fn('hi<br /><br />')).toBe('hi');
    });
  });
});
