import _ from 'lodash';
import { wrapElements } from '@nymag/dom';
import { editAttr, componentListProp, componentListClass, pageAreaClass } from '../utils/references';
import { getSchema } from '../core-data/components';

/**
 * certain nodes should NOT be wrapped in the component list:
 * component selector
 * script tags (injected if a component is reloaded from the server)
 * style tags (injected if a component is reloaded from the server)
 * note: script and style tags might also be added by the component itself, e.g. for embeds
 * @param {Element} node
 * @returns {boolean}
 */
function isWrappable(node) {
  return !node.classList.contains('component-selector') && !_.includes(['SCRIPT', 'STYLE'], node.tagName);
}

/**
 * decorate component list
 * @param {Element} el
 * @param {object} componentList
 */
function addComponentList(el, componentList) {
  // wrap everything that ISN'T the component selector
  const wrappableEls = _.filter(el.childNodes, (child) => child.nodeType !== 1 || isWrappable(child)),
    dropArea = wrapElements(wrappableEls, 'div'),
    isPage = componentList.page;

  // add a class to the div so we can reference it later
  dropArea.classList.add(componentListClass);
  if (isPage) {
    dropArea.classList.add(pageAreaClass);
  }

  // todo: add dragula here
  el.appendChild(dropArea);
}

/**
 * decorate component list if specified in the schema
 * @param  {string} uri
 * @param  {Element} el with data-editable
 */
export default function handler(uri, el) {
  const path = el.getAttribute(editAttr),
    schema = getSchema(uri, path); // note: component lists are ALWAYS a single field, so we don't need co call groups.get

  if (schema && schema[componentListProp]) {
    addComponentList(el, schema[componentListProp]);
  }
}
