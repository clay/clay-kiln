import lib from './mutations';
import {
  UPDATE_PAGE, REVERT_PAGE, RENDER_PAGE, PAGE_PUBLISH, PAGE_SCHEDULE, PAGE_UNPUBLISH, PAGE_UNSCHEDULE
} from './mutationTypes';

const data = {
    foo: 'bar'
  },
  oldData = {
    foo: 'baz'
  },
  url = 'http://domain.com/foo',
  date = new Date();

describe('page data mutations', () => {
  test('updates page', () => {
    expect(lib[UPDATE_PAGE]({}, data)).toEqual({ page: { data } });
  });

  test('reverts page', () => {
    expect(lib[REVERT_PAGE]({ page: { data } }, oldData)).toEqual({ page: { data: oldData } });
  });

  test(
    'renders page',
    () => expect(lib[RENDER_PAGE]({ page: { data } })).toEqual({ page: { data } })
  );

  test('publishes page', () => {
    expect(lib[PAGE_PUBLISH]({}, { url, date })).toEqual({ page: { state: { published: true, publishTime: date, url: url } } });
  });

  test('schedules page', () => {
    expect(lib[PAGE_SCHEDULE]({}, { date })).toEqual({ page: { state: { scheduled: true, scheduledTime: date } } });
  });

  test('unpublishes page', () => {
    expect(lib[PAGE_UNPUBLISH]({ page: { state: { published: true, publishTime: date, url: url } } })).toEqual({ page: { state: { published: false, publishTime: null, url: null } } });
  });

  test('unschedules page', () => {
    expect(lib[PAGE_UNSCHEDULE]({ page: { state: { scheduled: true, scheduledTime: date } } })).toEqual({ page: { state: { scheduled: false, scheduledTime: null } } });
  });
});
