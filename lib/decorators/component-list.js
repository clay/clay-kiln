import _ from 'lodash';
import sortable from 'sortablejs';
import { isPage } from 'clayutils';
import { getComponentName, layoutAttr, editAttr, componentListProp, pageAreaClass, collapsibleListClass, dropAreaClass, dragItemClass, dragItemUnsavedClass, refAttr, refProp, reorderItemAttr } from '../utils/references';
import { getData, getSchema } from '../core-data/components';
import { getComponentEl, isComponentInPage } from '../utils/component-elements';
import store from '../core-data/store';
import logger from '../utils/log';
import { getDragDelay } from './helpers';

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
      return store.dispatch('unfocus').then(() => store.dispatch('saveComponent', { uri, data: { [path]: newList } }));
    } else {

      return store.dispatch('saveComponent', { uri, data: { [path]: newList } });
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

function addSortableJS(el) {
  if ( el.classList.contains('kiln-internals')) {
    // no need to create Sortable for kiln-
    return false;
  }

  const sortElement = sortable.create(el, {
    delay: getDragDelay(),
    scroll: true,
    scrollSensitivity: 40,
    removeCloneOnHide: true,
    onStart(evt) {
      evt.item.classList.add(dragItemClass);
      evt.srcElement.classList.add(dropAreaClass);
    },
    onMove(evt) {
      const uri = evt.dragged.hasAttribute(refAttr) && evt.dragged.getAttribute(refAttr),
        isPageEditMode = _.get(store, 'state.editMode') === 'page',
        isInsideField = evt.dragged.classList.contains('kiln-field');

      let isPageComponent, isActive;

      if (!uri || getComponentName(uri) === 'clay-kiln') {
        return false;
      }

      // check for uri before checking to see if the component is in the page or layout
      isPageComponent = isComponentInPage(uri);
      isActive = isPageEditMode && isPageComponent || !isPageEditMode && !isPageComponent;

      if (isInsideField) {
        // set isInvalidDrag if user is selecting text inside form fields.
        // it's unset when they either click another thing in the form
        // OR if the document click event fires (when they mouseup outside of the form)
        window.kiln.isInvalidDrag = true;

        // returning false reverts to the original order
        return false;
      }

      // only allow direct child components of a list to be dragged
      // this allows for nested component lists + dragdrop
      // note: also only allow active (in the edit mode you're currently in) components to be dragged
      // don't drag parent if the target is a draggable complex-list item
      // if any of these are false, the drop will revert to the original order
      return isActive && isDraggable(evt.dragged, evt.from) && !evt.dragged.hasAttribute(reorderItemAttr);
    },
    onEnd(evt) {
      evt.item.classList.remove(dragItemClass);
      evt.from.classList.remove(dropAreaClass);
      if ( evt.from !== evt.to || evt.newIndex !== evt.oldIndex ) {
        updateOrder(el).then(() => {
          evt.item.classList.remove(dragItemUnsavedClass);
        });
      } else {
        // The keen-ui-ripple-ink component relies on mouseup to trigger the removal of its styles.
        // When you start to drag an element, but end up dropping it in the same spot you started from,
        // keen-ui isn't registering the mouseup event so we're manually triggering a mouseup that it will react to.
        const mouseUpEvent = document.createEvent('MouseEvents');

        mouseUpEvent.initEvent('mouseup', true, true);
        document.dispatchEvent(mouseUpEvent);
        evt.item.classList.remove(dragItemUnsavedClass);
      }
    }
  });

  store.subscribe((mutation) => {
    // When an element has focus, i.e. is being edited, the sortable is disabled so it doesn't interfere with the wysiwyg editor
    switch (mutation.type) {
      case 'FOCUS':
        sortElement.option('disabled', true);
        break;
      case 'UN_FOCUS':
        sortElement.option('disabled', false);
        break;
      default:
    }
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
    if (child &&
      !child.getAttribute(refAttr) &&
      !child.classList.contains('kiln-placeholder') &&
      !child.classList.contains('kiln-permanent-placeholder') &&
      !child.classList.contains('kiln-inactive-placeholder') &&
      !child.classList.contains('mini-selector') &&
      !child.classList.contains('mini-selector-inactive')) {
      log.error(`Template for ${getComponentName(uri)} → ${path} contains non-component elements!
        All direct children of a component list must be components.`, { action: 'containsChildComponents', nonChildEl: child });
      log.debug('Ensure each child component has a valid handlebars template and a single root element with a data-uri property');
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
  const isPage = componentList.page,
    isCollapsible = componentList.collapse;

  // add a class so we can style placeholders
  if (isPage) {
    el.classList.add(pageAreaClass);
  }

  // add a class so we can style + add functionality to collapsible placeholders
  if (isCollapsible) {
    el.classList.add(collapsibleListClass);
  }

  // enable sortableJS
  addSortableJS(el);
}

/**
 * decorate component list if specified in the schema
 * @param  {string} uri
 * @param  {Element} el with data-editable
 */
export default function handler(uri, el) {
  const path = el.getAttribute(editAttr),
    schemaURI = isPage(uri) ? _.get(store, 'state.layout.uri') : uri,
    schema = getSchema(schemaURI, path); // note: component lists are ALWAYS a single field, so we don't need co call groups.get

  if (schema && schema[componentListProp] && containsChildComponents(schemaURI, path, el)) {
    addComponentList(el, schema[componentListProp]);
  }
}
