import _ from 'lodash';
import dom from '@nymag/dom';
import store from '../core-data/store';

/**
 * determine if a uri points to a component
 * @param  {string}  uri
 * @return {Boolean}
 */
export function isComponent(uri) {
  return _.includes(uri, '/components/');
}

/**
 * determine if a uri points to a DEFAULT instance of a component
 * @param  {string}  uri
 * @return {Boolean}
 */
export function isDefaultComponent(uri) {
  return !!uri.match(/\/components\/[A-Za-z0-9\-]+$/);
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

export function getComponentVersion(uri) {
  const result = /\/components\/.+?@(.+)/.exec(uri);

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

/**
 * Grab an element in the DOM when you know the name of the
 * component and the instance of the component.
 *
 * @param  {String} name
 * @param  {String} instance
 * @return {Object|Null}
 */
export function getComponentByNameAndInstance(name, instance) {
  var sitePrefix = _.get(store, 'state.site.prefix', null),
    uri;

  if (name && instance && sitePrefix) {
    uri = `${sitePrefix}/components/${name}/instances/${instance}`;

    return {
      uri,
      el: dom.find(`[${refAttr}="${uri}"]`)
    };
  }

  return null;
}

// it's easier to export and declare these in single lines
/* eslint-disable one-var */
// attributes
export const refAttr = 'data-uri'; // indicated root el of a component. value is the _ref or _self of the component
export const editAttr = 'data-editable'; // indicates el is editable when clicked. value is path to data
export const placeholderAttr = 'data-placeholder'; // indicates el should have placeholder, but is NOT editable when clicked
export const layoutAttr = 'data-layout-uri'; // set on <html> element, points to the layout when data-uri points to the page
export const hiddenAttr = 'data-kiln-hidden';
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
export const pubProp = '_publish';
export const subProp = '_subscribe';
export const behaviorKey = 'fn'; // used to look up behavior function
// api routes, extensions, and headers
export const componentRoute = '/components/';
export const pagesRoute = '/pages/';
export const urisRoute = '/uris/';
export const usersRoute = '/users/';
export const scheduleRoute = '/schedule'; // no ending slash
export const schemaRoute = '/schema'; // no ending slash
export const instancesRoute = '/instances'; // no ending slash
export const htmlExt = '.html';
export const editExt = '?edit=true';
export const editComponentExt = `${editExt}&sitecss=false&js=false`; // ask for edit mode html from the server, sans js or site css
export const hooksExt = '?componenthooks=false'; // flag to disable running component save()/render() hooks on the server
export const userHeader = 'X-Clay-User';
export const contentHeader = 'Content-Type';
export const contentJSON = 'application/json; charset=UTF-8';
export const contentText = 'text/plain; charset=UTF-8';
// reused classes
export const componentListClass = 'component-list-inner';
export const componentPropClass = 'component-prop-wrapper';
export const pageAreaClass = 'kiln-page-area';
export const overlayClass = 'iframe-overlay';
export const selectorClass = 'mini-selector';
export const wrappedClass = 'hidden-wrapped';
export const inlineFormClass = 'editor-inline';
export const fieldClass = 'kiln-field';
export const firstFieldClass = 'first-field';
export const mainBehaviorClass = 'field-main';
export const placeholderClass = 'kiln-placeholder';
export const permanentPlaceholderClass = 'kiln-permanent-placeholder';
export const dropAreaClass = 'dragula-drop-area';
export const dragItemClass = 'dragula-item';
export const dragItemUnsavedClass = 'dragula-not-saved';
// colors (note: update these if they change in the styleguide)
export const draftColor = '#c8b585';
export const scheduledColor = '#d29c31';
export const publishedColor = '#599f61';
export const offlineColor = '#888';
export const errorColor = '#a86667';
export const saveColor = '#229ed3';
/* eslint-enable one-var */
