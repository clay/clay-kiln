import { reduce } from 'lodash';
import { refProp } from './references';
import lib from './deep-reduce';

const ref = 'domain.com/_components/foo',
  component = {
    [refProp]: ref,
    a: 'b'
  },
  compose = (obj) => (str, data) => obj[str] = data;

describe('deep reduce', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('calls fn when it finds a component', () => {
    let obj = {};

    reduce([component], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).to.deep.equal({ [ref]: component });
  });

  it('does not call fn on non-component refs', () => {
    let obj = {};

    reduce([{ [refProp]: 'domain.com/_pages/foo' }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).to.deep.equal({});
  });

  it('does not call fn on ignored root-level keys', () => {
    let obj = {};

    reduce([{ locals: component }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).to.deep.equal({});
  });

  // note: keys beginning with underscores are metadata, e.g. _layoutRef, _components
  it('does not call fn on keys beginning with underscores', () => {
    let obj = {};

    reduce([{ _components: component }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).to.deep.equal({});
  });

  it('calls fn on ignored non-root-level keys', () => {
    let obj = {};

    reduce([{ cool_components: {
      [refProp]: ref,
      media: 'hi',
      a: 'b'
    }}], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).to.deep.equal({ [ref]: {
      [refProp]: ref,
      media: 'hi',
      a: 'b'
    }});
  });

  it('calls fn on keys containing underscores (not beginning)', () => {
    let obj = {};

    reduce([{ cool_components: component }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).to.deep.equal({ [ref]: component });
  });

  it('recursively calls itself on objects', () => {
    let obj = {};

    reduce([{ a: component }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).to.deep.equal({ [ref]: component });
  });

  it('recursively calls itself on arrays', () => {
    let obj = {};

    reduce([[component]], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).to.deep.equal({ [ref]: component });
  });
});
