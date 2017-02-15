import _ from 'lodash';
import { get } from '../core-data/groups';
import { displayProp } from '../utils/references';
import { inline, overlay } from './create';
import { OPEN_FORM, CLOSE_FORM } from './mutationTypes';

export function openForm(store, { uri, path, el }) {
  console.log('open form!')
  const group = get(uri, path),
    display = _.get(group, `schema.${displayProp}`) || 'overlay'; // defaults to overlay if not specified

  let promise;

  if (display === 'inline') {
    // create an inline form
    promise = inline(uri, path, el);
  } else {
    // create overlay or settings form
    promise = overlay(uri, path);
  }

  return promise.then(() => {
    store.commit(OPEN_FORM, { uri, path, fields: _.cloneDeep(group.fields), schema: group.schema });
  });
}

export function closeForm(store) {
  console.log('close form!')
  return Promise.resolve().then(() => store.commit(CLOSE_FORM));
}
