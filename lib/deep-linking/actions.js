import _ from 'lodash';
import { get } from '../core-data/groups';
import { find } from '@nymag/dom';
import { getComponentInstance } from 'clayutils';
import {
  getComponentName, refAttr, editAttr, getComponentByNameAndInstance, getLayoutNameAndInstance
} from '../utils/references';
import { UPDATE_HASH, CLEAR_HASH } from './mutationTypes';
import { TOGGLE_EDIT_MODE } from '../toolbar/mutationTypes';
import { isComponentInPage } from '../utils/component-elements';
import label from '../utils/label';

/**
 * @module deep-linking
 */

export function checkHashedForm(store, urlProps) {
  // If we've got `urlProps`, let's access them
  let {
    component = null, instance = null, path = null, initialFocus = null
  } = urlProps;

  // Get the URI and grab the component element based on the name
  // of the component and the instance name
  const foundComponent = getComponentByNameAndInstance(store, component, instance);

  if (!foundComponent) {
    return null; // if the hash in the url doesn't result in a found component, return null to avoid an error being thrown
  } else {
    return openHashedForm(store, foundComponent, path, initialFocus);
  }
}

export function openHashedForm(store, foundComponent, path, initialFocus) {
  let uri = foundComponent.uri,
    el = foundComponent.el,
    groupEl = null,
    group = get(uri, path); // Get the group from the schema with the `path`

  // get user permissions
  // note: as clay always opens pages in page edit mode (not layout),
  // we'll have to switch modes if the deep link is to a layout component
  // (and the user has permission to edit it)
  const isAdmin = _.get(store, 'state.user.auth') === 'admin';

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
    // el is in the body, not the head. check to see if we have permission to edit it
    const isPageComponent = isComponentInPage(uri);

    if (!isPageComponent && !isAdmin) {
      // layout component that cannot be edited! display a warning to the user
      const name = label(getComponentName(uri));

      store.dispatch('addAlert', { type: 'error', text: `You do not have permission to edit this "${name}". Please contact an admin for assistance.` });

      return; // don't proceed with opening the form
    } else if (!isPageComponent && isAdmin) {
      // layout component that can be edited! switch to layout mode and continue opening the form
      const { message } = getLayoutNameAndInstance(store);

      store.commit(TOGGLE_EDIT_MODE, 'layout');
      store.dispatch('addAlert', { type: 'warning', text: message });
    }

    // el is in the body, not the head. select it!
    store.dispatch('select', el);
  }

  // If we have a uri, an element and a path then we can open the form
  if (uri && path) {
    return store.dispatch('focus', {
      uri, path, initialFocus, el: groupEl || el, offset: 0
    });
  } else {
    return true;
  }
}

export function openClayMenu(store, urlProps) {
  return store.dispatch('openDrawer', urlProps);
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
    return checkHashedForm(store, urlProps);
  } else {
    return openClayMenu(store, urlProps.tab);
  }
}

/**
 * set hash in window and store
 * @param  {function} commit
 * @param  {string} [uri]
 * @param  {string} [path]
 * @param  {string} [initialFocus]
 * @param {object} [menu]
 */
export function setHash({ commit }, {
  uri, path, initialFocus, menu
}) {
  let urlObj,
    hashString;

  if (uri && path) {
    // set hash for a form

    const component = getComponentName(uri),
      instance = getComponentInstance(uri);

    urlObj = {
      component, instance, path, initialFocus
    };
    hashString = `#${component}~${instance}~${path}${initialFocus ? '~' + initialFocus : ''}`;
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
