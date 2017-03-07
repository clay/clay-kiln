import lib from './mutations';
import { UPDATE_PAGE, REVERT_PAGE, PAGE_PUBLISH, PAGE_SCHEDULE, PAGE_UNPUBLISH, PAGE_UNSCHEDULE } from './mutationTypes';

const data = {
    foo: 'bar'
  },
  oldData = {
    foo: 'baz'
  },
  url = 'http://domain.com/foo',
  date = new Date();

define('page data mutations', () => {
  it('updates page', () => {
    expect(lib[UPDATE_PAGE]({}, data)).to.eql({ page: { data } });
  });

  it('reverts page', () => {
    expect(lib[REVERT_PAGE]({ page: { data } }, oldData)).to.eql({ page: { data: oldData }});
  });

  it('publishes page', () => {
    expect(lib[PAGE_PUBLISH]({}, { url, date })).to.eql({ page: { state: { published: true, publishedAt: date, publishedUrl: url }}});
  });

  it('schedules page', () => {
    expect(lib[PAGE_SCHEDULE]({}, { date })).to.eql({ page: { state: { scheduled: true, scheduledAt: date }}});
  });

  it('unpublishes page', () => {
    expect(lib[PAGE_UNPUBLISH]({ page: { state: { published: true, publishedAt: date, publishedUrl: url }}})).to.eql({ page: { state: { published: false, publishedAt: null, publishedUrl: null }}});
  });

  it('unschedules page', () => {
    expect(lib[PAGE_UNSCHEDULE]({ page: { state: { scheduled: true, scheduledAt: date }}})).to.eql({ page: { state: { scheduled: false, scheduledAt: null }}});
  });
});
