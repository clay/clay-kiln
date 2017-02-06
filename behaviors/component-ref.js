var dom = require('@nymag/dom'),
  references = require('../services/references');

import _ from 'lodash';

/**
 * find components with matching selector
 * note: this gives users a lot of flexibility, but 99% of the time you want to search on the name
 * @param {string} selector
 * @returns {array} array of uris
 */
function findElementsWithSelector(selector) {
  return _.map(document.querySelectorAll(selector), function (el) {
    return el.getAttribute(references.referenceAttribute);
  });
}

function selectorFromName(name) {
  return '[data-uri*="/components/' + name + '/"]';
}

function componentWithName(name) {
  return '/components/' + name + '/';
}

function getUriFromComment(str) {
  var match = str.match(/data-uri="(.*?)"/);

  return match && match[1];
}

/**
 * find components with matching name
 * @param {string} name
 * @returns {array} array of uris
 */
function findElementsWithName(name) {
  return findElementsWithSelector(selectorFromName(name));
}

function findCommentsWithName(name) {
  var matches = [],
    walker = document.createTreeWalker(document.head, NodeFilter.SHOW_COMMENT),
    node;

  while (node = walker.nextNode()) {
    if (_.includes(node.data, componentWithName(name)) && getUriFromComment(node.data)) {
      matches.push(getUriFromComment(node.data));
    }
  }

  return matches;
}

/**
 * Append hidden field to enable component instances to affect other component instances
 * e.g. article affecting the page title
 * @param {{name: string, bindings: {}, el: Element}} result
 * @param {{selector: string}} args     args.selector is the query selector that matches the components to affect.
 * @returns {{}}
 */
module.exports = function (result, args) {
  var hiddenInput,
    name = result.name;

  if (args.selector) {
    result.bindings.data = findElementsWithSelector(args.selector);
  } else if (args.name) {
    result.bindings.data = findElementsWithName(args.name).concat(findCommentsWithName(args.name));
  }

  hiddenInput = dom.create(`<input type="hidden" class="input-text" rv-field="${name}" rv-value="${name}.data">`);
  result.el.appendChild(hiddenInput);
  return result;
};
