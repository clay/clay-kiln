import _ from 'lodash';
import lib from './available-components';

describe('available components', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(_, 'get').returns('testSite');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('works for empty array', () => {
    expect(lib([])).to.eql([]);
  });

  it('works when excluding nothing', () => {
    expect(lib(['foo'])).to.eql(['foo']);
  });

  it('works when excluding empty array', () => {
    expect(lib(['foo'], [])).to.eql(['foo']);
  });

  it('works when excluding stuff', () => {
    expect(lib(['foo'], ['bar'])).to.eql(['foo']);
  });

  it('allows components included on current site', () => {
    expect(lib(['foo (testSite)'])).to.eql(['foo']);
    expect(lib(['foo (testSite, otherSite)'])).to.eql(['foo']);
  });

  it('disallows components not included on current site', () => {
    expect(lib(['foo (otherSite)'])).to.eql([]);
  });

  it('disallows components excluded from current site', () => {
    expect(lib(['foo (not:testSite)'])).to.eql([]);
    expect(lib(['foo (not: testSite)'])).to.eql([]);
  });

  it('disallows components included on current site, but in exclude list', () => {
    expect(lib(['foo (testSite)'], ['foo'])).to.eql([]);
  });

  it('disallows components included but also excluded from current site', () => {
    expect(lib(['foo (testSite, otherSite, not:testSite)'])).to.eql([]);
  });
});
