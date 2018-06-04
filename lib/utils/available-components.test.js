import lib from './available-components';

describe('available components', () => {
  const store = {
    state: {
      site: {
        slug: 'testSite'
      }
    }
  };

  test('works for empty array', () => {
    expect(lib(store, [])).toEqual([]);
  });

  test('works when excluding nothing', () => {
    expect(lib(store, ['foo'])).toEqual(['foo']);
  });

  test('works when excluding empty array', () => {
    expect(lib(store, ['foo'], [])).toEqual(['foo']);
  });

  test('works when excluding stuff', () => {
    expect(lib(store, ['foo'], ['bar'])).toEqual(['foo']);
  });

  test('allows components included on current site', () => {
    expect(lib(store, ['foo (testSite)'])).toEqual(['foo']);
    expect(lib(store, ['foo (testSite, otherSite)'])).toEqual(['foo']);
  });

  test('disallows components not included on current site', () => {
    expect(lib(store, ['foo (otherSite)'])).toEqual([]);
  });

  test('disallows components excluded from current site', () => {
    expect(lib(store, ['foo (not:testSite)'])).toEqual([]);
    expect(lib(store, ['foo (not: testSite)'])).toEqual([]);
  });

  test(
    'disallows components included on current site, but in exclude list',
    () => {
      expect(lib(store, ['foo (testSite)'], ['foo'])).toEqual([]);
    }
  );

  test(
    'disallows components included but also excluded from current site',
    () => {
      expect(lib(store, ['foo (testSite, otherSite, not:testSite)'])).toEqual([]);
    }
  );
});
