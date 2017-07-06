import _ from 'lodash';
import { get } from '../core-data/groups';
import { find } from '@nymag/dom';
import { displayProp, refAttr, editAttr, getComponentName, getComponentInstance, getComponentByNameAndInstance } from '../utils/references';
import { UPDATE_HASH, CLEAR_HASH } from './mutationTypes';

export function openHashedForm(store) {
  let urlProps = _.get(store, 'state.url'),
    component, instance, path, foundComponent, uri, el, group, display, groupEl;

  if (!urlProps) {
    return;
  }

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
  // Find out what the display value is
  display = _.get(group, `schema.${displayProp}`) || 'overlay';

  // If the display is `inline` we need to open the form on the
  // element with `data-editable`, not the component itself
  if (display === 'inline') {
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
  if (uri && el && path) {
    return store.dispatch('focus', { uri, path, el: groupEl || el, offset: 0 });
  }
}

/**
 * set hash in window and store
 * @param  {function} commit
 * @param  {string} uri
 * @param  {string} path
 */
export function setHash({ commit }, { uri, path }) {
  const component = getComponentName(uri),
    instance = getComponentInstance(uri),
    urlObj = { component, instance, path },
    hashString = `#${component}~${instance}~${path}`;

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
