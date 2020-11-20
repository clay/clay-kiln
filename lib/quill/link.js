import Quill from 'quill/dist/quill.min.js';

const Link = Quill.import('formats/link');

/**
 * SafeLink is a Link class with additional convenience features.
 * The primary differences between SafeLink and Link:
 *
 * 1. SafeLink will automatically add the 'https://' protocol when missing.
 * 2. SafeLink supports # same-page anchor links.
 */
class SafeLink extends Link {
  static create(value) {
    const node = super.create(value),
      url = this.sanitize(value);

    node.setAttribute('href', url);
    node.setAttribute('rel', 'noopener noreferrer');
    node.setAttribute('target', '_blank');

    return node;
  }

  static formats(domNode) {
    return domNode.getAttribute('href');
  }

  static sanitize(value) {
    if (!(/^\w+:/u).test(value) && !(/^#/u).test(value)) {
      return `https://${value}`;
    }

    return value;
  }

  format(name, value) {
    if (name !== this.statics.blotName || !value) {
      super.format(name, value);
    } else {
      this.domNode.setAttribute('href', this.constructor.sanitize(value));
    }
  }
}
SafeLink.blotName = 'link';
SafeLink.tagName = 'A';

export { SafeLink as default };
