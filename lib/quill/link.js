import Quill from 'quill/dist/quill.min.js';

const Inline = Quill.import('blots/inline');

class SafeLink extends Inline {
  static create(value) {
    const node = super.create(value);
    let url = '';

    if (/^\//.test(value)) {
      // This is an href value relative to the current domain root.
      url = `${document.location.origin}${value}`;
    } else if (/^#/.test(value)) {
      // This is an href value containing a same-page anchor link.
      url = `${document.location.origin}${document.location.pathname}${value}`;
    } else {
      // This represents any other URL value (eg. https://, mailto:).
      url = value;
    }

    try {
      new URL(url);
    } catch (err) {
      node.setAttribute('class', 'kiln-link-invalid');
    }

    node.setAttribute('href', value);
    node.setAttribute('rel', 'noopener noreferrer');
    node.setAttribute('target', '_blank');

    return node;
  }

  static formats(domNode) {
    return domNode.getAttribute('href');
  }

  static sanitize(url) {
    return url;
  }

  optimize(context) {
    if (!this.domNode) {
      this.unwrap();
      return;
    }

    // When the href value is empty or unavailable the <a> tag is removed.
    if (!this.domNode.getAttribute('href')) {
      this.unwrap();
      return;
    }

    /**
     * When the link text is a single non-alphanumeric character the <a>
     * tag is removed. This avoids painful searches for invalid hyperlinks
     * on whitespace, punctuation, etc...
     */
    if (this.domNode.text.length === 1 && !(/\w/.test(this.domNode.text))) {
      this.unwrap();
      return;
    }

    return super.optimize(context);
  }

  format(name, value) {
    if (name !== this.statics.blotName || !value) {
      super.format(name, value);
    } else {
      this.domNode.setAttribute('href', value);
    }
  }
}
SafeLink.blotName = 'link';
SafeLink.tagName = 'A';


export { SafeLink as default };
