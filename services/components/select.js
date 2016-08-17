// all components get decorated with component bars (which are hidden by default)
// components that are "selected" get their bar (and their parents' bars) shown

var _ = require('lodash'),
  references = require('../references'),
  dom = require('@nymag/dom'),
  tpl = require('../tpl'),
  edit = require('../edit'),
  focus = require('../../decorators/focus'),
  placeholder = require('../../decorators/placeholder'),
  forms = require('../forms'),
  groups = require('./groups'),
  label = require('../label'),
  scrollToY = require('../scroll').toY,
  addComponentHandler = require('./add-component-handler'),
  hidden = 'kiln-hide',
  currentSelected;

/**
 * Get the closest component element from the DOM. Checks self and then parents.
 * @param {Element} el    Any element within a component.
 * @returns {Element}
 */
function getComponentEl(el) {
  var attr = references.referenceAttribute,
    componentEl = el && dom.closest(el, '[' + attr + ']');

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
 * Get the parent field if it is a component list or prop
 * @param {Element} componentEl
 * @param {object} parentSchema
 * @param {string} property
 * @returns {string|undefined}
 */
function getParentField(componentEl, parentSchema, property) {
  var attr = references.editableAttribute,
    parent = componentEl.parentNode,
    field = parent && dom.closest(parent, '[' + attr + ']'),
    path = field && field.getAttribute(attr);

  return path && parentSchema[path] && parentSchema[path][property] && path;
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
  if (component) {
    component.classList.add('selected');
    currentSelected = component;
  }
  if (parent) {
    parent.classList.add('selected-parent');
  }
  window.kiln.trigger('select', component);
}

/**
 * remove selected classes on current and parent component
 * @param {Element} [el]
 * @param {Element} [parent]
 */
function removeClasses(el, parent) {
  if (el) {
    el.classList.remove('selected');
  }
  if (parent) {
    parent.classList.remove('selected-parent');
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
  window.kiln.trigger('unselect', current);
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
 * get parent info, if it exists
 * @param {Element} el current component
 * @returns {Promise}
 */
function getParentInfo(el) {
  const parentEl = getParentEl(el);

  if (parentEl) {
    const ref = parentEl.getAttribute(references.referenceAttribute);

    return edit.getComponentRef(ref).then(function (componentRef) {
      return edit.getSchema(componentRef).then(function (schema) {
        let parent = {
            el: parentEl,
            ref: componentRef
          },
          listPath = getParentField(el, schema, references.componentListProperty),
          propPath = getParentField(el, schema, references.componentProperty);

        if (listPath) {
          // add component list if it exists
          _.assign(parent, {
            isComponentList: !!listPath, // we use this to determine whether the current component lives in a list
            path: listPath,
            schema: _.get(schema, listPath), // full schema for the field, including labels and placeholders
            list: _.get(schema, `${listPath}.${references.componentListProperty}`), // component list data only
            listEl: addComponentHandler.getParentEditableElement(parentEl, listPath)
          });
        } else if (propPath) {
          // add component prop if it exists
          _.assign(parent, {
            isComponentProp: !!propPath, // we use this to determine whether the current component lives in a property
            path: propPath,
            schema: _.get(schema, propPath), // full schema for the field, including labels and placeholders
            prop: _.get(schema, `${propPath}.${references.componentProperty}`), // component prop data only
            propEl: addComponentHandler.getParentEditableElement(parentEl, propPath)
          });
        }

        return parent;
      });
    });
  } else {
    return Promise.resolve({}); // so we can easily check `parent.el`, `parent.isComponentList`, etc
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

  if (parent.el) {
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
 * add component list placeholder when the last component is deleted from a list
 * @param {object} parent
 */
function addListPlaceholder(parent) {
  var listDiv = dom.find(parent.listEl, '.component-list-inner');

  // if the list is empty in the dom, re-add the placeholder for it
  if (!listDiv.children.length) {
    let emptyList = [];

    // placeholder decorator expects an empty array with a _schema property
    // (it checks data.length to see if the list is actually empty)
    emptyList._schema = parent.schema;
    placeholder.handler(listDiv, { ref: parent.ref, path: parent.path, data: emptyList });
  }
}

/**
 * unhide delete button and add handler
 * note: only for components in LISTS! components in properties can be replaced but not deleted (for now)
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
          .then(() => addListPlaceholder(parent))
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
  if (parent.isComponentList || parent.isComponentProp) {
    dom.find(selector, '.component-selector-bottom').classList.remove(hidden);
  }
}

/**
 * unhide and add handler for add component (to list)
 * @param {Element} selector
 * @param {object} parent
 * @param {object} options
 */
function addAddHandler(selector, parent, options) {
  var button = dom.find(selector, '.selected-add');

  if (parent.isComponentList) {
    // unhide the button
    button.classList.remove(hidden);

    // attach the event handler
    addComponentHandler(button, parent, options.ref);
  }
}

/**
 * unhide and add handler for replacing component (in property)
 * @param {Element} selector
 * @param {object} parent
 * @param {object} options
 */
function addReplaceHandler(selector, parent, options) {
  var button = dom.find(selector, '.selected-replace');

  if (parent.isComponentProp) {
    // unhide the button
    button.classList.remove(hidden);

    // attach the event handler
    addComponentHandler(button, parent, options.ref);
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

    // if settings, unhide + add handler
    addSettingsHandler(selector, options);
    // if delete, unhide + add handler
    addDeleteHandler(selector, parent, el, options);

    // if component lives in a list or property, unhide bottom
    // note: more options might exist in the bottom menu in the future
    unhideBottomMenu(selector, parent);
    // if list, unhide + add handler
    addAddHandler(selector, parent, options);
    // if property, unhide + add handler
    addReplaceHandler(selector, parent, options);

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

    // add selector to the component el, BEHIND the component's children
    dom.prependChild(el, selector);
    window.kiln.trigger('add-selector', el, options, parent);
    return el;
  });
}

// select and unselect
module.exports.select = select;
module.exports.unselect = unselect;
module.exports.scrollToComponent = scrollToComponent;

// decorators
module.exports.when = when;
module.exports.handler = handler;

_.set(window, 'kiln.services.select', module.exports); // export for plugins
