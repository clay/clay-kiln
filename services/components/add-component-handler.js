var references = require('../references'),
  dom = require('@nymag/dom'),
  _ = require('lodash'),
  allComponents = require('./all-components'),
  openAddComponent = require('../pane/add-component'),
  addComponent = require('./add-component'),
  getAvailableComponents = require('./available-components');

/**
 * get parent list/prop element
 * note: it might be the parent element itself (e.g. in source-links)
 * @param {Element} el component element
 * @param {string} path
 * @returns {Element}
 */
function getParentEditableElement(el, path) {
  if (el.getAttribute(references.editableAttribute) === path) {
    return el;
  } else {
    return dom.find(el, `[${references.editableAttribute}="${path}"]`);
  }
}

/**
 * add click handler for adding components
 * @param {Element} button to attach handler to
 * @param {object} options (info about the component we want to add components to)
 * @param {string} options.ref
 * @param {string} options.path
 * @param {object} options.list (schema w/ include/exclude/etc)
 * @param {Element} options.listEl (list element to add components to)
 * @param {string} [prevRef] optional component ref to add components after
 * @returns {Element}
 */
function addHandler(button, options, prevRef) {
  var include = _.get(options, 'list.include') || _.get(options, 'prop.include'),
    exclude = _.get(options, 'list.exclude') || _.get(options, 'prop.exclude'),
    pane = options.listEl || options.propEl,
    isFuzzy = _.get(options, 'list.fuzzy') || _.get(options, 'prop.fuzzy'),
    available;

  // figure out what components should be available for adding
  if (include && include.length) {
    available = getAvailableComponents(include, exclude);
  } else {
    available = getAvailableComponents(allComponents(), exclude);
  }

  // add those components to the button
  button.setAttribute('data-components', available.join(','));

  // add click event handler
  button.addEventListener('click', function addComponentClickHandler() {
    var currentAvailable = button.getAttribute('data-components').split(','),
      field = {
        ref: options.ref,
        path: options.path
      };

    if (currentAvailable.length === 1) {
      addComponent(pane, field, currentAvailable[0], prevRef);
    } else {
      // open the add components pane
      openAddComponent(currentAvailable, { pane: pane, field: field, ref: prevRef, isFuzzy: isFuzzy });
    }
  });

  return button;
}

module.exports = addHandler;
module.exports.getParentEditableElement = getParentEditableElement;
_.set(window, 'kiln.services.addComponentsHandler', module.exports); // export for plugins
