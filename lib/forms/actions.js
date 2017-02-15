import _ from 'lodash';
import { get } from '../core-data/groups';
import { displayProp } from '../utils/references';
import { inline } from './create';
import { OPEN_FORM, CLOSE_FORM } from './mutationTypes';

export function openForm(store, { uri, path, el }) {
  const group = get(uri, path),
    display = _.get(group, `schema.${displayProp}`) || 'overlay'; // defaults to overlay if not specified

  // send the data to state.ui.currentForm!
  // this is needed for inline forms to render,
  // and will AUTOMAGICALLY make overlay/settings forms appear
  store.commit(OPEN_FORM, { uri, path, fields: _.cloneDeep(group.fields), schema: group.schema });

  if (display === 'inline') {
    // create an inline form
    inline(uri, path, el);
  }
}

export function closeForm(store) {
  console.log('close form!')
  return Promise.resolve().then(() => store.commit(CLOSE_FORM));
}
