var striptags = require('striptags'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var el = result.el,
    bindings = result.bindings,
    rivets = result.rivets,
    tpl = `
      <span class="soft-maxlength">{ max | charsRemaining data }</span>
    `,
    span = dom.create(tpl);

  bindings.max = args.value;
  rivets.formatters.charsRemaining = function (max, data) {
    var length = parseInt(striptags(data.value).length),
      remaining = max - length;
      // input = dom.find(el, 'input'),
      // label = dom.find(el, '.label-inner').innerText;

    if (remaining > 0) {
      span.classList.remove('too-long');
      // input.setCustomValidity('');
      return remaining + ' characters remaining';
    } else if (remaining === 0) {
      span.classList.remove('too-long');
      // input.setCustomValidity('');
      return -remaining + ' characters over limit!';
    } else {
      span.classList.add('too-long');
      // input.setCustomValidity(label + ' is too long!');
      return -remaining + ' characters over limit!';
    }
  };

  dom.insertAfter(dom.find(el, '.label-inner'), span);
  return result;
};
