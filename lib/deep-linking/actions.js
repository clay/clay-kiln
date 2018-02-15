import _ from 'lodash';
import { get } from '../core-data/groups';
import { find } from '@nymag/dom';
import { refAttr, editAttr, getComponentName, getComponentInstance, getComponentByNameAndInstance } from '../utils/references';
import { UPDATE_HASH, CLEAR_HASH } from './mutationTypes';

/**
 * @module deep-linking
 */

function openHashedForm(store, urlProps) {
  let component, instance, path, foundComponent, uri, el, group, groupEl;

  // If we've got `urlProps`, let's access them
  component = _.get(urlProps, 'component', null);
  instance = _.get(urlProps, 'instance', null);
  path = _.get(urlProps, 'path', null);

  // Get the URI and grab the component element based on the name
  // of the component and the instance name
  foundComponent = getComponentByNameAndInstance(component, instance);
  uri = foundComponent.uri;
  el = foundComponent.el;

  // Get the group from the schema with the `path`
  group = get(uri, path);

  // If it's an inline wysiwyg we need to open the form on the
  // element with `data-editable`, not the component itself
  if (_.get(group, 'schema._has.input') === 'inline') {
    if (el.getAttribute(editAttr) === path) {
      groupEl = el;
    } else {
      groupEl = find(el, `[${editAttr}="${path}"]`);
    }
  }

  if (find(`[${refAttr}="${uri}"]`) && el) {
    // el is in the body, not the head. select it!
    store.dispatch('select', el);
  }

  // If we have a uri, an element and a path then we can open the form
  if (uri && path) {
    return store.dispatch('focus', { uri, path, el: groupEl || el, offset: 0 });
  }
}

function openClayMenu(store, urlProps) {
  return store.dispatch('openNav', urlProps);
}

/**
 * parse url hash, opening form or clay menu as necessary
 * @param  {object} store
 * @return {Promise}
 */
export function parseURLHash(store) {
  let urlProps = _.get(store, 'state.url');

  if (!urlProps) {
    return;
  }

  if (urlProps.component) {
    return openHashedForm(store, urlProps);
  } else {
    return openClayMenu(store, urlProps);
  }
}

/**
 * set hash in window and store
 * @param  {function} commit
 * @param  {string} [uri]
 * @param  {string} [path]
 * @param {object} [menu]
 */
export function setHash({ commit }, { uri, path, menu }) {
  let urlObj, hashString;

  if (uri && path) {
    // set hash for a form
    const component = getComponentName(uri),
      instance = getComponentInstance(uri);

    urlObj = { component, instance, path };
    hashString = `#${component}~${instance}~${path}`;
  } else if (menu) {
    // set has for the clay menu
    urlObj = {
      tab: menu.tab,
      sites: menu.sites,
      status: menu.status,
      query: menu.query
    };
    hashString = `#kiln~${urlObj.tab}~${urlObj.sites}~${urlObj.status}${urlObj.query ? '~' + urlObj.query : ''}`;
  }

  // Set the hash on the window
  window.history.replaceState(null, null, hashString);

  commit(UPDATE_HASH, urlObj);
}

/**
 * clear hash in window and store
 * @param  {function} commit
 */
export function clearHash({ commit }) {
  // Clear the hash on the window
  window.history.replaceState(null, null, '#');

  commit(CLEAR_HASH);
}
