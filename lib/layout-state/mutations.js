import _ from 'lodash';
import { UPDATE_LAYOUT_STATE, SCHEDULE_LAYOUT, UNSCHEDULE_LAYOUT } from './mutationTypes';

export default {
  [UPDATE_LAYOUT_STATE]: (state, layoutState) => {
    state.layout = _.assign({}, state.layout, { state: layoutState });
    return state;
  }
};
