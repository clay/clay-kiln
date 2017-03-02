import _ from 'lodash';
import { PAGE_SAVE_PENDING, PAGE_SAVE_FAILURE, PAGE_PUBLISH, PAGE_SCHEDULE, PAGE_UNPUBLISH, PAGE_UNSCHEDULE } from './mutationTypes';

export default {
  [PAGE_SAVE_PENDING]: (state, data) => {
    _.set(state, 'page.data', data);
    return state;
  },
  [PAGE_SAVE_FAILURE]: (state, oldData) => {
    _.set(state, 'page.data', oldData);
    // todo: set something that shows the error
    return state;
  },
  [PAGE_PUBLISH]: (state, { url, date }) => {
    _.set(state, 'page.state.published', true);
    _.set(state, 'page.state.publishedUrl', url);
    _.set(state, 'page.state.publishedAt', date);
    return state;
  },
  [PAGE_SCHEDULE]: (state, { date }) => {
    _.set(state, 'page.state.scheduled', true);
    _.set(state, 'page.state.scheduledAt', date);
    return state;
  },
  [PAGE_UNPUBLISH]: (state) => {
    _.set(state, 'page.state.published', false);
    _.set(state, 'page.state.publishedUrl', null);
    _.set(state, 'page.state.publishedAt', null);
    return state;
  },
  [PAGE_UNSCHEDULE]: (state) => {
    _.set(state, 'page.state.scheduled', false);
    _.set(state, 'page.state.scheduledAt', null);
    return state;
  }
};
