import expect from 'expect';
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

  test('works for empty array', () => {
    expect(lib([])).to.eql([]);
  });

  test('works when excluding nothing', () => {
    expect(lib(['foo'])).to.eql(['foo']);
  });

  test('works when excluding empty array', () => {
    expect(lib(['foo'], [])).to.eql(['foo']);
  });

  test('works when excluding stuff', () => {
    expect(lib(['foo'], ['bar'])).to.eql(['foo']);
  });

  test('allows components included on current site', () => {
    expect(lib(['foo (testSite)'])).to.eql(['foo']);
    expect(lib(['foo (testSite, otherSite)'])).to.eql(['foo']);
  });

  test('disallows components not included on current site', () => {
    expect(lib(['foo (otherSite)'])).to.eql([]);
  });

  test('disallows components excluded from current site', () => {
    expect(lib(['foo (not:testSite)'])).to.eql([]);
    expect(lib(['foo (not: testSite)'])).to.eql([]);
  });

  test(
    'disallows components included on current site, but in exclude list',
    () => {
      expect(lib(['foo (testSite)'], ['foo'])).to.eql([]);
    }
  );

  test(
    'disallows components included but also excluded from current site',
    () => {
      expect(lib(['foo (testSite, otherSite, not:testSite)'])).to.eql([]);
    }
  );
});
