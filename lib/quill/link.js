import Quill from 'quill/dist/quill.min.js';

const Link = Quill.import('formats/link');

/**
 * SafeLink is a Link class with additional convenience features.
 * The primary differences between SafeLink and Link:
 *
 * 1. SafeLink will automatically add the 'https://' protocol when missing.
 * 2. SafeLink will _not_ create links for invalid URLs.
 * 3. SafeLink supports # same-page anchor links.
 */
class SafeLink extends Link {
  static create(value) {
    const node = super.create(value);
    const url = this.sanitize(value);

    if (url) {
      node.setAttribute('href', url);
      node.setAttribute('rel', 'noopener noreferrer');
      node.setAttribute('target', '_blank');
    }

    return node;
  }

  static formats(domNode) {
    return domNode.getAttribute('href');
  }

  static sanitize(url) {
    let value = '';

    if (!(/^\w+:/).test(url) && !(/^#/).test(url)) {
      value = `https://${url}`;

      try {
        new URL(value);
      } catch (err) {
        value = '';
      }
    }

    return value;
  }

  optimize(context) {
    if (!this.domNode || !this.domNode.getAttribute('href')) {
      this.unwrap();
    } else {
      return super.optimize(context);
    }
  }

  format(name, value) {
    if (name !== this.statics.blotName || !value) {
      super.format(name, value);
    } else {
      this.domNode.setAttribute('href', this.constructor.sanitize(value));
    }
  }
}
Link.blotName = 'link';
Link.tagName = 'A';

export { SafeLink as default };
