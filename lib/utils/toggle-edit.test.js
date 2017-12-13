import lib from './toggle-edit';

const host = 'domain.com',
  edit = 'edit=true',
  otherQuery = '?foo=bar',
  prefix = `http://${host}`;

describe('toggle edit', () => {
  let location = { protocol: 'http:', pathname: '', host },
    sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    location.assign = sandbox.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('adds ?edit=true to the url', () => {
    const stub = Object.assign({ search: '' }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(`${prefix}?${edit}`);
  });

  it('removes ?edit=true to the url', () => {
    const stub = Object.assign({ search: `?${edit}` }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(prefix);
  });

  it('adds &edit=true to the url', () => {
    const stub = Object.assign({ search: otherQuery }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(`${prefix}${otherQuery}&${edit}`);
  });

  it('removes &edit=true to the url', () => {
    const stub = Object.assign({ search: `${otherQuery}&${edit}` }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(`${prefix}${otherQuery}`);
  });

  it('strips url fragments when entering edit mode', () => {
    const stub = Object.assign({ search: '', hash: 'foo' }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(`${prefix}?${edit}`);
  });

  it('strips url fragments when leaving edit mode', () => {
    const stub = Object.assign({ search: `?${edit}`, hash: 'foo' }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(prefix);
  });
});
