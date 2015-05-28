'use strict';
var rivets = require('rivets'),
  defaults = {
    el: document.createDocumentFragment(),
    bindings: {
      data: null,
      name: 'foo',
      path: 'foo',
      label: 'Foo'
    },
    rivets: rivets
  };

module.exports = defaults;