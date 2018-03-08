import _ from 'lodash';
import * as store from '../core-data/store';
import * as components from '../core-data/components';
import * as api from '../core-data/api';
import * as model from './model';
import * as references from '../utils/references';
import lib from './create';

describe('component creator', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(store);
    sandbox.stub(components);
    sandbox.stub(api);
    sandbox.stub(model);
    sandbox.stub(references, 'isDefaultComponent').returns(true);
    api.getText.returns(Promise.reject());
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('resolves to empty array if passed no components', () => {
    return lib([]).then((res) => expect(res).to.eql([]));
  });

  it('creates a single component with no children', () => {
    components.getSchema.returns({});
    components.getDefaultData.returns({ a: 'b' });
    components.getModel.returns(null);
    // note: the _ref will be a uid that we can't test against
    return lib([{ name: 'foo' }]).then((res) => expect(res[0].a).to.equal('b'));
  });

  it('creates a single component with data, but no children', () => {
    components.getSchema.returns({});
    // make sure we don't accidentally expand non-child-component arrays and objects in the data
    components.getDefaultData.returns({ a: 'b', nonComponentArray: [{ text: 'ok' }], nonComponentProp: { text: 'ok' } });
    components.getModel.returns(null);
    return lib([{ name: 'foo', data: { c: 'd' } }]).then((res) => {
      expect(res[0].a).to.equal('b');
      expect(res[0].c).to.equal('d');
    });
  });

  it('creates a single component with a child list', () => {
    components.getSchema.returns({});
    // no store.state.site.prefix, hence undefined
    components.getDefaultData.withArgs('foo').returns({ a: 'b', children: [{ _ref: 'undefined/_components/bar' }] });
    components.getDefaultData.withArgs('bar').returns({ c: 'd' });
    components.getModel.returns(null);
    // note: the _ref will be a uid that we can't test against
    return lib([{ name: 'foo' }]).then((res) => expect(res[0].children[0].c).to.equal('d'));
  });

  it('creates a single component with a child prop', () => {
    components.getSchema.returns({});
    // no store.state.site.prefix, hence undefined
    components.getDefaultData.withArgs('foo').returns({ a: 'b', child: { _ref: 'undefined/_components/bar' } });
    components.getDefaultData.withArgs('bar').returns({ c: 'd' });
    components.getModel.returns(null);
    // note: the _ref will be a uid that we can't test against
    return lib([{ name: 'foo' }]).then((res) => expect(res[0].child.c).to.equal('d'));
  });

  it('resolves default data from the server', () => {
    components.getSchema.returns({});
    api.getObject.returns(Promise.resolve({ a: 'b' }));
    components.getDefaultData.returns(null);
    components.getModel.returns(null);
    return lib([{ name: 'foo' }]).then(() => expect(api.getObject).to.have.been.called);
  });

  it('resolves default data from the server', () => {
    components.getSchema.returns(null);
    api.getSchema.returns(Promise.resolve({}));
    components.getDefaultData.returns({ a: 'b' });
    components.getModel.returns(null);
    return lib([{ name: 'foo' }]).then(() => expect(api.getSchema).to.have.been.called);
  });

  it('updates store with data passed through model.js', () => {
    components.getSchema.returns({});
    components.getDefaultData.returns({ a: 'b' });
    components.getModel.returns(true);
    model.save.returns(Promise.resolve({ c: 'd' }));
    model.render.returns(Promise.resolve({ c: 'd' }));
    return lib([{ name: 'foo' }]).then(() => {
      expect(model.save).to.have.been.called;
      expect(model.render).to.have.been.called;
    });
  });

  it('fetches base component styles for new components', () => {
    components.getSchema.returns(null);
    api.getSchema.returns(Promise.resolve({}));
    components.getDefaultData.returns({ a: 'b' });
    components.getModel.returns(null);
    api.getText.returns(Promise.resolve('.foobarbaz { color: red; }')); // base and site
    return lib([{ name: 'foobarbaz' }]).then(() => {
      expect(api.getText.callCount).to.equal(2);
      expect(_.last(document.getElementsByTagName('head')[0].children).textContent).to.equal('.foobarbaz { color: red; }');
    });
  });

  it('Returns the component data that may have been added on save when passed a component list', () => {
    components.getSchema.returns({});
    components.getDefaultData.returns({ a: 'b' });
    components.getModel.returns(true);
    model.save.returns(Promise.resolve({ c: 'd' }));
    model.render.returns(Promise.resolve({ c: 'd' }));
    return lib([{ name: 'foo' }]).then((resolved) => {
      expect(resolved[0].c).to.equal('d');
    });
  });
});
