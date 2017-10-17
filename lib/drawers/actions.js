import _ from 'lodash';
import { OPEN_DRAWER, CLOSE_DRAWER } from './mutationTypes';

export function toggleDrawer(store, name) {
  const currentDrawer = _.get(store, 'state.ui.currentDrawer'),
    currentName = currentDrawer && currentDrawer.name;

  if (currentName === name) {
    store.commit(CLOSE_DRAWER);
  } else {
    store.commit(OPEN_DRAWER, { name });
  }
}
