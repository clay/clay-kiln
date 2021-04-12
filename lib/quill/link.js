import Quill from 'quill/dist/quill.min.js';

const Inline = Quill.import('blots/inline');

/**
 * Confirms that a URL loosely matches one of the following formats:
 * - {protocol}://{domain}/*
 * - mailto:{address}
 * - #{anchor}
 * - /{path}
 *
 * Note: We do not use a try/catch on 'new URL' here because browsers
 * vary in their implementation. Some will allow spaces (encoding them),
 * others will throw if spaces are encountered.
 *
 * Same-site links that start with "/" pass validation because they may be the
 * result of an import process or exist historically (even though Kiln does
 * not allow their creation manually).
 *
 * Links relative to the current page (ie. not starting with "/") do not pass.
 *
 * @param {string} url: The href value of a link.
 * @returns {boolean} true if link is valid URL, else false.
 */
const isValid = (url) => (
  (/^\w+:\/\/[^\s/$.?#].[^\s]*$/u).test(url) // {protocol}://{domain}/*
  || (/^mailto:[^\s]+@[^\s]+$/u).test(url) // mailto:{address}
  || (/^#[^\s]*$/u).test(url) // #{anchor}
  || (/^\/[^\s]*$/u).test(url) // same-site links (legacy)
);

class SafeLink extends Inline {
  static create(value) {
    const node = super.create(value);

    if (!isValid(value)) {
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
export { isValid };
