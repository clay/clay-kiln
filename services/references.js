module.exports = {
  componentAttribute: 'data-component',
  nameAttribute: 'name',
  referenceAttribute: 'data-ref',
  referenceProperty: '_ref',
  fieldProperty: '_has', // used to determine if a node is a field
  behaviorKey: 'fn', // used to look up behavior function
  displayProperty: '_display',
  placeholderProperty: '_placeholder',
  labelProperty: '_label',

  // utility methods

  /**
   * Takes a url path, and returns the component name within it.
   * @param {string} ref
   * @returns {string}
   * @example /components/base  returns base
   * @example /components/text/instances/0  returns text
   * @example /components/image.html  returns image
   */
  getComponentNameFromReference: function (ref) {
    var result = /components\/(.+?)[\/\.]/.exec(ref) || /components\/(.*)/.exec(ref);

    return result && result[1];
  },

  getInstanceIdFromReference: function (ref) {
    var result = /\/components\/.+?\/instances\/(.+)/.exec(ref);

    return result && result[1];
  }
};
