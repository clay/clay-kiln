var _ = require('lodash'),
  references = require('../services/references'),
  events = require('../services/events'),
  dom = require('../services/dom');

function create(items) {
  var root = dom.create(`
      <section class="descriptive-dropdown">
        <header>
          <button class="close button-small">Close</button>
          <button class="settings button-small">Settings</button>
          <span>Please change:</span>
        </header>
        <ul></ul>
        <footer></footer>
      </section>`),
    list = dom.find(root, 'ul');

  _.each(items, function (item) {
    var itemEl = dom.create(`
        <li>
          <span class="name">${item.rule.label}</span>
          <span class="description">${item.rule.description}</span>
          <ul></ul>
        </li>`),
      itemList = dom.find(itemEl, 'ul');

    _.each(item.errors, function (error) {
      var componentName = references.getComponentNameFromReference(error.ref);
      itemList.append(dom.create(`
        <li>
          <span class="error-ref">${componentName}</span>
          <span class="error-field-name">${error.fieldName}</span>
        </li>`));
    });

    list.appendChild(itemEl);
  });



  return root;
}

function ValidationDropdown(parentEl, errors) {
  var el = create(errors);

  events.add(el, {
    '.close click': 'onClose',
    '.settings click': 'onSettings'
  }, this);

  parentEl = dom.find(parentEl, '.editor-toolbar-inner') || parentEl;
  parentEl.appendChild(el);

  this.el = el;
}

ValidationDropdown.prototype = {

  remove: function () {
    var el = this.el;

    el.parentNode.removeChild(el);
  },

  onClose: function (e) {
    console.log('onClose', e);

    this.remove();
  },

  onSettings: function (e) {
    console.log('onSettings', e);
  }
};

module.exports = ValidationDropdown;
