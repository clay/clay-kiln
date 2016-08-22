const label = require('../label'),
  _ = require('lodash'),
  filterableList = require('../filterable-list'),
  references = require('../references'),
  edit = require('../edit'),
  forms = require('../forms'),
  dom = require('@nymag/dom'),
  getAvailableComponents = require('./available-components');
  // todo: when we split up the panes, call the add component pane directly
  // since this is currently a circular reference
  // pane = require('../pane');

/**
 * determine if a node begins a component list. they look like:
 * <!-- data-editable="path" -->
 * @param {Node} node
 * @returns {boolean}
 */
function isComponentListStart(node) {
  return node && node.nodeType === node.COMMENT_NODE && node.data.match(/data-editable="(.*?)"/);
}

/**
 * get path from a component list start comment
 * note: assumes we've already checked this node with isComponentListStart()
 * @param {Node} node
 * @returns {string}
 */
function getComponentListPath(node) {
  return node.data.match(/data-editable="(.*?)"/)[1];
}

/**
 * determine if a node ends a component list. they look like:
 * <!-- data-editable-end -->
 * @param {Node} node
 * @returns {boolean}
 */
function isComponentListEnd(node) {
  return node && node.nodeType === node.COMMENT_NODE && node.data.match(/data-editable-end/);
}

/**
 * recursively try to find the end of a component list
 * @param {Node} node
 * @returns {Node|undefined}
 */
function getComponentListEnd(node) {
  if (isComponentListEnd(node)) {
    return node;
  } else if (node.nextSibling) {
    return getComponentListEnd(node.nextSibling);
  }
}

/**
 * get component ref for a head component
 * @param {Node} node
 * @returns {string}
 */
function getComponentRef(node) {
  return node && node.nodeType === node.COMMENT_NODE && node.data.match(/data-uri="(.*?)"/) && node.data.match(/data-uri="(.*?)"/)[1];
}

/**
 * given a list start node, create an array of the components in this list
 * @param {Node} node
 * @returns {array} list of component refs
 */
function getList(node) {
  var currentNode = node,
    list = [];

  while (!isComponentListEnd(currentNode)) {
    let componentRef = getComponentRef(currentNode);

    if (componentRef) {
      list.push({
        id: componentRef,
        title: label(references.getComponentNameFromReference(componentRef))
      });
    }
    currentNode = currentNode.nextSibling;
  }

  return list;
}

/**
 * determine if a node begins a component list, and add it if so
 * @param {Node} node
 * @param {TreeWalker} walker
 * @param {array} lists
 */
function addList(node, walker, lists) {
  if (isComponentListStart(node)) {
    lists.push({
      path: getComponentListPath(node),
      components: getList(node),
      start: node,
      end: getComponentListEnd(node)
    });
  }
}

/**
 * get component lists in the head of the document
 * note: in the future, we might allow for invisible lists anywhere
 * in the document. those will need to account for element vs. comment structure
 * @return {array}
 */
function getListsInHead() {
  const walker = document.createTreeWalker(document.head, NodeFilter.SHOW_COMMENT);

  let lists = [],
    node;

  while (node = walker.nextNode()) {
    addList(node, walker, lists);
  }

  return lists;
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
    var toolbar = dom.find('.kiln-toolbar'),
      allComponents = toolbar && toolbar.getAttribute('data-components') && toolbar.getAttribute('data-components').split(',').sort() || [],
      include = _.get(options, 'list.include'),
      exclude = _.get(options, 'list.exclude'),
      available;

    // figure out what components should be available for adding
    if (include && include.length) {
      available = getAvailableComponents(include, exclude);
    } else {
      available = getAvailableComponents(allComponents, exclude);
    }

    console.log('open add components pane with', available)

    // return pane.openAddComponent(available, { pane: options.start, field: { ref: options.ref, path: options.path} });
  };
}

/**
 * create a pane tab with a filterable list from a list of components
 * @param {string} layoutRef
 * @param {object} data from layout
 * @returns {function}
 */
function createTabFromList(layoutRef, data) {
  return function (list) {
    var header = label(list.path), // todo: use a _label for this list, if it exists
      content = filterableList.create(list.components, {
        click: forms.open, // open settings form, passing in component id (ref)
        settings: forms.open,
        add: addComponentToList({ ref: layoutRef, path: list.path, list: _.get(data, `${list.path}._schema._componentList`), start: list.start }),
        addTitle: `Add component to ${label(list.path)} list`,
        inputPlaceholder: `Search ${label(list.path)} components`,
        remove: _.noop,
        reorder: _.noop
      });

    return {
      header: header,
      content: content
    };
  };
}

/**
 * generate tabs of invisible components, using filterable list
 * @returns {Promise} array
 */
function getListTabs() {
  var lists = getListsInHead();

  return edit.getLayout().then(function (layoutRef) {
    return edit.getData(layoutRef).then(function (data) {
      return _.map(lists, createTabFromList(layoutRef, data));
    });
  });
}

module.exports.getListTabs = getListTabs;
