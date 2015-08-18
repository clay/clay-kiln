var _ = require('lodash'),
  events = require('../services/events'),
  dom = require('../services/dom'),
  site = require('../services/site');

/**
 * Only run the function if the properties exist. Warn if they do not. Parameters of function are gotten properties.
 *
 * Does a deep0get.
 *
 * @param {object} obj
 * @param {[string]} list
 * @param {function} fn
 * @returns {*}
 */
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

/**
 * Get prefix to use for media.
 *
 * @returns {string}
 */
function getMediaPrefix() {
  return site.addProtocol(site.addPort(site.get('prefix')));
}

/**
 * Get the first list element within el.
 *
 * @param {Element} el  Container element.
 * @returns {Element}
 */
function getFirstListElement(el) {
  return dom.find(el, 'ul,li');
}

/**
 * Create an element to put all the data.
 *
 * @returns {Element}
 */
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

/**
 * Create an element to put all the data.  Can return nothing if missing data.
 *
 * @param {object} item
 * @returns {Element|null}
 */
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

/**
 * Create an element to put all the data.  Can return nothing if missing data.
 *
 * @param {object} error
 * @returns {Element|null}
 */
function createErrorElement(error) {
  return withProperties(error, ['label', 'preview'], function (label, preview) {
    return dom.create(`
      <li class="error">
        <span class="name">${label}</span>
        <span class="preview">${preview}</span>
      </li>`);
  });
}

/**
 * Create a validation dropdown given some items.
 *
 * @param {[object]} items
 * @returns {Element}
 */
function create(items) {
  var containerEl = createContainerElement(),
    list = getFirstListElement(containerEl);

  if (list) {
    _.each(items, function (item) {
      var ruleEl = createRuleElement(item),
        ruleList = ruleEl && getFirstListElement(ruleEl);

      if (ruleList) {
        _.each(item.errors, function (error) {
          var errorEl = createErrorElement(error);

          if (errorEl) {
            dom.prependChild(ruleList, errorEl);
          }
        });
      }

      if (ruleEl) {
        list.appendChild(ruleEl);
      }
    });
  }

  return containerEl;
}

/**
 * @param {Element} parentEl
 * @param {[object]} errors
 * @constructor
 */
function ValidationDropdown(parentEl, errors) {
  var el = create(errors);

  events.add(el, {
    '.close click': 'onClose'
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

  onClose: function () {
    this.remove();
  }
};

module.exports = ValidationDropdown;
