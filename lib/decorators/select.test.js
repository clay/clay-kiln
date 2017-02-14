import * as lib from './select';
import * as components from '../core-data/components';
import { refProp } from '../utils/references';

describe('select', () => {
  describe('getParentField', () => {
    const fn = lib.getParentField;

    let sandbox;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(components);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('returns empty obj if path not found in data', () => {
      components.getData.returns({});
      components.getSchema.returns({});
      expect(fn('foo', 'bar')).to.eql({});
    });

    it('returns empty obj if data props are not arrays or objects', () => {
      // todo: this might mean that this won't grab child components of page areas,
      // so test this before enabling editing of those page areas
      components.getData.returns({ fooProp: 'foo' });
      components.getSchema.returns({});
      expect(fn('foo', 'bar')).to.eql({});
    });

    it('warns if path not found in schema', () => {
      components.getData.returns({ fooProp: { [refProp]: '/components/foo' } });
      components.getSchema.returns({});
      fn('/components/foo', '/components/bar');
      expect(console.warn).to.have.been.calledWith('bar has no field for fooProp in its schema, but has foo in its data');
    });

    it('returns path for component in list', () => {
      components.getData.returns({ fooProp: [{ [refProp]: 'foo' }] });
      components.getSchema.returns({ fooProp: { _componentList: true } });
      expect(fn('foo', 'bar')).to.eql({ path: 'fooProp', type: 'list' });
    });

    it('returns path for component in prop', () => {
      components.getData.returns({ fooProp: { [refProp]: 'foo' } });
      components.getSchema.returns({ fooProp: { _component: true } });
      expect(fn('foo', 'bar')).to.eql({ path: 'fooProp', type: 'prop' });
    });
  });
});
