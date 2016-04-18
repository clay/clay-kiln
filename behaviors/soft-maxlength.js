var striptags = require('striptags'),
  he = require('he'),
  dom = require('@nymag/dom'),
  getInput = require('../services/field-helpers').getInput;

/**
 * toggle classes on elements
 * @param {boolean} isTooLong
 * @param {Element} span
 * @param {Element} input
 */
function toggleClass(isTooLong, span, input) {
  if (isTooLong) {
    span.classList.add('too-long');
    input.classList.add('input-too-long');
  } else {
    span.classList.remove('too-long');
    input.classList.remove('input-too-long');
  }
}

/**
 * set text in a span
 * @param {string} text
 * @param {Element} span
 */
function setText(text, span) {
  span.innerHTML = text;
}

/**
 * set styles depending on the remaining length
 * @param {number} remaining
 * @param {number} max
 * @param {Element} el
 */
function setStyles(remaining, max, el) {
  var input = getInput(el.parentNode),
    span = el;

  if (remaining >= 0) {
    toggleClass(false, span, input);
    setText(`Remaining: ${remaining} / ${max}`, span);
  } else {
    toggleClass(true, span, input);
    setText(`Remaining: ${remaining} / ${max}`, span);
  }
}

/**
 * Remove tags and white spaces.
 * @param {string} value
 * @returns {string}
 */
function cleanValue(value) {
  var clean = he.decode(striptags(value));

  return clean;
}

/**
 * Add soft max length: appends el and adds formatter.
 * @param {{name: string, el: Element, bindings: {}, formatters: {}}} result
 * @param {{value: string}} args
 * @returns {{}}
 */
module.exports = function (result, args) {
  var el = result.el,
    name = result.name,
    tpl = `
      <span class="soft-maxlength" data-maxlength="${args.value}" rv-remaining="${name}.data.value"></span>
    `,
    span = dom.create(tpl);

  result.binders.remaining = function (el, value) {
    var length = value ? cleanValue(value).length : 0,
      max = parseInt(el.getAttribute('data-maxlength')),
      remaining = max - length;

    setStyles(remaining, max, el);
  };

  el.appendChild(span);
  return result;
};
