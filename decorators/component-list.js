var _ = require('lodash'),
  references = require('../services/references'),
  dom = require('@nymag/dom'),
  edit = require('../services/edit'),
  dragula = require('dragula');

/**
 * Save the order of the items as found in the DOM.
 * @param {Element} el
 * @param {{ref: string, path: string}} options
 * @returns {Promise}
 */
function updateOrder(el, options) {
  var refAttr = references.referenceAttribute,
    refProp = references.referenceProperty;

  // refresh the data from the server first, in case any non-list properties have changed
  return edit.getData(options.ref).then(function (data) {
    var currentElements = el.querySelectorAll(':scope > [' + refAttr + ']'), // only get direct children of the list
      newData = _.map(currentElements, function (item) {
        var newItem = {};

        newItem[refProp] = item.getAttribute(refAttr);
        return newItem;
      });

    // note: when we deal with multi-user editing, add logic to add list items
    // that have been added by other people, rather than simply
    // persisting whatever's in the dom to the server :-)
    data[options.path] = newData;
    return edit.save(data);
  });
}

/**
 * get the number of components between the handle and container
 * @param {Element} handle
 * @param {Element} container
 * @returns {number}
 */
function getComponentDepth(handle, container) {
  var cursor = handle,
    depth = 0;

  while (cursor && !cursor.matches('html') && cursor !== container) {
    cursor = cursor.parentNode; // iterate up through the elements
    if (cursor.getAttribute(references.referenceAttribute)) {
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
  return !!handle.getAttribute(references.referenceAttribute) && getComponentDepth(handle, container) === 0
    || !handle.getAttribute(references.referenceAttribute) && getComponentDepth(handle, container) === 1;
}

/**
 * Add dragula.
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 */
function addDragula(el, options) {
  var dropAreaClass = 'dragula-drop-area',
    dragItemClass = 'dragula-item',
    dragItemUnsavedClass = 'dragula-not-saved',
    drag = dragula([el], {
      ignoreInputTextSelection: true, // allow selecting text in draggable components
      moves: function (selectedItem, container, handle) {
        // only allow direct child components of a list to be dragged
        // this allows for nested component lists + dragdrop
        return selectedItem.classList.contains('drag') && isDraggable(handle, container);
      }
    });

  // drag.containers.push(el);
  drag.on('cloned', function (mirror) {
    // Auto-scroll when you drag to the edge of the window.
    var buffer = 40,
      dragging;

    dragging = window.setInterval(function () {
      var rect = mirror.getBoundingClientRect();

      if (!drag.dragging) {
        window.clearInterval(dragging);
      } else if (rect.top < buffer) {
        window.scrollBy(0, -buffer * 2);
      } else if (window.innerHeight - rect.bottom < buffer) {
        window.scrollBy(0, buffer * 2);
      }
    }, 250);
  });
  drag.on('drag', function (selectedItem, container) {
    selectedItem.classList.add(dragItemClass);
    container.classList.add(dropAreaClass);
  });
  drag.on('cancel', function (selectedItem, container) {
    selectedItem.classList.remove(dragItemClass);
    container.classList.remove(dropAreaClass);
  });
  drag.on('drop', function (selectedItem, container) {
    selectedItem.classList.add(dragItemUnsavedClass);
    selectedItem.classList.remove(dragItemClass);
    container.classList.remove(dropAreaClass);
    updateOrder(el, options).then(function () {
      // Order saved.
      selectedItem.classList.remove(dragItemUnsavedClass);
    });
  });
}

/**
 * match when schema says it's a component list
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {boolean}
 */
function when(el, options) {
  var schema = _.get(options, 'data._schema');

  return !!schema && schema.hasOwnProperty(references.componentListProperty);
}

/**
 * add "add component" button
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Element}
 */
function handler(el, options) {
  var dropArea = dropArea = dom.wrapElements(el.childNodes, 'div');

  // wrap the draggable items so that the pane is not in the drop area.
  addDragula(dropArea, options);
  el.appendChild(dropArea);

  return el;
}

/**
 * close if it's open
 * @param  {Element} el
 */
function closeIfOpen(el) {
  // todo: remove
}

/**
 * close any open component panes
 */
function closePanes() {
  // todo: remove
}

module.exports.when = when;
module.exports.handler = handler;

// close panes when someone unfocuses / focuses a field
module.exports.closePanes = closePanes;

// for testing
module.exports.updateOrder = updateOrder;
