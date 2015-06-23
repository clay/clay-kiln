// all components get decorated with component bars (which are hidden by default)
// components that are "selected" get their bar (and their parents' bars) shown

var references = require('./references'),
  dom = require('./dom'),
  currentSelected;

/**
 * set selection on an Element
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @param {MouseEvent} e
 */
function select(el, options, e) {
  el.classList.add('selected');
  currentSelected = el;
}

/**
 * remove selection
 */
function unselect() {
  currentSelected.classList.remove('selected');
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
 * add component bar (with click events)
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Element}
 */
function handler(el, options) {
  var tpl = `
    <aside class="component-bar">
    </aside>
  `;

  // make sure components are relatively positioned
  el.classList.add('component-bar-wrapper');
  el.appendChild(dom.create(tpl));
  return el;
}

// focus and unfocus
module.exports.select = select;
module.exports.unselect = unselect;

// decorators
module.exports.when = when;
module.exports.handler = handler;
