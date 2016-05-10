// all components get decorated with component bars (which are hidden by default)
// components that are "selected" get their bar (and their parents' bars) shown

var _ = require('lodash'),
  references = require('./references'),
  dom = require('@nymag/dom'),
  tpl = require('./tpl'),
  edit = require('./edit'),
  focus = require('../decorators/focus'),
  forms = require('./forms'),
  groups = require('./groups'),
  label = require('./label'),
  scrollToY = require('./scroll').toY,
  addComponent = require('./add-component'),
  paneService = require('./pane'),
  hidden = 'kiln-hide',
  currentSelected;

/**
 * Get the closest component element from the DOM. Checks self and then parents.
 * @param {Element} el    Any element within a component.
 * @returns {Element}
 */
function getComponentEl(el) {
  var attr = references.referenceAttribute,
    componentEl = dom.closest(el, '[' + attr + ']');

  return componentEl;
}

/**
 * Get the closest parent component of the component from the DOM.
 * @param {Element} componentEl  A component element
 * @returns {Element}
 */
function getParentEl(componentEl) {
  var parent = componentEl.parentNode && getComponentEl(componentEl.parentNode);

  return parent;
}

/**
 * Get the parent field if it is a component list.
 * @param {Element} componentEl
 * @param {object} parentSchema
 * @returns {string|undefined}
 */
function getParentComponentListField(componentEl, parentSchema) {
  var attr = references.editableAttribute,
    parent = componentEl.parentNode,
    field = parent && dom.closest(parent, '[' + attr + ']'),
    path = field && field.getAttribute(attr);

  return path && parentSchema[path] && parentSchema[path][references.componentListProperty] && path;
}

/**
 * set selection on a component
 * @param {Element} el editable element or component el
 * @param {{ref: string, path: string, data: object}} options
 * @param {MouseEvent} e
 */
function select(el) {
  var component = getComponentEl(el),
    parent = getParentEl(component);

  // selected component gets .selected, parent gets .selected-parent
  component.classList.add('selected');
  if (parent) {
    parent.classList.add('selected-parent');
  }
  currentSelected = component;
}

/**
 * hide ALL component lists in element
 * @param {Element} el
 */
function hideComponentList(el) {
  var lists = dom.findAll(el, '.component-list-bottom');

  _.each(lists, function (list) {
    list.classList.remove('show');
  });
}

/**
 * remove selected classes on current and parent component
 * @param {Element} [el]
 * @param {Element} [parent]
 */
function removeClasses(el, parent) {
  if (el) {
    el.classList.remove('selected');
    hideComponentList(el);
  }
  if (parent) {
    parent.classList.remove('selected-parent');
    hideComponentList(parent);
  }
}

/**
 * remove selection
 */
function unselect() {
  var current, parent;

  if (currentSelected) {
    current = currentSelected;
    parent = dom.closest(currentSelected.parentNode, '[' + references.referenceAttribute + ']');
  } else {
    current = dom.find('.selected');
    parent = dom.find('.selected-parent');
  }

  removeClasses(current, parent);
  currentSelected = null;
}

/**
 * only add select decorator to components' root element
 * @param {Element} el
 * @returns {boolean}
 */
function when(el) {
  return el.hasAttribute(references.referenceAttribute);
}

/**
 * handle clicks on the component itself
 * @param {Element} el
 * @param {MouseEvent} e
 */
function componentClickHandler(el, e) {
  // allow events to propagate upwards, but set a flag
  // this allows forms to fire the "outsideClickhandler" to close themselves
  // while preventing parent components from thinking they're being selected
  if (!e.stopSelection) {
    e.stopSelection = true;

    if (!el.classList.contains('selected')) {
      unselect();
      select(el);
    }
  }
}

