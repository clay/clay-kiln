module.exports = {
  editableAttribute: 'data-editable', // indicates el is editable when clicked. value is path to data
  placeholderAttribute: 'data-placeholder', // indicates el should have placeholder, but is NOT editable when clicked
  fieldAttribute: 'rv-field', // indicates el is a field in an open form. value is path to data + schema
  referenceAttribute: 'data-uri', // indicates el is the container of a component. value is _ref of component instance
  referenceProperty: '_ref',
  fieldProperty: '_has', // used to determine if a node (in the schema) is a field
  behaviorKey: 'fn', // used to look up behavior function
  displayProperty: '_display',
  placeholderProperty: '_placeholder',
  labelProperty: '_label',
  componentListProperty: '_componentList',
  groupsProperty: '_groups',
  descriptionProperty: '_description',

  // Status
  editingStatus: 'editing',

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
