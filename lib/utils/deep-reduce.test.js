import _ from 'lodash';
import { refProp } from './references';
import lib from './deep-reduce';

const ref = 'domain.com/_components/foo',
  component = {
    [refProp]: ref,
    a: 'b'
  },
  compose = obj => (str, data) => obj[str] = data;

describe('deep reduce', () => {
  test('calls fn when it finds a component', () => {
    let obj = {};

    _.reduce([component], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).toEqual({ [ref]: component });
  });

  test('does not call fn on non-component refs', () => {
    let obj = {};

    _.reduce([{ [refProp]: 'domain.com/_pages/foo' }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).toEqual({});
  });

  test('does not call fn on ignored root-level keys', () => {
    let obj = {};

    _.reduce([{ locals: component }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).toEqual({});
  });

  // note: keys beginning with underscores are metadata, e.g. _layoutRef, _components
  test('does not call fn on keys beginning with underscores', () => {
    let obj = {};

    _.reduce([{ _components: component }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).toEqual({});
  });

  test('calls fn on ignored non-root-level keys', () => {
    let obj = {};

    _.reduce([{
      cool_components: {
        [refProp]: ref,
        media: 'hi',
        a: 'b'
      }
    }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).toEqual({
      [ref]: {
        [refProp]: ref,
        media: 'hi',
        a: 'b'
      }
    });
  });

  test('calls fn on keys containing underscores (not beginning)', () => {
    let obj = {};

    _.reduce([{ cool_components: component }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).toEqual({ [ref]: component });
  });

  test('recursively calls itself on objects', () => {
    let obj = {};

    _.reduce([{ a: component }], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).toEqual({ [ref]: component });
  });

  test('recursively calls itself on arrays', () => {
    let obj = {};

    _.reduce([[component]], (result, val) => lib(result, val, compose(obj)), {});
    expect(obj).toEqual({ [ref]: component });
  });
});
