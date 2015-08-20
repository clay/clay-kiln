function DefaultFixture() {
  return {
    el: document.createDocumentFragment(),
    bindings: { label: 'Foo', name: 'foo', data: {} },
    binders: {},
    formatters: {},
    name: 'foo'
  };
}

module.exports = DefaultFixture;
