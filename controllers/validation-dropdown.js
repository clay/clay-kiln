var _ = require('lodash'),
  references = require('../services/references'),
  events = require('../services/events'),
  dom = require('../services/dom'),
  site = require('../services/site');

function withProperties(obj, list, fn) {
  var args = [],
    missing = _.any(list, function (prop) {
      var value = _.get(obj, prop);

      if (value === undefined || value === null) {
        console.warn('Missing', prop, obj);
        return true;
      }
      args.push(value);
    });

  if (!missing) {
    return fn.apply(null, args);
  }
}

function getMediaPrefix() {
  return site.addProtocol(site.addPort(site.get('prefix')));
}

function getFirstListElement(el) {
  return dom.find(el, 'ul,li');
}

function createContainerElement() {
  var prefix = getMediaPrefix();

  return dom.create(`
    <section class="validation-dropdown">
      <header class="row">
          <img src="${prefix}/media/components/clay-kiln/stop-sign-white.svg">
          <span>This story is missing things needed to publish. Address the following and try again.</span>
      </header>
      <ul></ul>
      <footer class="row"><span class="button-container"><button class="close button-small">Close</button></span></footer>
    </section>`);
}

function createRuleElement(item) {
  return withProperties(item, ['rule.label', 'rule.description'], function (label, description) {
    return dom.create(`
      <li class="rule">
        <span class="name">${label}</span>
        <span class="description">${description}</span>
        <ul></ul>
      </li>`);
  });
}

function createErrorElement(error) {
  return withProperties(error, ['label', 'fieldName', 'preview'], function (ref, label, preview) {
    return dom.create(`
      <li class="error">
        <span class="name">${label}</span>
        <span class="preview">${preview}</span>
      </li>`);
  });
}

function create(items) {
  var containerEl = createContainerElement(),
    list = getFirstListElement(containerEl);

  _.each(items, function (item) {
    var ruleEl = createRuleElement(item),
      ruleList = getFirstListElement(ruleEl);

    _.each(item.errors, function (error) {
      var label, value, errorEl, errorList;

      errorEl = createErrorElement(error);
      errorList = getFirstListElement(errorEl) || errorEl;
      label = error.label;
      value = error.value;

      dom.prependChild(ruleList, errorEl);
    });

    list.appendChild(ruleEl);
  });

  return containerEl;
}

function ValidationDropdown(parentEl, errors) {
  var el = create(errors);

  events.add(el, {
    '.close click': 'onClose',
    '.settings click': 'onSettings'
  }, this);

  parentEl = dom.find(parentEl, '.kiln-toolbar-inner') || parentEl;
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
