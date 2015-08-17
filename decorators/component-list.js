var _ = require('lodash'),
  references = require('../services/references'),
  dom = require('../services/dom'),
  edit = require('../services/edit'),
  render = require('../services/render'),
  dragula = require('dragula');

/**
 * Create click handler for adding a component
 * @param {Element} pane
 * @param {{ref: string, path: string}} field
 * @param {string} name
 * @returns {Promise}
 */
function addComponent(pane, field, name) {
  return function (e) {
    e.stopPropagation();
    return edit.createComponent(name)
      .then(function (res) {
        var newRef = res._ref;

        return edit.addToParentList({ref: newRef, parentField: field.path, parentRef: field.ref})
          .then(function (newEl) {
            dom.insertBefore(pane, newEl);
            return render.addComponentsHandlers(newEl);
          });
      });
  };
}

/**
 * create a new button for each component
 * @param {Element} pane
 * @param {{ref: string, path: string}} field
 * @param {string} item name
 * @returns {element} buttonEl
 */
function createComponentButton(pane, field, item) {
  var buttonEl = dom.create(`<button class="add-component" data-component-name="${item}">${item}</button>`);

  buttonEl.addEventListener('click', addComponent(pane, field, item));
  return buttonEl;
}

/**
 * map through components, filtering out excluded
 * @param {Element} pane
 * @param {{ref: string, path: string}} field
 * @param {array} possibleComponents
 * @param {array} [exclude] array of components to exclude
 * @returns {array} array of elements
 */
function getButtons(pane, field, possibleComponents, exclude) {
  return _.compact(_.map(possibleComponents, function (item) {
    if (exclude && exclude.length) {
      if (!_.contains(exclude)) {
        return createComponentButton(pane, field, item);
      }
    } else {
      return createComponentButton(pane, field, item);
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
    allComponents = ['paragraph'], // todo: get list of all components
    tpl =
      `<section class="component-list-bottom">
        <div class="open-add-components">
          <span class="open-add-components-inner">+</span>
        </div>
        <section class="add-components-pane">
        </section>
      </section>`,
    pane = dom.create(tpl),
    buttons;

  // figure out what components should be available for adding
  if (include && include.length) {
    buttons = getButtons(pane, args.field, include, exclude);
  } else {
    buttons = getButtons(pane, args.field, allComponents, exclude);
  }

  // put add components buttons into the pane
  _.each(buttons, function (button) {
    dom.find(pane, '.add-components-pane').appendChild(button);
  });

  return pane;
}

/**
 * Save the order of the items as found in the DOM.
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Promise}
 */
function updateOrder(el, options) {
  var newOrder = [],
    refAttr = references.referenceAttribute,
    refProp = references.referenceProperty,
    currentRefs = options.data.map(function (item) { return item[refProp]; });

  _.each(el.querySelectorAll('[' + refAttr + ']'), function (item) {
    var ref = item.getAttribute(refAttr),
      val = {};

    if (_.contains(currentRefs, ref)) {
      val[refProp] = ref;
      newOrder.push(val);
    }
  });
  // Save.
  return edit.getData(options.ref).then(function (componentData) {
    componentData[options.path] = newOrder;
    return edit.save(componentData);
  });
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
    drag = dragula({
      moves: function (selectedItem, container, handle) {
        return handle.classList.contains('drag');
      }
    });

  drag.containers.push(el);
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

  return schema.hasOwnProperty(references.componentListProperty);
}

/**
 * add "add component" button
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Element}
 */
function handler(el, options) {
  var args = _.get(options, 'data._schema.' + references.componentListProperty),
    pane, button;

  // if _componentList: true, make the args an object
  args = _.isObject(args) ? args : {};

  args.field = _.omit(options, 'data'); // add button needs ref and path.

  // create the pane
  pane = createPane(args);
  button = dom.find(pane, '.open-add-components');

  // add click events to toggle pane
  button.addEventListener('click', function () {
    var addComponentsPane = dom.find(pane, '.add-components-pane');

    button.classList.toggle('open');
    addComponentsPane.classList.toggle('open');
  });

  // add the pane to the end of the component list
  el.appendChild(pane);

  addDragula(el, options);

  return el;
}

module.exports.when = when;
module.exports.handler = handler;
