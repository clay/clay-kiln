'use strict';
module.exports = {
  referenceAttribute: 'data-ref',
  componentListAttribute: 'data-component-list-name',
  componentMarkdownAttribute: 'data-component-markdown-name',
  referenceProperty: '_ref',
  typeProperty: '_type',
  displayProperty: '_display',

  // utility methods

  /**
   * Takes a url path, and returns the component name within it.
   * @param {string} ref
   * @returns {string}
   * @example /components/base  returns base
   * @example /components/text/instances/0  returns text
   * @example /components/image.html  returns image
   */
  getComponentNameFromReference(ref) {
    var result = /components\/(.+?)[\/\.]/.exec(ref) || /components\/(.*)/.exec(ref);
    return result && result[1];
  },

  getInstanceIdFromReference(ref) {
    var result = /\/components\/.+?\/instances\/(.+)/.exec(ref);
    return result && result[1];
  }
};