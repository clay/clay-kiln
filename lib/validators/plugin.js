import _ from 'lodash';
import { validate } from './actions';
import { UPDATE_PAGE_STATE } from '../page-state/mutationTypes';
import { UPDATE_COMPONENT } from '../component-data/mutationTypes';
import { OPEN_DRAWER } from '../drawers/mutationTypes';
const relevantMutations = [UPDATE_PAGE_STATE, UPDATE_COMPONENT, OPEN_DRAWER],
  relevantDrawers = ['health', 'publish'];

export default (store) => {
  store.subscribe(({type}, state) => {

    // only revalidate on mutations we care about
    if (!relevantMutations.includes(type)) return;

    // only revalidate if publish or health drawer is open
    if (!relevantDrawers.includes(_.get(state, 'ui.currentDrawer'))) return;

    store.dispatch('validate');
  });
};
