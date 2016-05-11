var references = require('../services/references'),
  dom = require('@nymag/dom'),
  _ = require('lodash'),
  paneService = require('./pane'),
  addComponent = require('./add-component');

/**
 * get parent list element
 * note: it might be the parent element itself (e.g. in source-links)
 * @param {Element} el component element
 * @param {string} path
 * @returns {Element}
 */
function getParentListElement(el, path) {
  if (el.getAttribute(references.editableAttribute) === path) {
    return el;
  } else {
    return dom.find(el, `[${references.editableAttribute}="${path}"]`);
  }
}

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
 * add click handler for adding components
 * @param {Element} button to attach handler to
 * @param {object} options (info about the component we want to add components to)
 * @param {string} options.ref
 * @param {string} options.path
 * @param {object} options.list (schema w/ include/exclude/etc)
 * @param {Element} options.listEl (list element to add components to)
 * @param {string} [prevRef] optional component ref to add components after
 */
function addHandler(button, options, prevRef) {
  var toolbar = dom.find('.kiln-toolbar'),
    allComponents = toolbar && toolbar.getAttribute('data-components') && toolbar.getAttribute('data-components').split(',') || [],
    include = _.get(options, 'list.include'),
    exclude = _.get(options, 'list.exclude'),
    available;

  // figure out what components should be available for adding
  if (include && include.length) {
    available = getAddableComponents(include, exclude);
  } else {
    available = getAddableComponents(allComponents, exclude);
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
      addComponent(options.listEl, field, currentAvailable[0], prevRef);
    } else {
      // open the add components pane
      paneService.openAddComponent(currentAvailable, { pane: options.listEl, field: field, ref: prevRef });
    }
  });
}

module.exports = addHandler;
module.exports.getParentListElement = getParentListElement;

// for testing
module.exports.getAddableComponents = getAddableComponents;
