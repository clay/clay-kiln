// all components get decorated with component bars (which are hidden by default)
// components that are "selected" get their bar (and their parents' bars) shown

var _ = require('lodash'),
  references = require('./references'),
  dom = require('@nymag/dom'),
  edit = require('./edit'),
  focus = require('../decorators/focus'),
  forms = require('./forms'),
  groups = require('./groups'),
  site = require('./site'),
  label = require('./label'),
  scrollToY = require('./scroll').toY,
  addComponent = require('../services/add-component'),
  paneService = require('../services/pane'),
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
 * Add the settings option to the actions menu.
 * @param {Element} actionsMenu
 * @param {object} data
 * @param {string} ref
 */
function addSettingsOption(actionsMenu, data, ref) {
  var el,
    hasSettings = groups.getSettingsFields(data).length > 0;

  if (hasSettings) {
    el = dom.create(`<button class="selected-action settings">
      <img src="${site.get('assetPath')}/media/components/clay-kiln/component-bar-settings.svg" alt="Settings">
    </button>`);

    el.addEventListener('click', function (e) {
      e.stopPropagation();
      // Open the settings overlay.
      return focus.unfocus().then(function () {
        return forms.open(ref, document.body);
      }).catch(_.noop);
    });

    actionsMenu.appendChild(el);
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
 * Add the parent's label to the info menu
 * @param {Element} infoMenu
 * @param {Element} parentEl
 */
function addParentLabel(infoMenu, parentEl) {
  var ref = parentEl.getAttribute(references.referenceAttribute),
    parentName = references.getComponentNameFromReference(ref),
    el = dom.create(`<button class="selected-info-item parent" title="Go to parent component: ${label(parentName)}">
      <img src="${site.get('assetPath')}/media/components/clay-kiln/component-bar-parent.svg" alt="Go to Parent">
    </button>`);

  el.addEventListener('click', function (e) {
    e.stopPropagation();
    // Select the parent.
    return focus.unfocus().then(function () {
      unselect();
      select(parentEl);
      scrollToComponent(parentEl);
    }).catch(_.noop);
  });
  infoMenu.appendChild(el);
}

/**
 * Add drag within a component list.
 * @param {Element} el (component element)
 */
function addDragOption(el) {
  el.classList.add('drag');
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
 * Add add component option within a component list.
 * @param {Element} actionsMenu
 * @param {object} opts options required to add component to parent list.
 */
function addAddComponentOption(actionsMenu, opts) {
  var include = opts.include,
    exclude = opts.exclude,
    pane = opts.pane,
    field = opts.field,
    toolbar = dom.find('.kiln-toolbar'),
    allComponents = toolbar && toolbar.getAttribute('data-components') && toolbar.getAttribute('data-components').split(',') || [],
    el = dom.create(`<button class="selected-action add">
      <span class="add-inner">+</span>
    </button>`),
    addableComponents;

  // figure out what components should be available for adding
  if (include && include.length) {
    addableComponents = getAddableComponents(include, exclude);
  } else {
    addableComponents = getAddableComponents(allComponents, exclude);
  }

  // add those components to the button
  el.setAttribute('data-components', addableComponents.join(','));

  // add click event handler
  el.addEventListener('click', function () {
    var addableComponents = el.getAttribute('data-components').split(',');

    if (addableComponents.length === 1) {
      addComponent(pane, field, addableComponents[0]);
    } else {
      // open the add components pane
      paneService.openAddComponent(addableComponents, { pane: pane, field: field });
    }
  });

  actionsMenu.appendChild(el);
}

/**
 * Add delete option within a component list.
 * @param {Element} actionsMenu
 * @param {object} opts options required to remove component from parent list.
 */
function addDeleteOption(actionsMenu, opts) {
  var el = dom.create(`<button class="selected-action delete">
    <img src="${site.get('assetPath')}/media/components/clay-kiln/component-bar-delete.svg" alt="Delete">
  </button>`);

  el.addEventListener('click', function () {
    return edit.removeFromParentList(opts)
      .then(forms.close);
  });

  actionsMenu.appendChild(el);
}

/**
 * Add options that depend on the parent (e.g. parent label and parent being a component list).
 * @param {Element} infoMenu
 * @param {Element} actionsMenu
 * @param {Element} el            The component element.
 * @param {Element} ref           The ref of the component.
 * @returns {Promise|undefined}
 */
function addParentOptions(infoMenu, actionsMenu, el, ref) {
  var parentEl = getParentEl(el),
    parentRef;

  if (parentEl) {
    parentRef = parentEl.getAttribute(references.referenceAttribute);
    addParentLabel(infoMenu, parentEl);
    return edit.getSchema(parentRef)
      .then(function (parentSchema) {
        var componentListField = getParentComponentListField(el, parentSchema),
          componentList = componentListField && _.get(parentSchema, `${componentListField}.${references.componentListProperty}`), // get parent's component list
          include = componentList && componentList.include,
          exclude = componentList && componentList.exclude,
          pane = dom.find(parentEl, `[${references.editableAttribute}="${componentListField}"]`);

        if (componentListField) {
          addDragOption(el);
          addAddComponentOption(actionsMenu, { include: include, exclude: exclude, pane: pane, field: { ref: parentRef, path: componentListField } });
          addDeleteOption(actionsMenu, {el: el, ref: ref, parentField: componentListField, parentRef: parentRef});
        }
      });
  }
}

/**
 * add component bar (with click events)
 * @param {Element} componentEl   An element that has a ref.
 * @param {object} options
 * @param {string} options.ref
 * @param {string} options.path
 * @param {object} options.data
 * @returns {Element}
 */
function handler(componentEl, options) {
  var name = references.getComponentNameFromReference(options.ref),
    infoMenu = dom.create(`
    <aside class="selected-info">
      <span class="selected-info-item selected-label" title="${label(name)}">${label(name)}</span>
    </aside>
    `),
    actionsMenu = dom.create('<aside class="selected-actions"></aside>'),
    selector = dom.create('<aside class="component-selector"></aside>');

  // Add options to info and actions
  addSettingsOption(actionsMenu, options.data, options.ref);
  return Promise.resolve(addParentOptions(infoMenu, actionsMenu, componentEl, options.ref))
    .then(function () {
      // add events to the component itself
      // when the component is clicked, it should be selected
      componentEl.addEventListener('click', componentClickHandler.bind(null, componentEl));

      // make sure components are relatively positioned
      componentEl.classList.add('component-selector-wrapper');
      // add info and actions to selector
      // (selector is used so we can easily toggle the menus+border on and off)
      // (and so we can have something to easily wrap/unwrap for inline forms)
      selector.appendChild(infoMenu);
      // only add action menu if there are actions
      if (actionsMenu.children.length) {
        selector.appendChild(actionsMenu);
      }
      dom.prependChild(componentEl, selector); // prepended, so parent components are behind child components
      // set styles so info and action menus will be centered
      // todo: in the future, this is where we make sure they'll be in the viewport
      // note: 15px is the offset of the outline / component selector element
      infoMenu.style.marginLeft = `-${infoMenu.getBoundingClientRect().width / 2}px`;
      if (actionsMenu.children.length) {
        actionsMenu.style.marginLeft = `-${actionsMenu.getBoundingClientRect().width / 2}px`;
      }
      // add an iframe-overlay to iframes so we can click on components with them
      addIframeOverlays(componentEl);
      return componentEl;
    });
}

// focus and unfocus
module.exports.select = select;
module.exports.unselect = unselect;

// decorators
module.exports.when = when;
module.exports.handler = handler;
