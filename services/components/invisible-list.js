const label = require('../label'),
  _ = require('lodash'),
  filterableList = require('../filterable-list'),
  references = require('../references'),
  edit = require('../edit'),
  forms = require('../forms'),
  dom = require('@nymag/dom'),
  allComponents = require('./all-components'),
  getAvailableComponents = require('./available-components');


/**
 * get components in a layout's component list
 * @param {Element} listEl
 * @returns {array} of refs
 */
function getComponentsInList(listEl) {
  return _.map(dom.findAll(listEl, `.component-list-inner > [${references.referenceAttribute}]`), function (component) {
    var componentRef = component.getAttribute(references.referenceAttribute);

    return {
      id: componentRef,
      title: label(references.getComponentNameFromReference(componentRef))
    };
  });
}

/**
 * set up add component handler
 * note: this is similar to services/components/add-component-handler,
 * but is run all at once when clicking add in an invisible list
 * @param {object} options
 * @param {string} options.ref layout ref
 * @param {string} options.path component list field
 * @param {object} options.list component list schema
 * @returns {function}
 */
function addComponentToList(options) {
  return function () {
    var include = _.get(options, 'list.include'),
      exclude = _.get(options, 'list.exclude'),
      available;

    // figure out what components should be available for adding
    if (include && include.length) {
      available = getAvailableComponents(include, exclude);
    } else {
      available = getAvailableComponents(allComponents, exclude);
    }

    // note: need to require it here because otherwise it's a circular reference
    return require('../pane/add-component')(available, { pane: options.pane, field: { ref: options.ref, path: options.path, invisible: true } });
  };
}

/**
 * remove component from list
 * @param {string} ref of the layout
 * @param {string} path of the list
 * @returns {function}
 */
function removeComponentFromList(ref, path) {
  return function (id, itemEl) {
    var componentEl = dom.find(`[${references.referenceAttribute}="${id}"]`);

    dom.removeElement(itemEl); // remove item from list

    return edit.removeFromParentList({el: componentEl, ref: id, parentField: path, parentRef: ref});
  };
}

/**
 * save current order of elements in a component list
 * @param {string} path
 * @param {Element} el of the list
 * @param {object} data
 * @returns {Promise}
 */
function saveNewOrder(path, el, data) {
  var currentElements = dom.findAll(el, `.component-list-inner > [${references.referenceAttribute}]`),
    newData = _.map(currentElements, function (item) {
      var newItem = {};

      newItem[references.referenceProperty] = item.getAttribute(references.referenceAttribute);
      return newItem;
    });

  // note: when we deal with multi-user editing, add logic to add list items
  // that have been added by other people, rather than simply
  // persisting whatever's in the dom to the server :-)
  data[path] = newData;
  return edit.save(data);
}

/**
 * Save the order of the items as found in the DOM.
 * @param {string} path
 * @param {Element} el
 * @param {object} data
 * @returns {function}
 */
function updateOrder(path, el, data) {
  let innerEl = dom.find(el, '.component-list-inner'),
    children = dom.findAll(el, `.component-list-inner > [${references.referenceAttribute}]`);

  return function (id, newIndex) {
    let componentEl = dom.find(el, `[${references.referenceAttribute}="${id}"]`);

    if (newIndex === 0) {
      dom.prependChild(innerEl, componentEl);
    } else {
      // find out the component at the new index - 1, then add this component after it
      let prev = children[newIndex - 1];

      dom.insertAfter(prev, componentEl);
    }

    return saveNewOrder(path, el, data);
  };
}

/**
 * create a pane tab with a filterable list from a list of components
 * @param {string} layoutRef
 * @param {object} data from layout
 * @param {string} [path] if we want to open a specific list as the active tab
 * @returns {function}
 */
function createTabFromList(layoutRef, data, path) {
  return function (list) {
    var header = label(list.path), // todo: use a _label for this list, if it exists
      content = filterableList.create(list.components, {
        click: forms.open, // open settings form, passing in component id (ref)
        settings: forms.open,
        add: addComponentToList({ ref: layoutRef, path: list.path, list: _.get(data, `${list.path}._schema._componentList`), pane: list.el }),
        addTitle: `Add component to ${label(list.path)} list`,
        inputPlaceholder: `Search ${label(list.path)} components`,
        remove: removeComponentFromList(layoutRef, list.path),
        reorder: updateOrder(list.path, list.el, data)
      });

    if (list.path === path) {
      return {
        header: header,
        content: content,
        active: true
      };
    } else {
      return {
        header: header,
        content: content
      };
    }
  };
}

/**
 * generate tabs of invisible components, using filterable list
 * @param {string} [path] optional path for a component list to make active
 * @returns {Promise} array
 */
function getListTabs(path) {
  return edit.getLayout().then(function (layoutRef) {
    return edit.getData(layoutRef).then(function (data) {
      let lists = _(data).map(function (value, prop) {
        let listEl = dom.find(`[data-editable="${prop}"]`);
        // note: finds the first editable thing with this path
        // this could potentially break if you do weird things with your layouts
        // todo: use a treewalker to enforce that this only looks in the layout,
        // not inside any other components

        if (_.has(value, '_schema._componentList.invisible') && listEl) {
          return {
            path: prop,
            components: getComponentsInList(listEl),
            el: listEl
          };
        }
      }).compact().value();

      return _.map(lists, createTabFromList(layoutRef, data, path));
    });
  });
}

module.exports.getListTabs = getListTabs;

// for testing
module.exports.getComponentsInList = getComponentsInList;
module.exports.removeComponentFromList = removeComponentFromList;
module.exports.saveNewOrder = saveNewOrder;
module.exports.updateOrder = updateOrder;
