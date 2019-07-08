import _ from 'lodash';
import Quill from 'quill/dist/quill.min.js';

const Inline = Quill.import('blots/inline'),
  toolbarIcons = Quill.import('ui/icons');

/**
 * parse button configs for phrases
 * note: a phrase with no class or custom button will just be a string
 * @param  {string|object} button
 * @return {string}
 */
export function parsePhraseButton(button) {
  if (_.isObject(button) && button.phrase) {
    return button.phrase.class ? `phrase-${button.phrase.class}` : 'phrase';
  } else {
    return button; // note: 'phrase' might be the button
  }
}

/**
 * parse supported formats from button arguments
 * buttons look like 'bold' or { 'list': 'ordered' }
 * @param  {array} buttons
 * @return {array}
 */
export function parseFormats(buttons) {
  return _.reduce(buttons, (result, button) => {
    // add every string besides 'clean' and 'phrase'
    // (phrase is added later)
    if (_.isString(button) && !_.includes(['clean', 'phrase'], button)) {
      result.push(button);
    } else if (_.isObject(button) && !button.phrase) {
      // add every object besides 'phrase'
      // (phrase is added later)
      // e.g. { script: sup }, { list: ordered }
      result.push(Object.keys(button)[0]);
    }

    return result;
  }, ['header', 'blockquote']); // also support these formats, so we can paste them in
}

/**
 * get phrase configs from button configs
 * @param {array} buttons
 * @returns {array} phrases
 */
function filterPhraseButtons(buttons) {
  return _.filter(buttons, button => button === 'phrase' || _.isObject(button) && button.phrase);
}

/**
 * create phrase blots
 * @param  {array} buttons
 * @return {array}         phrase formats
 */
export function createPhraseBlots(buttons) {
  const phrases = filterPhraseButtons(buttons);

  return _.map(phrases, (phraseConfig) => {
    const phraseClass = _.isObject(phraseConfig) && phraseConfig.phrase.class,
      phraseButton = _.isObject(phraseConfig) && phraseConfig.phrase.button || 'P',
      phraseName = phraseClass ? `phrase-${phraseClass}` : 'phrase';

    let PhraseBlot;

    // create format if it hasn't been created already
    if (!Quill.imports[`formats/${phraseName}`]) {
      // add dropdown options
      toolbarIcons[phraseName] = `<span class="kiln-phrase-button">${phraseButton}</span>`;

      PhraseBlot = class extends Inline {
        /* istanbul ignore next */
        static create() {
          let node = super.create();

          node.classList.add('kiln-phrase'); // add class so it won't be sanitized out

          return node;
        }

        /* istanbul ignore next */
        static formats(domNode) {
          return domNode.classList.contains(phraseClass) || true;
        }
      };

      PhraseBlot.blotName = phraseName;
      PhraseBlot.tagName = 'SPAN';
      if (phraseClass) {
        PhraseBlot.className = phraseClass;
      }
      Quill.register(PhraseBlot);
    }

    // add format to the list of formats
    return phraseName;
  });
}
