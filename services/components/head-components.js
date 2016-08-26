const label = require('../label'),
  _ = require('lodash'),
  filterableList = require('../filterable-list'),
  references = require('../references'),
  edit = require('../edit'),
  db = require('../edit/db'),
  forms = require('../forms'),
  dom = require('@nymag/dom'),
  progress = require('../progress'),
  getAvailableComponents = require('./available-components');

/**
 * determine if a node begins a component list. they look like:
 * <!-- data-editable="path" -->
 * @param {Node} node
 * @returns {boolean}
 */
function isComponentListStart(node) {
  return !!node && node.nodeType === node.COMMENT_NODE && !!node.data.match(/data-editable="(.*?)"/);
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
 * get component list start from a path
 * @param {string} path
 * @returns {Node}
 */
function getComponentListStart(path) {
  const walker = document.createTreeWalker(document.head, NodeFilter.SHOW_COMMENT);

  let node;

  while (node = walker.nextNode()) {
    if (isComponentListStart(node) && getComponentListPath(node) === path) {
      return node;
    }
  }
}

/**
 * determine if a node ends a component list. they look like:
 * <!-- data-editable-end -->
 * @param {Node} node
 * @returns {boolean}
 */
function isComponentListEnd(node) {
  return !!node && node.nodeType === node.COMMENT_NODE && !!node.data.match(/data-editable-end/);
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
  return !!node && node.nodeType === node.COMMENT_NODE && !!node.data.match(/data-uri="(.*?)"/) && node.data.match(/data-uri="(.*?)"/)[1];
}

/**
 * get component node from a ref
 * @param {string} ref
 * @returns {Node}
 */
function getComponentNode(ref) {
  const walker = document.createTreeWalker(document.head, NodeFilter.SHOW_COMMENT);

  let node;

  while (node = walker.nextNode()) {
    if (getComponentRef(node) === ref) {
      return node;
    }
  }
}

/**
 * get the last node in a component, given any node in the component
 * @param {Node} node
 * @returns {Node}
 */
function getComponentEnd(node) {
  if (node.nextSibling && (isComponentListEnd(node.nextSibling) || getComponentRef(node.nextSibling))) {
    return node;
  } else if (node.nextSibling) {
    return getComponentEnd(node.nextSibling);
  }
}

/**
 * given the first (data-uri) node of a component, remove it from the dom
 * @param {Node} node
 * @returns {Element} fragment containing clone of the removed nodes
 */
function removeComponentFromDOM(node) {
  var endNode = getComponentEnd(node),
    currentNode = node,
    clones = document.createDocumentFragment();

  while (currentNode !== endNode) {
    let clone = currentNode.cloneNode(true),
      nextNode = currentNode.nextSibling;

    dom.removeElement(currentNode);
    clones.appendChild(clone);
    currentNode = nextNode;
  }

  return clones;
}

/**
 * iterate through a fragment, adding nodes after a specified node
 * @param {Node} node
 * @param {Element} fragment
 */
function insertAfter(node, fragment) {
  var currentNode = node,
    parent = node.parentNode;

  _.each(fragment.childNodes, function (child) {
    parent.insertBefore(child.cloneNode(true), currentNode.nextSibling);
    currentNode = currentNode.nextSibling;
  });
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

    // note: need to require it here because otherwise it's a circular reference
    return require('../pane/add-component')(available, { pane: options.start, field: { ref: options.ref, path: options.path, invisible: true } });
  };
}

/**
 * Save the order of the items as found in the DOM.
 * @param {string} ref of the parent
 * @param {string} path of the list
 * @param {object} data
 * @returns {function}
 */
function updateOrder(ref, path, data) {
  return function (id, newIndex) {
    var node = getComponentNode(id),
      listStart = getComponentListStart(path),
      clone = removeComponentFromDOM(node),
      list = getList(listStart).map((item) => item.id); // list of components without the reordered one

    // first, remove the component from its old place in the dom
    // (keeping a clone of it)
    // then, add the clone into its new place
    if (newIndex === 0) {
      insertAfter(listStart, clone);
    } else {
      // find out the component at the new index - 1, then add this component after it
      let prevRef = list[newIndex - 1];

      // add the (cloned) component after the last node of the previous component
      insertAfter(getComponentEnd(getComponentNode(prevRef)), clone);
    }

    // add the reordered component back into the list
    list.splice(newIndex, 0, id);

    // save it into the page or layout
    if (_.isArray(data[path])) {
      // component list is in the layout. swap it and save
      data[path] = list.map(function (ref) {
        return { _ref: ref }; // array of objects with _ref
      });
      return edit.save(data);
    } else {
      let pageUri = dom.pageUri();

      // component list is in the page. swap it and save
      progress.start('page'); // set progress manually
      return edit.getDataOnly(pageUri).then(function (pageData) {
        pageData[path] = list; // array of refs
        return db.save(pageUri, _.omit(pageData, '_ref'))
          .then(function () {
            progress.done();
            window.kiln.trigger('save', data);
          })
          .catch(function (e) {
            console.error(e.message, e.stack);
            progress.done('error');
            progress.open('error', 'A server error occured. Please try again.', true);
          });
      });
    }
  };
}

/**
 * Remove component from a head component list
 * @param {string} ref of the parent
 * @param {string} path of the list
 * @returns {function}
 */
function removeComponentFromList(ref, path) {
  return function (id) {
    var node = getComponentNode(id);

    progress.start('layout');
    removeComponentFromDOM(node);
    return edit.removeFromParentList({
      el: node,
      ref: id,
      parentRef: ref,
      parentField: path
    }).then(function () {
      progress.done();
      return require('../pane/components')(path); // avoid circular reference
    });
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
        add: addComponentToList({ ref: layoutRef, path: list.path, list: _.get(data, `${list.path}._schema._componentList`), start: list.start }),
        addTitle: `Add component to ${label(list.path)} list`,
        inputPlaceholder: `Search ${label(list.path)} components`,
        remove: removeComponentFromList(layoutRef, list.path, data),
        reorder: updateOrder(layoutRef, list.path, data)
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
  var lists = getListsInHead();

  return edit.getLayout().then(function (layoutRef) {
    return edit.getData(layoutRef).then(function (data) {
      return _.map(lists, createTabFromList(layoutRef, data, path));
    });
  });
}

module.exports.getListTabs = getListTabs;
module.exports.getComponentListEnd = getComponentListEnd;

// for testing
module.exports.isComponentListStart = isComponentListStart;
module.exports.getComponentListPath = getComponentListPath;
module.exports.getComponentListStart = getComponentListStart;
module.exports.isComponentListEnd = isComponentListEnd;
// note: getComponentListEnd is above, since it's actually used by other modules
module.exports.getComponentRef = getComponentRef;
module.exports.getComponentNode = getComponentNode;
module.exports.getComponentEnd = getComponentEnd;
module.exports.removeComponentFromDOM = removeComponentFromDOM;
module.exports.insertAfter = insertAfter;
module.exports.getList = getList;
