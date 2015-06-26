// all components get decorated with component bars (which are hidden by default)
// components that are "selected" get their bar (and their parents' bars) shown

var references = require('./references'),
  dom = require('./dom'),
  focus = require('./focus'),
  forms = require('./forms'),
  currentSelected;

/**
 * set selection on a component
 * @param {Element} el editable element or component el
 * @param {{ref: string, path: string, data: object}} options
 * @param {MouseEvent} e
 */
function select(el) {
  var parent, // todo: allow n-number of parents to be selected
    attr = '[' + references.referenceAttribute + ']';

  el = dom.closest(el, attr);
  if (el.parentNode) {
    parent = dom.closest(el.parentNode, attr);
  }

  // selected component gets .selected, parent gets .selected-parent
  el.classList.add('selected');
  if (parent) {
    parent.classList.add('selected-parent');
  }
  currentSelected = el;
}

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
 * set the bar's height after images and such may have loaded
 * @param {Element} el component element
 */
function setHeight(el) {
  var componentHeight = getComputedStyle(el).height;

  dom.find(el, '.component-bar-title').style.width = parseInt(componentHeight) - 20 + 'px';
}

/**
 * add component bar (with click events)
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Element}
 */
function handler(el, options) {
  var tpl = `
    <aside class="component-bar" title="${references.getComponentNameFromReference(options.ref).toUpperCase()}">
      <span class="component-bar-title">${references.getComponentNameFromReference(options.ref)}</span>
    </aside>
  `,
  componentBar = dom.create(tpl);

  // add events to the component bar
  componentBar.addEventListener('click', function (e) {
    e.stopPropagation(); // this will prevent the unfocus from firing afterwards

    if (el.classList.contains('selected')) {
      // clicking on a selected bar opens its meta form
      // note: nothing gets focused
      focus.unfocus();
      forms.open(options.ref, document.body);
    } else if (el.classList.contains('selected-parent')) {
      // clicking on a parent bar selects it
      focus.unfocus();
      unselect();
      select(el);
    }
  });

  // make sure components are relatively positioned
  el.classList.add('component-bar-wrapper');
  dom.prependChild(el, componentBar); // prepended, so parent components are behind child components
  // don't set the component bar height until images &c are loaded
  window.addEventListener('load', setHeight.bind(null, el));
  return el;
}

// focus and unfocus
module.exports.select = select;
module.exports.unselect = unselect;

// set height of component bar label
module.exports.setHeight = setHeight;

// decorators
module.exports.when = when;
module.exports.handler = handler;
