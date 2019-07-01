import Quill from 'quill/dist/quill.min.js';
import _ from 'lodash';

const Delta = Quill.import('delta');

/**
 * parse out paragraphs into line breaks,
 * then remove extraneous opening/closing tags and other line breaks
 * @param  {string} html
 * @return {string}
 */
function removeParagraphs(html) {
  return html.replace(/<\/p><p>/ig, '<br />').replace(/<\/?p>/ig, '').replace(/<br>/ig, '');
}

/**
 * render deltas as html string
 * @param  {object} deltas
 * @return {string}
 */
export function renderDeltas(deltas) {
  const temp = document.createElement('div'),
    tempQuill = new Quill(temp);

  tempQuill.setContents(deltas);

  return removeParagraphs(tempQuill.root.innerHTML);
}


/**
 * traverse nodes, calling matchers
 * @param  {Node} node
 * @param  {array} elementMatchers
 * @param  {array} textMatchers
 * @return {object}
 */
function traverse(node, elementMatchers, textMatchers) { // Post-order
  if (node.nodeType === node.TEXT_NODE) {
    // run text matchers for node
    return _.reduce(textMatchers, (delta, matcher) => matcher(node, delta), new Delta());
  } else if (node.nodeType === node.ELEMENT_NODE) {
    let children = node.childNodes /* istanbul ignore next: only applies in edge cases */ || [];

    return _.reduce(children, (delta, childNode) => {
      let childDelta = traverse(childNode, elementMatchers, textMatchers),
        childMatchers = childNode['__ql-matcher'] || [];

      // run element matchers for child node
      if (childNode.nodeType === childNode.ELEMENT_NODE) {
        childDelta = _.reduce(elementMatchers, (childDelta, matcher) => matcher(childNode, childDelta), childDelta);
        /* istanbul ignore next: ql-matchers are very rarely called */
        childDelta = _.reduce(childMatchers, (childDelta, matcher) => matcher(childNode, childDelta), childDelta);
      }

      return delta.concat(childDelta);
    }, new Delta());
  } else {
    return new Delta();
  }
}

/**
 * generate deltas from html
 * note: this is the opposite of renderDeltas
 * @param  {string} html
 * @param {array} elementMatchers
 * @param {array} textMatchers
 * @return {object}
 */
export function generateDeltas(html, elementMatchers, textMatchers) {
  const temp = document.createElement('div');

  temp.innerHTML = html;

  return traverse(temp, elementMatchers, textMatchers);
}

/**
 * determine if a delta ends with certain text
 * note: pulled from quill/modules/clipboard
 * @param  {object} delta
 * @param  {string} text
 * @return {boolean}
 */
export function deltaEndsWith(delta, text) {
  let endText = '',
    i = delta.ops.length - 1;

  for (; i >= 0 && endText.length < text.length; --i) {
    let op = delta.ops[i];

    /* istanbul ignore if: copied from quill, but never hit in our code */
    if (typeof op.insert !== 'string') {
      break;
    } else {
      endText = op.insert + endText;
    }
  }

  return endText.slice(-1 * text.length) === text;
}

/**
 * match line breaks
 * @param  {Node} node
 * @param  {object} delta
 * @return {object}
 */
export function matchLineBreak(node, delta) {
  if (node.tagName === 'BR' && !deltaEndsWith(delta, '\n')) {
    delta.insert('\n');
  }

  return delta;
}

/**
 * insert newline between paragraphs
 * @param {Node} node
 * @param {object} delta
 * @returns {object}
 */
export function matchParagraphs(node, delta) {
  if (node.tagName === 'P' && !deltaEndsWith(delta, '\n') && node.textContent.length > 0) {
    delta.insert('\n');
  }

  return delta;
}
