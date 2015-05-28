'use strict';
var rivets = require('rivets'),
  defaults = {
    el: document.createDocumentFragment(),
    bindings: {
      data: 'foobar',
      name: 'foo',
      path: 'foo',
      label: 'Foo'
    },
    rivets: rivets
  };

module.exports = defaults;