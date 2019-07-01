import lib from './toggle-edit';

const host = 'domain.com',
  edit = 'edit=true',
  otherQuery = '?foo=bar',
  prefix = `http://${host}`;

describe('toggle edit', () => {
  let location = {
    protocol: 'http:', pathname: '', host, assign: jest.fn()
  };

  test('adds ?edit=true to the url', () => {
    const stub = Object.assign({ search: '' }, location);

    lib(stub);
    expect(stub.assign).toHaveBeenCalledWith(`${prefix}?${edit}`);
  });

  test('removes ?edit=true to the url', () => {
    const stub = Object.assign({ search: `?${edit}` }, location);

    lib(stub);
    expect(stub.assign).toHaveBeenCalledWith(prefix);
  });

  test('adds &edit=true to the url', () => {
    const stub = Object.assign({ search: otherQuery }, location);

    lib(stub);
    expect(stub.assign).toHaveBeenCalledWith(`${prefix}${otherQuery}&${edit}`);
  });

  test('removes &edit=true to the url', () => {
    const stub = Object.assign({ search: `${otherQuery}&${edit}` }, location);

    lib(stub);
    expect(stub.assign).toHaveBeenCalledWith(`${prefix}${otherQuery}`);
  });

  test('strips url fragments when entering edit mode', () => {
    const stub = Object.assign({ search: '', hash: 'foo' }, location);

    lib(stub);
    expect(stub.assign).toHaveBeenCalledWith(`${prefix}?${edit}`);
  });

  test('strips url fragments when leaving edit mode', () => {
    const stub = Object.assign({ search: `?${edit}`, hash: 'foo' }, location);

    lib(stub);
    expect(stub.assign).toHaveBeenCalledWith(prefix);
  });
});
