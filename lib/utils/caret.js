import { closest } from '@nymag/dom';
import { getParentComponent } from './component-elements';
import {
  editAttr, refAttr, placeholderClass, permanentPlaceholderClass, selectorClass
} from './references';
import { getData } from '../core-data/components';

/**
 * get the text node we clicked into, plus the offset within it
 * @param  {MouseEvent} e
 * @param {document} doc
 * @return {object}
 */
function getTextOffset(e, doc) {
  let range,
    textNode,
    offset;

  /* istanbul ignore next */
  if (doc.caretPositionFromPoint) {
    range = doc.caretPositionFromPoint(e.clientX, e.clientY);
    textNode = range.offsetNode;
    offset = range.offset;
  } else if (doc.caretRangeFromPoint) {
    range = doc.caretRangeFromPoint(e.clientX, e.clientY);
    textNode = range.startContainer;
    offset = range.startOffset;
  }

  return { textNode, offset };
}

export function getClickOffset(e, doc = document) {
  const { textNode, offset } = getTextOffset(e, doc),
    parent = getParentComponent(textNode),
    el = closest(textNode, `[${editAttr}]`),
    uri = parent.getAttribute(refAttr),
    path = el.getAttribute(editAttr),
    data = getData(uri, path), // note: this won't get a click offset for groups, only single fields
    tempEl = doc.createElement('div');

  let parentOffset;

  // if we are actually clicking on a placeholder (not real data), just return 0
  if (closest(textNode, `.${placeholderClass}`) || closest(textNode, `.${permanentPlaceholderClass}`)) {
    return 0;
  }

  // if we're clicking past text in a component, the node will be the selector.
  // the caret should be set at the end of the text, rather than the beginning
  if (textNode.nodeType === textNode.ELEMENT_NODE && textNode.classList.contains(selectorClass)) {
    tempEl.innerHTML = data;

    return tempEl.textContent.length;
  }

  // otherwise, grab the data and create a temporary element to put it in.
  // we need this so we can grab the textContent and get the index of the clicked textNode,
  // then add the offset (inside the textNode) to the index of the node in the larger data
  tempEl.innerHTML = data;
  parentOffset = tempEl.textContent.indexOf(textNode.textContent);

  // if the text we clicked isn't inside the parent's data, it's probably some custom thing
  // (e.g. the article circulation area) rather than text we want to set the caret into
  if (parentOffset === -1) {
    return 0;
  }

  // otherwise, just add the parentOffset and the offset together to get the caret position
  return parentOffset + offset;
}
