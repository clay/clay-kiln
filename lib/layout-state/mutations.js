import _ from 'lodash';
import { UPDATE_LAYOUT_STATE, SCHEDULE_LAYOUT, UNSCHEDULE_LAYOUT } from './mutationTypes';

export default {
  [UPDATE_LAYOUT_STATE]: (state, layoutState) => {
    state.layout = _.assign({}, state.layout, { state: layoutState });
    return state;
  },
  [SCHEDULE_LAYOUT]: (state, { date }) => {
    _.set(state, 'layout.state.scheduled', true);
    _.set(state, 'layout.state.scheduledTime', date);
    return state;
  },
  [UNSCHEDULE_LAYOUT]: (state) => {
    _.set(state, 'layout.state.scheduled', false);
    _.set(state, 'layout.state.scheduledTime', null);
  }
};
