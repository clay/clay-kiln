import expect from 'expect';
import Quill from 'quill/dist/quill.min.js';
import * as lib from './wysiwyg-phrase';

const icons = Quill.import('ui/icons');

describe('wysiwyg phrase', () => {
  describe('parsePhraseButton', () => {
    const fn = lib.parsePhraseButton;

    test(
      'returns button config for "phrase" button',
      () => expect(fn('phrase')).to.equal('phrase')
    );
    test(
      'returns button config for phrase button without class',
      () => expect(fn({ phrase: { button: 'P' }})).to.equal('phrase')
    );
    test(
      'returns buttons config for phrase button with class',
      () => expect(fn({ phrase: { class: 'clay-annotated' }})).to.equal('phrase-clay-annotated')
    );

    test(
      'returns button config for other string button',
      () => expect(fn('bold')).to.equal('bold')
    );
    test(
      'returns button config for other object button',
      () => expect(fn({ script: 'sub' })).to.eql({ script: 'sub' })
    );
  });

  describe('parseFormats', () => {
    const fn = lib.parseFormats;

    test('always prepends header and blockquote to formats', () => {
      // note: this happens so we can parse those when pasting
      expect(fn([])).to.eql(['header', 'blockquote']);
    });

    test('does not add formats for "clean" and "phrase"', () => {
      expect(fn(['clean', 'phrase'])).to.eql(['header', 'blockquote']);
    });

    test('does not add formats for phrase object button', () => {
      expect(fn([{ phrase: {} }])).to.eql(['header', 'blockquote']);
    });

    test('adds format for non-phrase string buttons', () => {
      expect(fn(['bold'])).to.eql(['header', 'blockquote', 'bold']);
    });

    test('adds format for non-phrase object buttons', () => {
      expect(fn([{ script: 'sup' }])).to.eql(['header', 'blockquote', 'script']);
    });
  });

  describe('createPhraseBlots', () => {
    const fn = lib.createPhraseBlots;

    test('creates blot for phrase without class', () => {
      fn(['phrase']);
      expect(Quill.imports['formats/phrase']).to.not.equal(undefined);
    });

    test('creates blot for phrase with class', () => {
      fn([{ phrase: { class: 'foo' }}]);
      expect(Quill.imports['formats/phrase-foo']).to.not.equal(undefined);
    });

    test('does not create blot if blot already exists', () => {
      let oldPhraseBlot;

      // first, create the old blot
      // note: this was probably created already in a test above, but
      // it's also done here in case the tests change
      fn(['phrase']);
      oldPhraseBlot = Quill.imports['formats/phrase'];

      // then try to create it again, and test it
      fn(['phrase']);
      expect(Quill.imports['formats/phrase']).to.equal(oldPhraseBlot);
    });

    test('creates default button', () => {
      fn(['phrase']);
      expect(icons.phrase).to.equal('<span class="kiln-phrase-button">P</span>');
    });

    test('creates custom button', () => {
      fn([{ phrase: { class: 'bar', button: 'A' }}]);
      expect(icons['phrase-bar']).to.equal('<span class="kiln-phrase-button">A</span>');
    });

    test('returns the name of the phrase created', () => {
      const name = fn([{ phrase: { class: 'baz' }}]);

      expect(name).to.eql(['phrase-baz']);
    });
  });
});
