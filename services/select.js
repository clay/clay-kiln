// all components get decorated with component bars (which are hidden by default)
// components that are "selected" get their bar (and their parents' bars) shown

var _ = require('lodash'),
  references = require('./references'),
  dom = require('./dom'),
  edit = require('./edit'),
  focus = require('../decorators/focus'),
  forms = require('./forms'),
  groups = require('./groups'),
  site = require('./site'),
  label = require('./label'),
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

function walk(node, walker) {
  if (node && node.classList.contains('component-list-bottom')) {
    node.classList.add('show');
  } else if (node) {
    walk(walker.nextNode(), walker);
  }
}

/**
 * show component lists in element, without showing component lists in child components of element
 * @param {Element} el
 */
function showComponentList(el) {
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, {
    acceptNode: function (currentNode) {
      // don't look for component lists in child components
      if (!currentNode.hasAttribute(references.referenceAttribute)) {
        return NodeFilter.FILTER_ACCEPT;
      } else {
        return NodeFilter.FILTER_REJECT;
      }
    }
  });

  walk(walker.nextNode(), walker);
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
  showComponentList(component);
  if (parent) {
    parent.classList.add('selected-parent');
    showComponentList(parent);
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
 * Add the settings option to the component bar.
 * @param {Element} componentBar
 * @param {object} data
 * @param {string} ref
 */
function addSettingsOption(componentBar, data, ref) {
  var el,
    hasSettings = groups.getSettingsFields(data).length > 0;

  if (hasSettings) {
    el = dom.create(`<li class="settings label">
      <img src="${site.get('assetPath')}/media/components/clay-kiln/component-bar-settings.svg" alt="Settings">
      <span class="menu-item">Settings</span>
    </li>`);

    el.addEventListener('click', function (e) {
      e.stopPropagation();
      // Open the settings overlay.
      return focus.unfocus().then(function () {
        return forms.open(ref, document.body);
      }).catch(_.noop);
    });

    addMenu(componentBar);
    componentBar.querySelector('.menu').appendChild(el);
  }
}

/**
 * Scroll user to the component. "Weeee!" or "What the?"
 * @param {Element} el
 */
function scrollToComponent(el) {
  var toolBarHeight = 70,
    componentBarHeight = 30;

  window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - toolBarHeight - componentBarHeight);
}

/**
 * Add the parent's label to the component bar.
 * @param {Element} componentBar
 * @param {Element} parentEl
 */
function addParentLabel(componentBar, parentEl) {
  var ref = parentEl.getAttribute(references.referenceAttribute),
    parentName = references.getComponentNameFromReference(ref),
    el = dom.create(`<span class="label parent" title="Go to parent component: ${label(parentName)}">
      <img src="${site.get('assetPath')}/media/components/clay-kiln/component-bar-parent.svg" alt="Go to Parent">
      <span>${label(parentName)}</span>
    </span>`);

  el.addEventListener('click', function (e) {
    e.stopPropagation();
    // Select the parent.
    return focus.unfocus().then(function () {
      unselect();
      select(parentEl);
      scrollToComponent(parentEl);
    }).catch(_.noop);
  });
  componentBar.appendChild(el);
}

/**
 * Add drag within a component list.
 * @param {Element} componentBar
 */
function addDragOption(componentBar) {
  // `drag` class is applied to the `img` and and selector elements to simplify dragula logic.
  var selectedLabel = componentBar.querySelector('.selected-label'),
    el = dom.create(`<img src="${site.get('assetPath')}/media/components/clay-kiln/component-bar-drag.svg" alt="Drag" class="drag drag-icon"></span>`);

  selectedLabel.setAttribute('title', `Drag to reorder: ${label(selectedLabel.getAttribute('title'))}`);
  selectedLabel.querySelector('.selected-label-inner').classList.add('drag');
  selectedLabel.classList.add('drag');
  selectedLabel.insertBefore(el, selectedLabel.firstChild);
}

/**
 * Add delete option within a component list.
 * @param {Element} componentBar
 * @param {object} opts           Options required to remove component from parent list.
 */
function addDeleteOption(componentBar, opts) {
  var el = dom.create(`<li class="delete label">
    <img src="${site.get('assetPath')}/media/components/clay-kiln/component-bar-delete.svg" alt="Delete">
    <span class="menu-item">Delete</span>
  </li>`);

  el.addEventListener('click', function () {
    return edit.removeFromParentList(opts)
      .then(forms.close);
  });

  addMenu(componentBar);
  componentBar.querySelector('.menu').appendChild(el);
}

/**
 * Add options that depend on the parent (e.g. parent label and parent being a component list).
 * @param {Element} componentBar
 * @param {Element} el            The component element.
 * @param {Element} ref           The ref of the component.
 * @returns {Promise|undefined}
 */
function addParentOptions(componentBar, el, ref) {
  var parentEl = getParentEl(el),
    parentRef;

  if (parentEl) {
    parentRef = parentEl.getAttribute(references.referenceAttribute);
    addParentLabel(componentBar, parentEl);
    return edit.getSchema(parentRef)
      .then(function (parentSchema) {
        var componentListField = getParentComponentListField(el, parentSchema);

        if (componentListField) {
          addDragOption(componentBar);
          addDeleteOption(componentBar, {el: el, ref: ref, parentField: componentListField, parentRef: parentRef});
        }
      });
  }
}

/**
 * idempotentally add menu
 * @param {Element} componentBar
 */
function addMenu(componentBar) {
  var el = dom.create(`
    <span class="menu-toggle"><img src="${site.get('assetPath')}/media/components/clay-kiln/component-bar-menu.svg" alt="Component Menu"></span>
    <ul class="menu"></ul>
  `);

  el.querySelector('.menu-toggle').addEventListener('click', function (e) {
    var bar = dom.closest(e.target, '.component-bar'),
      toggle = bar.querySelector('.menu-toggle'),
      menu = bar.querySelector('.menu');

    toggle.classList.toggle('open');
    menu.classList.toggle('open');
    e.stopPropagation();
  });

  if (!componentBar.querySelector('.menu-toggle')) {
    componentBar.appendChild(el);
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
    tpl = `
    <aside class="component-bar">
      <span class="label selected-label" title="${label(name)}">
        <span class="selected-label-inner">${label(name)}</span>
      </span>
    </aside>
    `,
    componentBar = dom.create(tpl);

  // Add options to the component bar.
  addSettingsOption(componentBar, options.data, options.ref);
  addParentOptions(componentBar, componentEl, options.ref);

  // add events to the component itself
  // when the component is clicked, it should be selected
  componentEl.addEventListener('click', componentClickHandler.bind(null, componentEl));

  // make sure components are relatively positioned
  componentEl.classList.add('component-bar-wrapper');
  dom.prependChild(componentEl, componentBar); // prepended, so parent components are behind child components
  // add an iframe-overlay to iframes so we can click on components with them
  addIframeOverlays(componentEl);
  return componentEl;
}

// focus and unfocus
module.exports.select = select;
module.exports.unselect = unselect;

// decorators
module.exports.when = when;
module.exports.handler = handler;
