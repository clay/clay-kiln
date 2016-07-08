var references = require('../references'),
  dom = require('@nymag/dom'),
  _ = require('lodash'),
  paneService = require('../pane'),
  addComponent = require('./add-component'),
  site = require('../site');

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
 * determine if a component is available on the current site, based on logic
 * @param {string} slug e.g. "grubstreet"
 * @param {string} logic e.g. (di, press, thecut) or (not:di, not:press, not:thecut) or a mixture of both
 * @returns {boolean}
 */
function availableOnCurrentSite(slug, logic) {
  var tokens = logic.split(',').map((str) => str.trim()), // trim any extra whitespace
    // list of site slugs to include
    include = _.reject(tokens, (token) => _.includes(token, 'not:')),
    // list of site slugs to exclude (remove the "not:" from the tokens)
    exclude = _.map(_.filter(tokens, (token) => _.includes(token, 'not:')), (token) => token.replace('not:', ''));

  if (!_.isEmpty(include)) {
    // if we have any sites explicitly included, then the component is available if we're
    // on one of those sites AND we're not on any sites in the excluded list
    // note: configuring "(siteName, otherSiteName, not:siteName)" is silly, but possible
    return _.includes(include, slug) && !_.includes(exclude, slug);
  } else {
    // if we don't explicitly include certain sites, then just make sure the
    // current site isn't excluded
    return !_.includes(exclude, slug);
  }
}

/**
 * see if a component can be added in this list,
 * by checking the exclude array and the current site
 * @param {string} str component name and optional site logic
 * @param {array} exclude
 * @returns {boolean}
 */
function filterComponent(str, exclude) {
  var matches = str.match(/([\w-]+)(?:\s?\((.*?)\))?/),
    name = matches[1],
    siteLogic = matches[2];

  if (_.includes(exclude, name)) {
    // first, check to make sure a component isn't in the exclude list
    return false;
  } else if (siteLogic && !availableOnCurrentSite(site.get('slug'), siteLogic)) {
    // then, check to make sure we can use this component on the current site
    return false;
  } else {
    // we can add this component to this list on this site!
    return true;
  }
}

/**
 * map through components, filtering out excluded
 * then filter out components not allowed on the current site
 * then remove any site logic (to only return the component names)
 * @param {array} possibleComponents
 * @param {array} [exclude] array of components to exclude
 * @returns {array} array of elements
 */
function getAddableComponents(possibleComponents, exclude) {
  return _.map(_.filter(possibleComponents, (item) => filterComponent(item, exclude)), function (str) {
    return str.replace(/\s?\(.*?\)/g, ''); // remove any site logic
  });
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
    allComponents = toolbar && toolbar.getAttribute('data-components') && toolbar.getAttribute('data-components').split(',').sort() || [],
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
