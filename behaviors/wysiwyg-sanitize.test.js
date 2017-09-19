import * as lib from './wysiwyg-sanitize';

/**
 * simple tag expectation for passthroughs
 * @param {function} fn to test
 * @param  {string} tagName
 */
function expectTag(fn, tagName) {
  expect(fn(`<${tagName}>hi</${tagName}>`)).to.equal(`<${tagName}>hi</${tagName}>`);
}

describe('wysiwyg sanitize', () => {
  describe('sanitizeInlineHTML', () => {
    const fn = lib.sanitizeInlineHTML;

    it('unescapes html tags', () => expect(fn('&lt;strong&gt;hi&lt;/strong&gt;')).to.equal('<strong>hi</strong>'));

    it('allows strong, em, a (with href), br, s, sup, sub', () => {
      expectTag(fn, 'strong');
      expectTag(fn, 'em');
      expect(fn('<a href="http://google.com">hi</a>')).to.equal('<a href="http://google.com">hi</a>');
      // note: need to test <br> inside other text, so it isn't removed
      expect(fn('hello<br />world')).to.equal('hello<br />world');
      expectTag(fn, 's');
      expect(fn('<span class="kiln-phrase">hi</span>')).to.equal('<span class="kiln-phrase">hi</span>');
      expect(fn('<span class="kiln-phrase clay-annotated">hi</span>')).to.equal('<span class="kiln-phrase clay-annotated">hi</span>');
      expect(fn('<span class="kiln-phrase clay-designed">hi</span>')).to.equal('<span class="kiln-phrase clay-designed">hi</span>');
      expectTag(fn, 'sup');
      expectTag(fn, 'sub');
    });

    it('transforms div to p (and converts to br)', () => {
      expect(fn('<div>hi</div>')).to.equal('hi');
      expect(fn('<p>hi</p>')).to.equal('hi');
      expect(fn('<div>hello</div><div>world</div>')).to.equal('hello<br />world');
      expect(fn('<p>hello</p><p>world</p>')).to.equal('hello<br />world');
    });

    it('transforms b, i, strike, and spans', () => {
      expect(fn('<b>hi</b>')).to.equal('<strong>hi</strong>');
      expect(fn('<i>hi</i>')).to.equal('<em>hi</em>');
      expect(fn('<strike>hi</strike>')).to.equal('<s>hi</s>');
      expect(fn('<span style="font-weight: 700">hi</span>')).to.equal('<strong>hi</strong>');
      expect(fn('<span style="font-style: italic">hi</span>')).to.equal('<em>hi</em>');
    });

    it('disallows spans other than phrases', () => {
      expect(fn('<span>hi</span>')).to.equal('hi');
      // no .kiln-phrase class
      expect(fn('<span class="clay-annotated">hi</span>')).to.equal('hi');
      expect(fn('<span class="clay-designed">hi</span>')).to.equal('hi');
    });

    it('disallows attributes other than a[href]', () => {
      expect(fn('<strong data-disable-me>hi</strong>')).to.equal('<strong>hi</strong>');
      expect(fn('<em class="cool">hi</em>')).to.equal('<em>hi</em>');
    });

    it('decodes html entities', () => {
      expect(fn('&hellip;')).to.equal('…');
    });

    it('lowercases tags', () => {
      expect(fn('<STRONG>hi</STRONG>')).to.equal('<strong>hi</strong>');
    });

    it('trims line breaks at the beginning and end', () => {
      expect(fn('<br />hi')).to.equal('hi');
      expect(fn('<br /><br />hi')).to.equal('hi');
      expect(fn('hi<br />')).to.equal('hi');
      expect(fn('hi<br /><br />')).to.equal('hi');
    });
  });

  describe('sanitizeMultiComponentHTML', () => {
    const fn = lib.sanitizeMultiComponentHTML;

    it('unescapes html tags', () => expect(fn('&lt;strong&gt;hi&lt;/strong&gt;')).to.equal('<strong>hi</strong>'));

    it('allows strong, em, a (with href), br, s, sup, sub', () => {
      expectTag(fn, 'strong');
      expectTag(fn, 'em');
      expect(fn('<a href="http://google.com">hi</a>')).to.equal('<a href="http://google.com">hi</a>');
      // note: need to test <br> inside other text, so it isn't removed
      expect(fn('hello<br />world')).to.equal('hello<br />world');
      expectTag(fn, 's');
      expect(fn('<span class="kiln-phrase">hi</span>')).to.equal('<span class="kiln-phrase">hi</span>');
      expect(fn('<span class="kiln-phrase clay-annotated">hi</span>')).to.equal('<span class="kiln-phrase clay-annotated">hi</span>');
      expect(fn('<span class="kiln-phrase clay-designed">hi</span>')).to.equal('<span class="kiln-phrase clay-designed">hi</span>');
      expectTag(fn, 'sup');
      expectTag(fn, 'sub');
    });

    it('transforms div to p (and converts to br) for well-formed paragraphs', () => {
      // well-formed paragraphs are split by <p>
      expect(fn('<div>hi</div>')).to.equal('hi');
      expect(fn('<p>hi</p>')).to.equal('hi');
      expect(fn('<div>hello</div><div>world</div>')).to.equal('hello<br /><br />world');
      expect(fn('<p>hello</p><p>world</p>')).to.equal('hello<br /><br />world');
    });

    it('transforms div to p (and converts to br) for malformed paragraphs', () => {
      // malformed paragraphs are split by <p><br /></p>
      expect(fn('<div>hi</div>')).to.equal('hi');
      expect(fn('<p>hi</p>')).to.equal('hi');
      expect(fn('hello<div><br /></div>world')).to.equal('hello<br /><br />world');
      expect(fn('hello<p><br /></p>world')).to.equal('hello<br /><br />world');
    });

    it('adds extra line breaks to blockquotes and headers in malformed paragraphs', () => {
      expect(fn('<p><blockquote>Foo</blockquote><br />Bar</p><p><br /></p>')).to.equal('<blockquote>Foo</blockquote><br /><br />Bar');
      expect(fn('<p><h2>Foo</h2><br />Bar</p><p><br /></p>')).to.equal('<h2>Foo</h2><br /><br />Bar');
    });

    it('parses multiple non-graf tags in malformed paragraphs', () => {
      expect(fn('<p><h2>Foo</h2><br />Bar<h3>Baz</h3><br /></p><p><br /></p>')).to.equal('<h2>Foo</h2><br /><br />Bar<h3>Baz</h3><br /><br />');
    });

    it('transforms b, i, strike, and spans', () => {
      expect(fn('<b>hi</b>')).to.equal('<strong>hi</strong>');
      expect(fn('<i>hi</i>')).to.equal('<em>hi</em>');
      expect(fn('<strike>hi</strike>')).to.equal('<s>hi</s>');
      expect(fn('<span style="font-weight: 700">hi</span>')).to.equal('<strong>hi</strong>');
      expect(fn('<span style="font-style: italic">hi</span>')).to.equal('<em>hi</em>');
    });

    it('disallows spans other than phrases', () => {
      expect(fn('<span>hi</span>')).to.equal('hi');
      // no .kiln-phrase class
      expect(fn('<span class="clay-annotated">hi</span>')).to.equal('hi');
      expect(fn('<span class="clay-designed">hi</span>')).to.equal('hi');
    });

    it('disallows attributes other than a[href]', () => {
      expect(fn('<strong data-disable-me>hi</strong>')).to.equal('<strong>hi</strong>');
      expect(fn('<em class="cool">hi</em>')).to.equal('<em>hi</em>');
    });

    it('decodes html entities', () => {
      expect(fn('&hellip;')).to.equal('…');
    });

    it('lowercases tags', () => {
      expect(fn('<STRONG>hi</STRONG>')).to.equal('<strong>hi</strong>');
    });

    it('trims line breaks at the beginning and end', () => {
      expect(fn('<br />hi')).to.equal('hi');
      expect(fn('<br /><br />hi')).to.equal('hi');
      expect(fn('hi<br />')).to.equal('hi');
      expect(fn('hi<br /><br />')).to.equal('hi');
    });
  });

  describe('sanitizeBlockHTML', () => {
    const fn = lib.sanitizeBlockHTML;

    it('unescapes html tags', () => expect(fn('&lt;strong&gt;hi&lt;/strong&gt;')).to.equal('<strong>hi</strong>'));

    it('allows strong, em, a (with href), br, s, sup, sub', () => {
      expectTag(fn, 'strong');
      expectTag(fn, 'em');
      expect(fn('<a href="http://google.com">hi</a>')).to.equal('<a href="http://google.com">hi</a>');
      // note: need to test <br> inside other text, so it isn't removed
      expect(fn('hello<br />world')).to.equal('hello<br />world');
      expectTag(fn, 's');
      expect(fn('<span class="kiln-phrase">hi</span>')).to.equal('<span class="kiln-phrase">hi</span>');
      expect(fn('<span class="kiln-phrase clay-annotated">hi</span>')).to.equal('<span class="kiln-phrase clay-annotated">hi</span>');
      expect(fn('<span class="kiln-phrase clay-designed">hi</span>')).to.equal('<span class="kiln-phrase clay-designed">hi</span>');
      expectTag(fn, 'sup');
      expectTag(fn, 'sub');
    });

    it('allows headers (1-4), blockquote, lists (ul, ol, li), paragraphs', () => {
      expectTag(fn, 'h1');
      expectTag(fn, 'h2');
      expectTag(fn, 'h3');
      expectTag(fn, 'h4');
      expectTag(fn, 'blockquote');
      expect(fn('<ul><li>hi</li></ul>')).to.equal('<ul><li>hi</li></ul>');
      expect(fn('<ol><li>hi</li></ol>')).to.equal('<ol><li>hi</li></ol>');
      expectTag(fn, 'p');
    });

    it('transforms div to p', () => {
      expect(fn('<div>hi</div>')).to.equal('<p>hi</p>');
    });

    it('does not convert p to br', () => {
      expect(fn('<p>hi</p>')).to.equal('<p>hi</p>');
    });

    it('transforms b, i, strike, and spans', () => {
      expect(fn('<b>hi</b>')).to.equal('<strong>hi</strong>');
      expect(fn('<i>hi</i>')).to.equal('<em>hi</em>');
      expect(fn('<strike>hi</strike>')).to.equal('<s>hi</s>');
      expect(fn('<span style="font-weight: 700">hi</span>')).to.equal('<strong>hi</strong>');
      expect(fn('<span style="font-style: italic">hi</span>')).to.equal('<em>hi</em>');
    });

    it('disallows spans other than phrases', () => {
      expect(fn('<span>hi</span>')).to.equal('hi');
      // no .kiln-phrase class
      expect(fn('<span class="clay-annotated">hi</span>')).to.equal('hi');
      expect(fn('<span class="clay-designed">hi</span>')).to.equal('hi');
    });

    it('disallows attributes other than a[href]', () => {
      expect(fn('<strong data-disable-me>hi</strong>')).to.equal('<strong>hi</strong>');
      expect(fn('<em class="cool">hi</em>')).to.equal('<em>hi</em>');
    });

    it('decodes html entities', () => {
      expect(fn('&hellip;')).to.equal('…');
    });

    it('lowercases tags', () => {
      expect(fn('<STRONG>hi</STRONG>')).to.equal('<strong>hi</strong>');
    });

    it('trims line breaks at the beginning and end', () => {
      expect(fn('<br />hi')).to.equal('hi');
      expect(fn('<br /><br />hi')).to.equal('hi');
      expect(fn('hi<br />')).to.equal('hi');
      expect(fn('hi<br /><br />')).to.equal('hi');
    });
  });
});
