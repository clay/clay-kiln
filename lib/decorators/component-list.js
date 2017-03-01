import _ from 'lodash';
import dragula from 'dragula';
import { getComponentName, layoutAttr, editAttr, componentListProp, componentListClass, pageAreaClass, dropAreaClass, dragItemClass, dragItemUnsavedClass, refAttr, refProp } from '../utils/references';
import { getData, getSchema } from '../core-data/components';
import { getComponentEl } from '../utils/component-elements';
import store from '../core-data/store';

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
    // data is in a list
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
    ignoreInputTextSelection: true, // allow selecting text in draggable components
    moves(selectedItem, container, handle) {
      // only allow direct child components of a list to be dragged
      // this allows for nested component lists + dragdrop
      return selectedItem.hasAttribute(refAttr) && getComponentName(selectedItem.getAttribute(refAttr)) !== 'clay-kiln' && isDraggable(handle, container);
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
    selectedItem.classList.add(dragItemUnsavedClass);
    selectedItem.classList.remove(dragItemClass);
    container.classList.remove(dropAreaClass);
    updateOrder(el).then(() => {
      selectedItem.classList.remove(dragItemUnsavedClass);
    });
  });
}

/**
 * decorate component list
 * @param {Element} el
 * @param {object} componentList
 */
function addComponentList(el, componentList) {
  const isPage = componentList.page;

  // add a class so we can easily reference it later
  el.classList.add(componentListClass);
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
    schema = getSchema(uri, path); // note: component lists are ALWAYS a single field, so we don't need co call groups.get

  if (schema && schema[componentListProp]) {
    addComponentList(el, schema[componentListProp]);
  }
}
