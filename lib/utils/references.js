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

/**
 * replace version in uri
 * @param  {string} uri
 * @param  {string} [version] defaults to latest
 * @return {string}
 */
export function replaceVersion(uri, version) {
  if (!_.isString(uri)) {
    throw new TypeError('Uri must be a string, not ' + typeof uri);
  }

  if (version) {
    return uri.split('@')[0] + '@' + version;
  } else {
    // no version is still a kind of version
    return uri.split('@')[0];
  }
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
export const nameProp = '_name';
export const behaviorKey = 'fn'; // used to look up behavior function
// api routes, extensions, and headers
export const componentRoute = '/components/';
export const pagesRoute = '/pages/';
export const urisRoute = '/uris/';
export const usersRoute = '/users/';
export const schemaRoute = '/schema'; // no ending slash
export const htmlExt = '.html';
export const editExt = '?edit=true&sitecss=false&js=false'; // ask for edit mode html from the server, sans js or site css
export const hooksExt = '?componenthooks=false'; // flag to disable running component save()/render() hooks on the server
export const userHeader = 'X-Clay-User';
export const contentHeader = 'Content-Type';
export const contentJSON = 'application/json; charset=UTF-8';
export const contentText = 'text/plain; charset=UTF-8';
/* eslint-enable one-var */
