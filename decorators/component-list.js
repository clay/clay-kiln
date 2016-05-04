var _ = require('lodash'),
  references = require('../services/references'),
  dom = require('@nymag/dom'),
  edit = require('../services/edit'),
  dragula = require('dragula'),
  addComponent = require('../services/add-component'),
  paneService = require('../services/pane');

/**
 * map through components, filtering out excluded
 * @param {array} possibleComponents
 * @param {array} [exclude] array of components to exclude
 * @returns {array} array of elements
 */
function getAddableComponents(possibleComponents, exclude) {
  return _.compact(_.map(possibleComponents, function (item) {
    if (exclude && exclude.length) {
      if (!_.contains(exclude)) {
        return item;
      }
    } else {
      return item;
    }
  }));
}

/**
 * create pane and buttons
 * @param {object} args
 * @returns {Element}
 */
function createPane(args) {
  var include = args.include,
    exclude = args.exclude,
    toolbar = dom.find('.kiln-toolbar'),
    allComponents = toolbar.getAttribute('data-components').split(','),
    tpl =
      `<section class="component-list-bottom">
        <button class="open-add-components">
          <span class="open-add-components-inner">+</span>
        </button>
      </section>`,
    pane = dom.create(tpl),
    addableComponents;

  // figure out what components should be available for adding
  if (include && include.length) {
    addableComponents = getAddableComponents(include, exclude);
  } else {
    addableComponents = getAddableComponents(allComponents, exclude);
  }

  // add those components to the button
  dom.find(pane, '.open-add-components').setAttribute('data-components', addableComponents.join(','));

  return pane;
}

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
  var args = _.get(options, 'data._schema.' + references.componentListProperty),
    pane, button, dropArea;

  // if _componentList: true, make the args an object
  args = _.isObject(args) ? args : {};

  args.field = _.omit(options, 'data'); // add button needs ref and path.

  // create the pane
  pane = createPane(args);
  button = dom.find(pane, '.open-add-components');

  // add click events to toggle pane
  button.addEventListener('click', function () {
    var addableComponents = button.getAttribute('data-components').split(',');

    if (addableComponents.length === 1) {
      addComponent(pane, args.field, addableComponents[0]);
    } else {
      // open the add components pane
      paneService.openAddComponent(addableComponents, { pane: pane, field: args.field });
    }
  });

  // wrap the draggable items so that the pane is not in the drop area.
  dropArea = dom.wrapElements(el.childNodes, 'div');
  addDragula(dropArea, options);
  el.appendChild(dropArea);

  // add the pane below the component list drop area.
  el.appendChild(pane);

  return el;
}

/**
 * close if it's open
 * @param  {Element} el
 */
function closeIfOpen(el) {
  if (el.classList.contains('open')) {
    el.classList.remove('open');
  }
}

/**
 * close any open component panes
 */
function closePanes() {
  var buttons = dom.findAll('.open-add-components'),
    panes = dom.findAll('.add-components-pane');

  _.forEach(buttons, closeIfOpen);
  _.forEach(panes, closeIfOpen);
}

module.exports.when = when;
module.exports.handler = handler;

// close panes when someone unfocuses / focuses a field
module.exports.closePanes = closePanes;

// for testing
module.exports.updateOrder = updateOrder;
