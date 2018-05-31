import expect from 'expect';
import lib from './mutations';
import { UPDATE_PAGE, REVERT_PAGE, RENDER_PAGE, PAGE_PUBLISH, PAGE_SCHEDULE, PAGE_UNPUBLISH, PAGE_UNSCHEDULE } from './mutationTypes';

const data = {
    foo: 'bar'
  },
  oldData = {
    foo: 'baz'
  },
  url = 'http://domain.com/foo',
  date = new Date();

define('page data mutations', () => {
  test('updates page', () => {
    expect(lib[UPDATE_PAGE]({}, data)).to.eql({ page: { data } });
  });

  test('reverts page', () => {
    expect(lib[REVERT_PAGE]({ page: { data } }, oldData)).to.eql({ page: { data: oldData }});
  });

  test(
    'renders page',
    () => expect(lib[RENDER_PAGE]({ page: { data }})).to.eql({ page: { data }})
  );

  test('publishes page', () => {
    expect(lib[PAGE_PUBLISH]({}, { url, date })).to.eql({ page: { state: { published: true, publishTime: date, url: url }}});
  });

  test('schedules page', () => {
    expect(lib[PAGE_SCHEDULE]({}, { date })).to.eql({ page: { state: { scheduled: true, scheduledTime: date }}});
  });

  test('unpublishes page', () => {
    expect(lib[PAGE_UNPUBLISH]({ page: { state: { published: true, publishTime: date, url: url }}})).to.eql({ page: { state: { published: false, publishTime: null, url: null }}});
  });

  test('unschedules page', () => {
    expect(lib[PAGE_UNSCHEDULE]({ page: { state: { scheduled: true, scheduledTime: date }}})).to.eql({ page: { state: { scheduled: false, scheduledTime: null }}});
  });
});
