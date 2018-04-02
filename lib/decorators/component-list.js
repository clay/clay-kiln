import _ from 'lodash';
import dragula from 'dragula';
import { isPage } from 'clayutils';
import { getComponentName, layoutAttr, editAttr, componentListProp, pageAreaClass, dropAreaClass, dragItemClass, dragItemUnsavedClass, refAttr, refProp } from '../utils/references';
import { getData, getSchema } from '../core-data/components';
import { getComponentEl } from '../utils/component-elements';
import store from '../core-data/store';
import logger from '../utils/log';

const log = logger(__filename);

/**
 * Save the order of the items as found in the DOM.
 * @param {Element} el
 * @param {{ref: string, path: string}} options
 * @returns {Promise}
 */
function updateOrder(el) {
  const componentEl = getComponentEl(el),
    uri = componentEl.getAttribute(layoutAttr) || componentEl.getAttribute(refAttr),
    path = el.getAttribute(editAttr),
    list = getData(uri, path),
    childEls = el.querySelectorAll(':scope > [' + refAttr + ']'); // only get direct children of the list;

  let newList = [];

  if (_.isArray(list)) {
    // data is in the current component. save it!
    newList = _.map(childEls, (childEl) => {
      return {
        [refProp]: childEl.getAttribute(refAttr)
      };
    });

    if (_.get(store, 'state.ui.currentFocus')) {
      // save an open child component's form before saving the parent component
      return store.dispatch('unfocus').then(() => store.dispatch('saveComponent', { uri, data: { [path]: newList }}));
    } else {
      return store.dispatch('saveComponent', { uri, data: { [path]: newList }});
    }
  } else {
    // data is in a page area
    newList = _.map(childEls, (childEl) => childEl.getAttribute(refAttr));

    if (_.get(store, 'state.ui.currentFocus')) {
      // save an open child component's form before saving the page
      return store.dispatch('unfocus').then(() => store.dispatch('savePage', { [path]: newList }));
    } else {
      return store.dispatch('savePage', { [path]: newList });
    }
  }
}

/**
 * get the number of components between the handle and container
 * @param {Element} handle
 * @param {Element} container
 * @returns {number}
 */
function getComponentDepth(handle, container) {
  let cursor = handle,
    depth = 0;

  // note: Element#matches doesn't work on all browsers, limiting our support
  while (cursor && !cursor.matches('html') && cursor !== container) {
    cursor = cursor.parentNode; // iterate up through the elements
    if (cursor.getAttribute(refAttr)) {
      depth++; // every time you hit a component, add to the depth
    }
  }

  return depth; // return the number of you passed through
}

/**
 * determine if a component is draggable inside a specific container
 * @param {Element} handle
 * @param {Element} container
 * @returns {boolean}
 */
function isDraggable(handle, container) {
  // components are draggable if the handle is the component element and it's a direct child of the container (depth 0)
  // OR if the handle is some OTHER element inside the direct child component (depth 1)
  return !!handle.hasAttribute(refAttr) && getComponentDepth(handle, container) === 0
    || !handle.hasAttribute(refAttr) && getComponentDepth(handle, container) === 1;
}

function addDragula(el) {
  const drag = dragula([el], {
    deadzone: 50,
    ignoreInputTextSelection: false, // we're handling this in the `invalid` function below
    moves(selectedItem, container, handle) {
      // only allow direct child components of a list to be dragged
      // this allows for nested component lists + dragdrop
      return selectedItem.hasAttribute(refAttr) && getComponentName(selectedItem.getAttribute(refAttr)) !== 'clay-kiln' && isDraggable(handle, container);
    },
    invalid(selectedItem) {
      const isInsideField = selectedItem.classList.contains('kiln-field');

      if (isInsideField) {
        // set isInvalidDrag if user is selecting text inside form fields.
        // it's unset when they either click another thing in the form
        // OR if the document click event fires (when they mouseup outside of the form)
        window.kiln.isInvalidDrag = true;
      }

      return isInsideField;
    }
  });

  // add event listeners to reorder components
  // auto-scroll when you drag to the edge of the window
  drag.on('cloned', function (mirror) {
    const buffer = 40;

    let dragging = window.setInterval(() => {
      const rect = mirror.getBoundingClientRect();

      if (!drag.dragging) {
        window.clearInterval(dragging);
      } else if (rect.top < buffer) {
        window.scrollBy(0, -buffer * 2);
      } else if (window.innerHeight - rect.bottom < buffer) {
        window.scrollBy(0, buffer * 2);
      }
    }, 250);
  });
  // add classes when you start dragging
  drag.on('drag', function (selectedItem, container) {
    selectedItem.classList.add(dragItemClass);
    container.classList.add(dropAreaClass);
  });
  // remove classes when you cancel dragging
  drag.on('cancel', function (selectedItem, container) {
    selectedItem.classList.remove(dragItemClass);
    container.classList.remove(dropAreaClass);
  });
  // handle reordering
  drag.on('drop', function (selectedItem, container) {
    // selectedItem.classList.add(dragItemUnsavedClass);
    selectedItem.classList.remove(dragItemClass);
    container.classList.remove(dropAreaClass);
    updateOrder(el).then(() => {
      selectedItem.classList.remove(dragItemUnsavedClass);
    });
  });
}

/**
 * make sure that all child elements of component lists are actually components
 * @param  {string} uri
 * @param  {string} path
 * @param  {Element} el
 * @returns {boolean}
 */
function containsChildComponents(uri, path, el) {
  let result = true;

  _.each(el.children, (child) => {
    if (child && !child.getAttribute(refAttr) && !child.classList.contains('kiln-placeholder') && !child.classList.contains('mini-selector')) {
      log.error(`Template for ${getComponentName(uri)} → ${path} contains non-component elements! All direct children of a component list must be components.`, { action: 'containsChildComponents', nonChildEl: child });
      result = false;
    }
  });

  return result;
}

/**
 * decorate component list
 * @param {Element} el
 * @param {object} componentList
 */
function addComponentList(el, componentList) {
  const isPage = componentList.page;

  // add a class so we can style placeholders
  if (isPage) {
    el.classList.add(pageAreaClass);
  }

  // enable dragula
  addDragula(el);
}

/**
 * decorate component list if specified in the schema
 * @param  {string} uri
 * @param  {Element} el with data-editable
 */
export default function handler(uri, el) {
  const path = el.getAttribute(editAttr),
    schemaURI = isPage(uri) ? _.get(store, 'state.page.data.layout') : uri,
    schema = getSchema(schemaURI, path); // note: component lists are ALWAYS a single field, so we don't need co call groups.get

  if (schema && schema[componentListProp] && containsChildComponents(schemaURI, path, el)) {
    addComponentList(el, schema[componentListProp]);
  }
}
