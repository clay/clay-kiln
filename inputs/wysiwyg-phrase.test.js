import * as lib from './wysiwyg-phrase';

describe('wysiwyg phrase', () => {
  describe('parsePhraseButton', () => {
    const fn = lib.parsePhraseButton;

    test(
      'returns button config for "phrase" button',
      () => expect(fn('phrase')).toBe('phrase')
    );
    test(
      'returns button config for phrase button without class',
      () => expect(fn({ phrase: { button: 'P' } })).toBe('phrase')
    );
    test(
      'returns buttons config for phrase button with class',
      () => expect(fn({ phrase: { class: 'clay-annotated' } })).toBe('phrase-clay-annotated')
    );

    test(
      'returns button config for other string button',
      () => expect(fn('bold')).toBe('bold')
    );
    test(
      'returns button config for other object button',
      () => expect(fn({ script: 'sub' })).toEqual({ script: 'sub' })
    );
  });

  describe('parseFormats', () => {
    const fn = lib.parseFormats;

    test('always prepends header and blockquote to formats', () => {
      // note: this happens so we can parse those when pasting
      expect(fn([])).toEqual(['header', 'blockquote']);
    });

    test('does not add formats for "clean" and "phrase"', () => {
      expect(fn(['clean', 'phrase'])).toEqual(['header', 'blockquote']);
    });

    test('does not add formats for phrase object button', () => {
      expect(fn([{ phrase: {} }])).toEqual(['header', 'blockquote']);
    });

    test('adds format for non-phrase string buttons', () => {
      expect(fn(['bold'])).toEqual(['header', 'blockquote', 'bold']);
    });

    test('adds format for non-phrase object buttons', () => {
      expect(fn([{ script: 'sup' }])).toEqual(['header', 'blockquote', 'script']);
    });
  });
});