function addIframeOverlays(el) {
  var iframes = dom.findAll(el, 'iframe'),
    i = 0,
    l = iframes.length,
    newDiv;

  for (; i < l; i++) {
    if (!iframes[i].classList.contains('iframe-overlay')) {
      newDiv = document.createElement('div');
      newDiv.style.width = '100%';
      newDiv.style.height = '100%';
      newDiv.style.top = '0';
      newDiv.style.left = '0';
      newDiv.style.position = 'absolute';
      dom.insertAfter(iframes[i], newDiv);
      iframes[i].classList.add('iframe-overlay');
    }
  }
}

/**
 * Scroll user to the component. "Weeee!" or "What the?"
 * @param {Element} el
 */
function scrollToComponent(el) {
  var toolBarHeight = 70,
    selectedBorderHeight = 4,
    pos = window.scrollY + el.getBoundingClientRect().top - toolBarHeight - selectedBorderHeight;

  scrollToY(pos, 1500, 'easeInOutQuint');
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
 * get parent info, if it exists
 * @param {Element} el current component
 * @returns {Promise} w/ empty object OR el, ref, path, list (from the schema), listEl, and isComponentList (boolean)
 */
function getParentInfo(el) {
  const parentEl = getParentEl(el);

  if (parentEl) {
    const ref = parentEl.getAttribute(references.referenceAttribute);

    return edit.getSchema(ref).then(function (schema) {
      let parent = {
          el: parentEl,
          ref: ref
        },
        path = getParentComponentListField(el, schema);

      return _.assign(parent, {
        isComponentList: !!path, // we use this to determine whether the current component lives in a list
        path: path,
        list: _.get(schema, `${path}.${references.componentListProperty}`),
        listEl: dom.find(parentEl, `[${references.editableAttribute}="${path}"]`)
      });
    });
  } else {
    return Promise.resolve({});
  }
}

/**
 * add label for current component
 * @param {Element} selector
 * @param {string} name
 */
function addLabel(selector, name) {
  var labelEl = dom.find(selector, '.selected-label');

  labelEl.innerHTML = label(name);
  labelEl.setAttribute('title', label(name));
}

/**
 * add parent arrow and handler if parent exists
 * @param {Element} selector
 * @param {object} parent
 */
function addParentHandler(selector, parent) {
  var button = dom.find(selector, '.selected-info-parent');

  if (parent) {
    // if parent exists at all, add the handler
    button.classList.remove(hidden);
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      // Select the parent.
      return focus.unfocus().then(function () {
        unselect();
        select(parent.el);
        scrollToComponent(parent.el);
      }).catch(_.noop);
    });
  }
}

/**
 * determine if a component has settings
 * @param {object} options
 * @returns {boolean}
 */
function hasSettings(options) {
  return groups.getSettingsFields(options.data).length > 0;
}

/**
 * unhide top menu if settings or delete is available
 * note: more options might exist in the top action menu in the future
 * note: right now all components in lists get delete, add, and reorder handlers
 * @param {Element} selector
 * @param {object} parent
 * @param {object} options
 */
function unhideTopMenu(selector, parent, options) {
  if (hasSettings(options) || parent.isComponentList) {
    dom.find(selector, '.selected-actions').classList.remove(hidden);
  }
}

/**
 * unhide settings button and add handler
 * @param {Element} selector
 * @param {object} options
 */
function addSettingsHandler(selector, options) {
  var button = dom.find(selector, '.selected-action-settings');

  if (hasSettings(options)) {
    button.classList.remove(hidden);
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      // Open the settings overlay.
      return focus.unfocus().then(function () {
        return forms.open(options.ref, document.body);
      }).catch(_.noop);
    });
  }
}

/**
 * unhide delete button and add handler
 * @param {Element} selector
 * @param {object} parent
 * @param {Element} el
 * @param {object} options
 */
