import _ from 'lodash';
import { UPDATE_COMPONENT, REMOVE_COMPONENT, CREATE_COMPONENTS } from '../component-data/mutationTypes';
import { UPDATE_PAGE } from '../page-data/mutationTypes';
import { OPEN_DRAWER } from '../drawers/mutationTypes';
const relevantMutations = [
    UPDATE_COMPONENT,
    OPEN_DRAWER,
    REMOVE_COMPONENT,
    CREATE_COMPONENTS,
    UPDATE_PAGE
  ],
  relevantDrawers = ['health', 'publish'],
  validate = _.debounce(store => store.dispatch('validate'), 250);

export default (store) => {
  store.subscribe(({type}, state) => {

    // only revalidate if publish or health drawer is open
    if (!relevantDrawers.includes(_.get(state, 'ui.currentDrawer'))) return;

    // only revalidate on mutations we care about
    if (!relevantMutations.includes(type)) return;

    validate(store);
  });
};
