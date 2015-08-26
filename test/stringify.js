/**
 * Converts an element or fragment into a string of HTML with no extra whitespaces.
 *
 * e.g. stringify(dom.create(`<div> <strong> Hello hello </strong> </div>`))
 * returns '<div><strong>Hello hello</strong></div>'
 *
 * @param {Element|DocumentFragment} el
 * @returns {string}
 */
function stringify(el) {
  var isDocumentFragment = el.nodeType === 11,
    // Clone for in-place white-space removal.
    clone = isDocumentFragment ? el.firstElementChild.cloneNode(true) : el.cloneNode(true),
    walker = document.createTreeWalker(clone, NodeFilter.SHOW_ALL);

  while (walker.nextNode()) {
    // remove white spaces
    walker.currentNode.textContent.replace(/[^\S+]+\s[^\S+]+/g, '');
  }
  // remove line breaks
  return clone.outerHTML.replace(/(\r|\n)\s*/g, '');
}

module.exports = stringify;
