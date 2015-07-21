// all components get decorated with component bars (which are hidden by default)
// components that are "selected" get their bar (and their parents' bars) shown

var references = require('./references'),
  dom = require('./dom'),
  focus = require('../decorators/focus'),
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

  //dom.find(el, '.component-bar-title').style.width = parseInt(componentHeight) - 20 + 'px';
}

/**
 * handle clicks on the component bar
 * @param {Element} el
 * @param {object} options
 * @param {MouseEvent} e
 */
function componentBarClickHandler(el, options, e) {
  e.stopPropagation(); // this will prevent the unfocus from firing afterwards

  if (el.classList.contains('selected')) {
    // clicking on a selected bar opens its settings form
    // note: nothing gets focused
    focus.unfocus();
    forms.open(options.ref, document.body);
  } else if (el.classList.contains('selected-parent')) {
    // clicking on a parent bar selects it
    focus.unfocus();
    unselect();
    select(el);
  }
}

/**
 * handle clicks on the component itself
 * @param {Element} el
 * @param {MouseEvent} e
 */
function componentClickHandler(el, e) {
  e.stopPropagation();

  if (!el.classList.contains('selected')) {
    unselect();
    select(el);
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
      newDiv.style.cssText = getComputedStyle(iframes[i]).cssText;
      newDiv.style.position = 'absolute';
      dom.insertAfter(iframes[i], newDiv);
      iframes[i].classList.add('iframe-overlay');
    }
  }
}

/**
 * add component bar (with click events)
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Element}
 */
function handler(el, options) {
  var tpl = `
    <aside class="component-bar">
      <span class="parent label" title="PARENT LABEL">Parent Label</span>
      <span class="label" title="${references.getComponentNameFromReference(options.ref).toUpperCase()}">${references.getComponentNameFromReference(options.ref)}</span>
      <span class="settings"><svg width="16px" height="16px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><title>Settings</title><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="#000000"><g transform="translate(6.499495, 8.699495) rotate(-315.000000) translate(-6.499495, -8.699495) translate(2.999495, -1.800505)"><path d="M1,3.25 L7,3.25 L7,15.25 L1,15.25 L1,3.25 Z M2.25,4.24321761 L3,4.24321761 L3,14.2432176 L2.25,14.2432176 L2.25,4.24321761 Z M5,4.24321761 L5.75,4.24321761 L5.75,14.2432176 L5,14.2432176 L5,4.24321761 Z"></path><polygon points="4 16 7 20 1 20 "></polygon><rect x="1" y="5.68434189e-14" width="6" height="2.5"></rect></g></g></g></svg></span>
      <span class="drag"><svg width="10px" height="19px" viewBox="0 0 10 19" xmlns="http://www.w3.org/2000/svg"><title>Drag</title><path d="M3.015625,9 L3.015625,5 L0,5 L5,0 L10,5 L7.015625,5 L7.015625,14 L10,14 L5,19 L0,14 L3.015625,14 L3.015625,10 L3,10 L3,9 L3.015625,9 Z M3.015625,9 L3.015625,10 L7,10 L7,9 L3.015625,9 Z"></path></svg></span>
      <span class="delete"><svg width="14px" height="17px" viewBox="0 0 14 17" xmlns="http://www.w3.org/2000/svg"><title>Delete</title><path d="M2,17 L12,17 L12,4 L2,4 L2,17 Z M4,6.00554435 L5,6.00554435 L5,15 L4,15 L4,6.00554435 Z M6.5,6.00554435 L7.5,6.00554435 L7.5,15 L6.5,15 L6.5,6.00554435 Z M9,6.00554435 L10,6.00554435 L10,15 L9,15 L9,6.00554435 Z"></path><path d="M14,3 L0,3 L1.3125,1 L12.6875,1 L14,3"></path><path d="M5,0 L9,0 L9,1 L5,1 L5,0 Z"></path></svg></span>
      <span class="fill"></span>
    </aside>
  `,
  componentBar = dom.create(tpl);

  // add events to the component bar
  componentBar.addEventListener('click', componentBarClickHandler.bind(null, el, options));

  // add events to the component itself
  // when the component is clicked, it should be selected
  el.addEventListener('click', componentClickHandler.bind(null, el));

  // make sure components are relatively positioned
  el.classList.add('component-bar-wrapper');
  dom.prependChild(el, componentBar); // prepended, so parent components are behind child components
  // don't set the component bar height until images &c are loaded
  window.addEventListener('load', setHeight.bind(null, el));
  // add an iframe-overlay to iframes so we can click on components with them
  addIframeOverlays(el);
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
