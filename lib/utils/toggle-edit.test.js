import lib from './toggle-edit';

const domain = 'http://domain.com',
  edit = 'edit=true',
  otherQuery = '?foo=bar';

describe('toggle edit', () => {
  let location = {},
    sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    location.assign = sandbox.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('adds ?edit=true to the url', () => {
    const stub = Object.assign({ href: domain }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(`${domain}?${edit}`);
  });

  it('removes ?edit=true to the url', () => {
    const stub = Object.assign({ href: `${domain}?${edit}` }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(`${domain}`);
  });

  it('adds &edit=true to the url', () => {
    const stub = Object.assign({ href: `${domain}${otherQuery}` }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(`${domain}${otherQuery}&${edit}`);
  });

  it('removes &edit=true to the url', () => {
    const stub = Object.assign({ href: `${domain}${otherQuery}&${edit}` }, location);

    lib(stub);
    expect(stub.assign).to.have.been.calledWith(`${domain}${otherQuery}`);
  });
});
