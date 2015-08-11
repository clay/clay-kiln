/*
Soft Maxlength arguments

value {number} maximum number of characters allowed
 */

var striptags = require('striptags'),
  dom = require('../services/dom'),
  getInput = require('../services/get-input');

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
 * set styles depending on the remaining length
 * @param {number} remaining
 * @param {Element} span of the soft-maxlength
 * @param {Element} input
 * @returns {string} to display in the span
 */
function setStyles(remaining, span, input) {
  if (remaining > 0) {
    toggleClass(false, span, input);
    return 'Remaining: ' + remaining;
  } else if (remaining === 0) {
    toggleClass(false, span, input);
    return 'At the character limit';
  } else if (remaining === -1) {
    toggleClass(true, span, input);
    return -remaining + ' character over the limit';
  } else {
    toggleClass(true, span, input);
    return -remaining + ' characters over the limit';
  }
}

function cleanValue(value) {
  var clean = striptags(value);

  clean = clean.replace(/(\u00a0|&nbsp;|&#160;)/ig, ' '); // remove &nbsp;
  return clean;
}

module.exports = function (result, args) {
  var el = result.el,
    bindings = result.bindings,
    rivets = result.rivets,
    tpl = `
      <span class="soft-maxlength">{ max | charsRemaining data.value }</span>
    `,
    span = dom.create(tpl);

  bindings.max = args.value;
  rivets.formatters.charsRemaining = function (max, value) {
    var length = cleanValue(value).length,
      remaining = max - length,
      input = getInput(el); // needs to happen after wysiwyg is instantiated

    return setStyles(remaining, span, input);
  };

  el.appendChild(span);
  return result;
};
