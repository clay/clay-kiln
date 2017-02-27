import store from '../core-data/store';

/**
 * Opens any pane with the specified data
 *
 * @param  {String} name      [Name of the pane]
 * @param  {String} title     [Title of the pane]
 * @param  {String} component [Component to include inside the pane]
 * @param  {Array}  content   [Array of content to fill the pane with]
 * @return {Promise}
 */
export function openPane(name, title, component, content) {
  return store.dispatch('openPane', {
    name,
    options: {
      title,
      component,
      content
    }
  });
}

/**
 * Changes UI to any pane with the name, title, component,
 * and content specified.
 *
 * @param  {String} name      [Name of the pane]
 * @param  {String} title     [Title of the pane]
 * @param  {String} component [Component to include inside the pane]
 * @param  {Array}  content   [Array of content to fill the pane with]
 * @return {Promise}
 */
export function changePane(name, title, component, content) {
  return store.dispatch('changePane', {
    name,
    options: {
      title,
      component,
      content
    }
  });
}

/**
 * Closes any open pane
 * @return {Promise}
 */
export function closePane() {
  return store.dispatch('closePane');
}

/**
 * Open an `Add Component` pane. Requires the
 * array of component strings which can be included
 * from a component's schema
 *
 * @param {Array} content
 */
export function addComponentPane(content) {
  return store.dispatch('openPane', {
    name: 'add-component',
    options: {
      title: 'Add Component',
      component: 'add-component',
      content
    }
  });
}

