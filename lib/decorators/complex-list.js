import _ from 'lodash';
import dragula from 'dragula';
import { isPage } from 'clayutils';
import { getComponentName, layoutAttr, editAttr, reorderAttr, reorderItemAttr, componentListProp, pageAreaClass, collapsibleListClass, dropAreaClass, dragItemClass, dragItemUnsavedClass, refAttr, refProp } from '../utils/references';
import { getData, getSchema } from '../core-data/components';
import { getComponentEl, isComponentInPage } from '../utils/component-elements';
import store from '../core-data/store';
import logger from '../utils/log';

const log = logger(__filename);

function updateOrder(el) {
  const componentEl = getComponentEl(el),
    uri = componentEl.getAttribute(refAttr),
    path = el.getAttribute(reorderAttr),
    list = getData(uri, path),
    childEls = el.querySelectorAll(':scope > [' + reorderItemAttr + ']'), // only get direct children of the list;
    listItemProp = el.getAttribute('data-reorderable-prop');

  let newList = [];

  if (_.isArray(list)) {
    newList = _.map(childEls, (childEl) => {
      return list.find((item) => item[listItemProp] === childEl.getAttribute(reorderItemAttr));
    });

    if (_.get(store, 'state.ui.currentFocus')) {
      // save an open child component's form before saving the parent component
      return store.dispatch('unfocus').then(() => store.dispatch('saveComponent', { uri, data: { [path]: newList } }));
    } else {
      return store.dispatch('saveComponent', { uri, data: { [path]: newList } });
    }
  }
}

/**
 * get the number of components between the handle and container
 * @param {Element} handle
 * @param {Element} container
 * @returns {number}
 */
function getItemDepth(handle, container) {
  let cursor = handle,
    depth = 0;

  // note: Element#matches doesn't work on all browsers, limiting our support
  while (cursor && !cursor.matches('html') && cursor !== container) {
    cursor = cursor.parentNode; // iterate up through the elements
    if (cursor.getAttribute(reorderItemAttr)) {
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
  return !!handle.hasAttribute(reorderItemAttr) && getItemDepth(handle, container) === 0
    || !handle.hasAttribute(reorderItemAttr) && getItemDepth(handle, container) === 1;
}

function addDragula(el) {
  const trash = document.createElement('div'),
    trashIcon = document.createElement('span'),
    drag = dragula([el, trash], {
    deadzone: 50,
    ignoreInputTextSelection: false,
    moves(selectedItem, container, handle) {
      const itemKey = selectedItem.hasAttribute(reorderItemAttr) && selectedItem.getAttribute(reorderItemAttr);

      return isDraggable(handle, container);
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

  trash.classList.add('complex-list-trash');
  trashIcon.classList.add('material-icons', 'delete');
  trashIcon.innerHTML = 'delete';
  trash.appendChild(trashIcon);
  el.parentElement.appendChild(trash);

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
    trash.classList.add(dropAreaClass);
  });

  // remove classes when you cancel dragging
  drag.on('cancel', function (selectedItem, container) {
    selectedItem.classList.remove(dragItemClass);
    container.classList.remove(dropAreaClass);
    trash.classList.remove('visible');
  });

  // handle reordering
  drag.on('drop', function (selectedItem, container) {
    // selectedItem.classList.add(dragItemUnsavedClass);
    selectedItem.classList.remove(dragItemClass);
    container.classList.remove(dropAreaClass);
    trash.classList.remove('visible');
    updateOrder(el).then(() => {
      selectedItem.classList.remove(dragItemUnsavedClass);
    });
  });
}

function validChildElements(el, uri, path) {
  const children = Array.from(el.children);

  if (!_.every(children, (child) => child.getAttribute(reorderItemAttr))) {
    log.error(`All direct children of reorderable complex lists must have a unique 'data-reorderable-item' attribute`);
    return false;
  }

  if (_.uniqBy(children, (child) => child.getAttribute(reorderItemAttr)).length < children.length) {
    log.error(`All direct children of reorderable complex lists must have a unique 'data-reorderable-item' attribute`);
    return false;
  }

  return true;
}

export default function handler(uri, el) {
  const path = el.getAttribute(reorderAttr),
    schema = getSchema(uri, path);

  if (validChildElements(el, uri, path)) {
    addDragula(el);
  }
}