function addDeleteHandler(selector, parent, el, options) {
  var button = dom.find(selector, '.selected-action-delete');

  if (parent.isComponentList) {
    button.classList.remove(hidden);
    button.addEventListener('click', function () {
      var confirm = window.confirm('Delete this component? This cannot be undone.'); // eslint-disable-line

      if (confirm) {
        return edit.removeFromParentList({el: el, ref: options.ref, parentField: parent.path, parentRef: parent.ref})
          .then(forms.close);
      }
    });
  }
}

/**
 * unhide bottom menu if add component is available
 * @param {Element} selector
 * @param {object} parent
 */
function unhideBottomMenu(selector, parent) {
  if (parent.isComponentList) {
    dom.find(selector, '.component-selector-bottom').classList.remove(hidden);
  }
}

/**
 * unhide and add handler for add component
 * @param {Element} selector
 * @param {object} parent
 * @param {object} options
 */
function addAddHandler(selector, parent, options) {
  var button = dom.find(selector, '.selected-add'),
    toolbar = dom.find('.kiln-toolbar'),
    allComponents = toolbar && toolbar.getAttribute('data-components') && toolbar.getAttribute('data-components').split(',') || [],
    available;

  if (parent.isComponentList) {
    let include = _.get(parent, 'list.include'),
      exclude = _.get(parent, 'list.exclude');

    // unhide the button
    button.classList.remove(hidden);

    // figure out what components should be available for adding
    if (include && include.length) {
      available = getAddableComponents(include, exclude);
    } else {
      available = getAddableComponents(allComponents, exclude);
    }

    // add those components to the button
    button.setAttribute('data-components', available.join(','));

    // add click event handler
    button.addEventListener('click', function () {
      var currentAvailable = button.getAttribute('data-components').split(','),
        field = {
          ref: parent.ref,
          path: parent.path
        };

      if (currentAvailable.length === 1) {
        addComponent(parent.listEl, field, currentAvailable[0], options.ref);
      } else {
        // open the add components pane
        paneService.openAddComponent(currentAvailable, { pane: parent.listEl, field: field, ref: options.ref });
      }
    });
  }
}

/**
 * add drag within a component list.
 * @param {Element} el (component element, not the selector)
 * @param {object} parent
 */
function addDragHandler(el, parent) {
  if (parent.isComponentList) {
    el.classList.add('drag');
  }
}

/**
 * add component bar (with click events)
 * @param {Element} el component element
 * @param {object} options
 * @param {string} options.ref
 * @param {string} options.path
 * @param {object} options.data
 * @returns {Element}
 */
function handler(el, options) {
  var name = references.getComponentNameFromReference(options.ref),
    selector = tpl.get('.component-selector-template');

  // resolve parent info. if there are no parents this resolves to empty object
  return getParentInfo(el).then(function (parent) {
    // add options to the component selector
    // set component label
    addLabel(selector, name);
    // if parent, unhide + add handler
    addParentHandler(selector, parent);

    // if settings or delete, unhide actions
    // note: more options might exist in the top action menu in the future
    // note: right now all components in lists get delete, add, and reorder handlers
    unhideTopMenu(selector, parent, el, options);

    // if settings, unhide + add handler
    addSettingsHandler(selector, options);
    // if delete, unhide + add handler
    addDeleteHandler(selector, parent, el, options);

    // if add, unhide bottom
    // note: more options might exist in the bottom menu in the future
    unhideBottomMenu(selector, parent);
    // if add, unhide + add handler
    addAddHandler(selector, parent, options);

    // if drag, add class
    // note: this adds a class to the component itself,
    // not the selector
    addDragHandler(el, parent);

    // add iframe overlays
    addIframeOverlays(el);

    // add events to the component itself
    // when the component is clicked, it should be selected
    el.addEventListener('click', componentClickHandler.bind(null, el));

    // make sure components are relatively positioned
    el.classList.add('component-selector-wrapper');

    // add selector to the component el
    dom.prependChild(el, selector);
    return el;
  });
}

// focus and unfocus
module.exports.select = select;
module.exports.unselect = unselect;

// decorators
module.exports.when = when;
module.exports.handler = handler;
