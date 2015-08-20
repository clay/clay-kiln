/**
 * pass in the data you want
 * @param {object|array} [data]
 * @returns {object}
 */
function DefaultFixture(data) {
  return {
    el: document.createDocumentFragment(),
    bindings: {
      label: 'Foo',
      name: 'foo',
      data: data || {}
    },
    binders: {},
    formatters: {},
    name: 'foo'
  };
}

module.exports = DefaultFixture;
