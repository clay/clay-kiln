var references = require('../references'),
  dom = require('@nymag/dom'),
  edit = require('../edit'),
  render = require('./render'),
  focus = require('../../decorators/focus'),
  select = require('./select'),
  progress = require('../progress'),
  db = require('../edit/db'),
  _ = require('lodash');

/**
 * find placeholders to remove from the parent
 * @param {{ref: string, path: string}} field
 * @returns {Element|null}
 */
function getRemovablePlaceholder(field) {
  var parent = dom.find(`[${references.referenceAttribute}="${field.ref}"]`),
    list, inner, possiblePlaceholder, hasPlaceholder;

  if (parent && parent.getAttribute(references.editableAttribute) === field.path) {
    list = parent;
  } else if (parent) {
    list = dom.find(parent, `[${references.editableAttribute}="${field.path}"]`);
  }

  // if we're in a list, find the placeholder
  inner = list && dom.find(list, '.component-list-inner');
  possiblePlaceholder = inner && inner.firstElementChild;
  // see if the first element is a placeholder
  hasPlaceholder = possiblePlaceholder && possiblePlaceholder.classList.contains('kiln-placeholder');
  // only remove regular placeholders, not permanent placeholders
  return hasPlaceholder && possiblePlaceholder || null;
}

/**
 * remove parent placeholder
 * @param {{ref: string, path: string}} field
 */
function removeParentPlaceholder(field) {
  // component > field > div > placeholder
  var placeholder = getRemovablePlaceholder(field);

  // remove component list placeholder if it exists
  if (placeholder) {
    dom.removeElement(placeholder);
  }
}

/**
 * add a new component to a parent's list
 * @param {object} args
 * @param {Element} pane
 * @param {string} [prevRef]
 * @returns {Promise}
 */
function addToList(args, pane, prevRef) {
  // if we're adding AFTER a component, add that to the arguments
  _.assign(args, { prevRef: prevRef });

  return edit.addToParentList(args)
    .then(function (newEl) {
      if (prevRef) {
        let prev = dom.find(pane, `[${references.referenceAttribute}="${prevRef}"]`);

        // insert it right after the previous component
        dom.insertAfter(prev, newEl);
      } else {
        // insert it at the end of the component list
        dom.find(pane, '.component-list-inner').appendChild(newEl);
      }
      return newEl;
    });
}

/**
 * add a new component to a parent's property
 * @param {object} args
 * @param {Element} pane
 * @returns {Promise}
 */
function addToProp(args, pane) {
  var parentData = {
      _ref: args.parentRef
    },
    newComponent = {
      _ref: args.ref
    };

  // add new component into property (or replace current component in that property)
  parentData[args.parentField] = newComponent;

  return Promise.all([edit.savePartial(parentData), db.getHTML(args.ref)])
    .then(function (promises) {
      var newEl = promises[1];

      dom.clearChildren(pane);
      pane.appendChild(newEl);
      return newEl;
    });
}

/**
 * Add a component to a specified list
 * @param {Element} pane (component list element)
 * @param {{ref: string, path: string}} field (parent data)
 * @param {string} name of the component
 * @param {string} [prevRef] uri of the component to insert new component after
 * @returns {Promise}
 */
function addComponent(pane, field, name, prevRef) {
  progress.start('save');
  removeParentPlaceholder(field);
  return Promise.all([edit.createComponent(name), edit.getData(field.ref)])
    .then(function (promises) {
      var res = promises[0],
        parentRes = promises[1],
        newRef = res._ref,
        args = {
          ref: newRef,
          parentField: field.path,
          parentRef: field.ref
        },
        newElPromise;

      if (_.has(parentRes, `${field.path}._schema.${references.componentListProperty}`)) {
        newElPromise = addToList(args, pane, prevRef);
      } else {
        newElPromise = addToProp(args, pane);
      }

      return newElPromise.then(function (newEl) {
        return render.addComponentsHandlers(newEl).then(function () {
          focus.unfocus();
          select.unselect();
          progress.done('save');
          return select.select(newEl);
        });
      });
    });
}

module.exports = addComponent;

// for testing
module.exports.getRemovablePlaceholder = getRemovablePlaceholder; // this function contains the logic that removeParentPlaceholder uses
