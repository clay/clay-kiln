import _ from 'lodash';
import { create } from '@nymag/dom';
import { getTemplate, getLocals, getData } from '../core-data/components';
import { attempt } from '../utils/promises';
import { refProp, variationProp, getComponentName } from '../utils/references';
import logger from '../utils/log';

const log = logger(__filename);

/**
 * list deep objects in another object, used for composing deep components
 * @param {object} obj
 * @param {Function} [filter=_.identity]  Optional filter
 * @returns {array}
 */
function listDeepObjects(obj, filter) {
  let cursor, items,
    list = [],
    queue = [obj];

  while (queue.length) {
    cursor = queue.pop();
    items = _.filter(cursor, _.isObject);
    list = list.concat(_.filter(items, filter));
    queue = queue.concat(items);
  }

  return list;
}

/**
 * compose data for component and its children
 * note: this is similar to amphora's resolveComponentReferences,
 * but synchronous and slightly faster
 * @param  {string} uri  of root component
 * @param  {object} data with references to child components (they must all be in the store)
 * @return {object}      composed tree
 */
export function compose(uri, data) {
  const referenceObjects = listDeepObjects(data, refProp);

  _.each(referenceObjects, (referenceObject) => {
    const childURI = referenceObject[refProp],
      childData = _.cloneDeep(getData(childURI));

    let composedChild;

    if (!childData) {
      throw new Error(`Data for ${childURI} doesn't exist in store!`);
    }

    composedChild = compose(childURI, childData);

    // the child component might have its own references
    _.assign(referenceObject, _.omit(composedChild, refProp));
  });

  return data;
}

export function render(uri, data) {
  const tpl = getTemplate(uri),
    renderableData = _.assign({}, _.cloneDeep(data), { locals: getLocals() });

  if (!tpl) {
    throw new Error(`Component "${getComponentName(uri)}" has no client-side template!`);
  }

  if (!renderableData[refProp]) {
    // if it doesn't have a reference property, add it for rendering
    // note: data from the server will have it
    renderableData[refProp] = uri;
  }

  if (!renderableData[variationProp]) {
    // if it doesn't have a variation specified when we re-render,
    // default to the component name for rendering
    // note: data from the server will have it
    renderableData[variationProp] = getComponentName(uri);
  }

  // always compose data before rendering client-side
  return attempt(() => tpl(compose(uri, renderableData))).catch((e) => {
    log.error(`Unable to render template for ${getComponentName(uri)}`, { action: 'render' });
    return Promise.reject(e);
  }).then((html) => create(html));
}
