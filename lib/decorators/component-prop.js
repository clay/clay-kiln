import {
  editAttr, componentProp, componentPropClass, pageAreaClass
} from '../utils/references';
import { getSchema } from '../core-data/components';

/**
 * decorate component prop
 * @param {Element} el
 * @param {object} componentProp
 */
function addComponentProp(el, componentProp) {
  const isPage = componentProp.page;

  // add a class to the div so we can reference it later
  el.classList.add(componentPropClass);
  if (isPage) {
    el.classList.add(pageAreaClass);
  }
}

/**
 * decorate component prop if specified in the schema
 * @param  {string} uri
 * @param  {Element} el with data-editable
 */
export default function handler(uri, el) {
  const path = el.getAttribute(editAttr),
    schema = getSchema(uri, path); // note: component props are ALWAYS a single field, so we don't need co call groups.get

  if (schema && schema[componentProp]) {
    addComponentProp(el, schema[componentProp]);
  }
}
