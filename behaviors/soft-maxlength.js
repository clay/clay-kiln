/*
Soft Maxlength arguments

value {number} maximum number of characters allowed
 */

var striptags = require('striptags'),
  dom = require('../services/dom');

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
    var length = striptags(value).length,
      remaining = max - length;

    if (remaining > 0) {
      span.classList.remove('too-long');
      return 'Remaining: ' + remaining;
    } else if (remaining === 0) {
      span.classList.remove('too-long');
      return 'At the character limit';
    } else if (remaining === -1) {
      span.classList.add('too-long');
      return -remaining + ' character over the limit';
    } else {
      span.classList.add('too-long');
      return -remaining + ' characters over the limit';
    }
  };

  el.appendChild(span);
  return result;
};
