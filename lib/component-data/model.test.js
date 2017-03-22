import * as components from '../core-data/components';
import * as lib from './model';

describe('component model', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(components);
    components.getLocals.returns({ edit: true });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('save', () => {
    const fn = lib.save,
      data = { a: 'b' };

    it('passes through data if no model.save', () => {
      components.getModel.returns({});
      return fn('foo', data, {}).then((res) => {
        expect(res).to.eql(data);
      });
    });

    it('passes through data if model.save is not a function', () => {
      components.getModel.returns({ save: 'sup' });
      return fn('foo', data, {}).then((res) => {
        expect(res).to.eql(data);
      });
    });

    it('calls model.save if it is a function', () => {
      const newData = { b: 'c' };

      components.getModel.returns({ save: () => newData });
      return fn('foo', data, {}).then((res) => {
        expect(res).to.eql(newData);
      });
    });

    it('allows model.save to return promise', () => {
      const newData = { b: 'c' };

      components.getModel.returns({ save: () => Promise.resolve(newData) });
      return fn('foo', data, {}).then((res) => {
        expect(res).to.eql(newData);
      });
    });

    it('catches if model.save throws error', (done) => {
      components.getModel.returns({ save: () => {
        throw new Error('nope');
      } });

      fn('foo', data, {}).then(done).catch(() => done());
    });

    it('catches if model.save times out', (done) => {
      components.getModel.returns({ save: () => {
        window.setTimeout(() => 'foo', 301); // timeout + 1
      } });

      fn('foo', data, {}).then(done).catch(() => done());
    });
  });

  describe('render', () => {
    const fn = lib.render,
      data = { a: 'b' };

    it('passes through data if no model.render', () => {
      components.getModel.returns({});
      return fn('foo', data, {}).then((res) => {
        expect(res).to.eql(data);
      });
    });

    it('passes through data if model.render is not a function', () => {
      components.getModel.returns({ render: 'sup' });
      return fn('foo', data, {}).then((res) => {
        expect(res).to.eql(data);
      });
    });

    it('calls model.render if it is a function', () => {
      const newData = { b: 'c' };

      components.getModel.returns({ render: () => newData });
      return fn('foo', data, {}).then((res) => {
        expect(res).to.eql(newData);
      });
    });

    it('allows model.render to return promise', () => {
      const newData = { b: 'c' };

      components.getModel.returns({ render: () => Promise.resolve(newData) });
      return fn('foo', data, {}).then((res) => {
        expect(res).to.eql(newData);
      });
    });

    it('catches if model.render throws error', (done) => {
      components.getModel.returns({ render: () => {
        throw new Error('nope');
      } });

      fn('foo', data, {}).then(done).catch(() => done());
    });

    it('catches if model.render times out', (done) => {
      components.getModel.returns({ render: () => {
        window.setTimeout(() => 'foo', 301); // timeout + 1
      } });

      fn('foo', data, {}).then(done).catch(() => done());
    });
  });
});
