import _ from 'lodash';

/**
 * determine if a uri points to a component
 * @param  {string}  uri
 * @return {Boolean}
 */
export function isComponent(uri) {
  return _.includes(uri, '/components/');
}

/**
 * get component name from uri
 * @example /components/base  returns base
 * @example /components/text/instances/0  returns text
 * @example /components/image.html  returns image
 * @param  {string} uri
 * @return {string|null}
 */
export function getComponentName(uri) {
  const result = /components\/(.+?)[\/\.]/.exec(uri) || /components\/(.*)/.exec(uri);

  return result && result[1];
}

/**
 * get component instance from uri
 * @param  {string} uri
 * @return {string|null}
 */
export function getComponentInstance(uri) {
  const result = /\/components\/.+?\/instances\/([^\.@]+)/.exec(uri);

  return result && result[1];
}

// it's easier to export and declare these in single lines
/* eslint-disable one-var */
// attributes
export const refAttr = 'data-uri'; // indicated root el of a component. value is the _ref or _self of the component
export const editAttr = 'data-editable'; // indicates el is editable when clicked. value is path to data
export const placeholderAttr = 'data-placeholder'; // indicates el should have placeholder, but is NOT editable when clicked
// properties
export const refProp = '_ref';
export const fieldProp = '_has'; // used to determine if a node (in the schema) is a field
export const componentListProp = '_componentList';
export const componentProp = '_component';
export const displayProp = '_display';
export const placeholderProp = '_placeholder';
export const labelProp = '_label';
export const groupsProp = '_groups';
export const descProp = '_description';
export const behaviorKey = 'fn'; // used to look up behavior function
/* eslint-enable one-var */
