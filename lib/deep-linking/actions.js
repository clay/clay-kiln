import _ from 'lodash';
import { get } from '../core-data/groups';
import dom from '@nymag/dom';
import store from '../core-data/store';
import { getSchema } from '../core-data/components';
import { displayProp, editAttr, getComponentByNameAndInstance as getComponent } from '../utils/references';

export function openHashedForm(store) {
  var urlProps = _.get(store, 'state.url'),
    component, instance, path, group, display, groupEl;

  if (!urlProps) {
    return;
  }

  // If we've got `urlProps`, let's access them
  component = _.get(urlProps, 'component', null);
  instance = _.get(urlProps, 'instance', null);
  path = _.get(urlProps, 'path', null);

  // Get the URI and grab the component element based on the name
  // of the component and the instance name
  var { uri, el } = getComponent(component, instance);
  // Get the group from the schema with the `path`
  group = get(uri, path);
  // Find out what the display value is
  display = _.get(group, `schema.${displayProp}`) || 'overlay';

  // If the display is `inline` we need to open the form on the
  // element with `data-editable`, not the component itself
  if (display === 'inline') {
    groupEl = dom.find(el, `[${editAttr}="${path}"]`);
  }

  // If we have a uri, an element and a path then we can open the form
  if (uri && el && path) {
    return store.dispatch('focus', { uri, path, el: groupEl || el, offset: 0 }) // Focus on component
      .then(() => store.dispatch('select', el)); // Then select it
  }
}
