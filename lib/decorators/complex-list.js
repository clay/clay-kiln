import _ from 'lodash';
import sortable from 'sortablejs';
import {
  getComponentName, reorderAttr, reorderItemAttr, dropAreaClass, dragItemClass, dragItemUnsavedClass, refAttr
} from '../utils/references';
import { getData, getSchema } from '../core-data/components';
import { getComponentEl } from '../utils/component-elements';
import store from '../core-data/store';
import logger from '../utils/log';
import { getDragDelay, disableSortableWhenFocused } from './helpers';

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
      return list.find(item => item[listItemProp] === childEl.getAttribute(reorderItemAttr));
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

function addSortable(el) {
  const trash = document.createElement('div'),
    trashIcon = document.createElement('span'),
    sortElement = sortable.create(el, {
      group: 'complexList',
      delay: getDragDelay(),
      scroll: true,
      scrollSensitivity: 40,
      onStart(evt) {
        evt.item.classList.add(dragItemClass);
        evt.srcElement.classList.add(dropAreaClass);
        trash.classList.add(dropAreaClass);
      },
      onMove(evt) {
        const isInsideField = evt.dragged.classList.contains('kiln-field');

        if (isInsideField) {
          // set isInvalidDrag if user is selecting text inside form fields.
          // it's unset when they either click another thing in the form
          // OR if the document click event fires (when they mouseup outside of the form)
          window.kiln.isInvalidDrag = true;

          // returning false reverts to the original order
          return false;
        }

        return isDraggable(evt.dragged, evt.from);
      },
      onEnd(evt) {
        evt.item.classList.remove(dragItemClass);
        evt.from.classList.remove(dropAreaClass);
        trash.classList.remove(dropAreaClass);

        updateOrder(el).then(() => {
          evt.item.classList.remove(dragItemUnsavedClass);
        });
      }
    });

  trash.classList.add('complex-list-trash');
  trashIcon.classList.add('material-icons', 'delete');
  trashIcon.innerHTML = 'delete';
  trash.appendChild(trashIcon);
  el.parentElement.appendChild(trash);

  // To move items between SortableJS lists, they need to share the same group name
  sortable.create(trash, {
    group: 'complexList'
  });

  disableSortableWhenFocused(sortElement);
}

function validChildElements(el, uri, path) {
  const children = Array.from(el.children);

  if (!_.every(children, child => child.getAttribute(reorderItemAttr))) {
    log.error(`Template for ${getComponentName(uri)} → ${path} contains non-rearrangeable elements! All direct children of an inline-rearrangeable complex-list must have the 'data-reorderable-item' attribute.`, { action: 'containsChildComponents' });

    return false;
  }

  if (_.uniqBy(children, child => child.getAttribute(reorderItemAttr)).length < children.length) {
    log.error(`Template for ${getComponentName(uri)} → ${path} contains duplicate elements! All direct children of an inline-rearrangeable complex-list must have a unique 'data-reorderable-item' attribute value.`, { action: 'containsChildComponents' });

    return false;
  }

  return true;
}

export default function handler(uri, el) {
  const path = el.getAttribute(reorderAttr),
    schema = getSchema(uri, path);

  if (validChildElements(el, uri, path) && _.get(schema, '_has.input') === 'complex-list') {
    addSortable(el);
  }
}
