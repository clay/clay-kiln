import _ from 'lodash';
import { findAll } from '@nymag/dom';
import store from '../core-data/store';
import { getComponentName, refAttr } from '../utils/references';
import { addSelector } from './select';


/**
 * decorate components
 * add selector, placeholders, etc
 * @param  {string} uri
 */
export function decorate(uri) {
  const schema = _.get(store, `state.schemas["${getComponentName(uri)}"]`),
    els = findAll(`[${refAttr}="${uri}"]`);

  if (els) {
    _.each(els, (el) => {
      addSelector(uri, el);
    });
  }
}


export function decorateAll() {
  const components = _.get(store, 'state.components');

  if (components) {
    _.forOwn(components, (val, key) => decorate(key, val));
  }
}
