const dom = require('@nymag/dom');

module.exports = function () {
  var toolbar = dom.find('.kiln-toolbar');

  return toolbar && toolbar.getAttribute('data-components') && toolbar.getAttribute('data-components').split(',').sort() || [];
};
