var references = require('../services/references'),
  dom = require('@nymag/dom'),
  edit = require('./edit'),
  render = require('./render'),
  focus = require('../decorators/focus'),
  select = require('./select'),
  progress = require('./progress');

/**
 * find placeholders to remove from the parent
 * @param {{ref: string, path: string}} field
 * @returns {Element|null}
 */
function getRemovablePlaceholder(field) {
  // component > field > div > placeholder
  var parent = document.querySelector('[' + references.referenceAttribute + '="' + field.ref + '"]'),
    list = parent && parent.querySelector('[' + references.editableAttribute + '="' + field.path + '"]'),
    div = list && dom.getFirstChildElement(list),
    placeholder = div && dom.getFirstChildElement(div);

  // only remove regular placeholders, not permanent placeholders
  if (placeholder && placeholder.classList.contains('kiln-placeholder')) {
    return placeholder;
  } else {
    return null;
  }
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
  return edit.createComponent(name)
    .then(function (res) {
      var newRef = res._ref,
        listArgs = {
          ref: newRef,
          parentField: field.path,
          parentRef: field.ref
        };

      // if we're adding AFTER a component, add that to the arguments
      _.assign(listArgs, { prevRef: prevRef });

      return edit.addToParentList(listArgs)
        .then(function (newEl) {
          if (prevRef) {
            let prev = dom.find(pane, `[${references.referenceAttribute}="${prevRef}"]`);

            // insert it right after the previous component
            dom.insertAfter(prev, newEl);
          } else {
            // insert it at the end of the component list
            pane.firstElementChild.appendChild(newEl);
          }
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
