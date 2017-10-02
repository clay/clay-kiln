import * as template from './template';
import { refAttr } from '../utils/references';
import { getComponentNode } from '../utils/head-components';
import * as lib from './reactive-render';

describe('reactive render', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(template, 'render').returns('hi');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('updateDOM', () => {
    const fn = lib.updateDOM;

    it('logs error if passed unknown node type', () => {
      const weirdNode = document.createComment('hi mom');

      fn('foo', weirdNode);
      expect(loggerStub.error.called).to.equal(true);
    });

    it('updates body components when passed element', () => {
      const oldEl = document.createElement('div'),
        newEl = document.createElement('div');

      oldEl.setAttribute(refAttr, 'replace-el');
      oldEl.textContent = 'old';
      document.body.appendChild(oldEl);

      newEl.setAttribute(refAttr, 'replace-el');
      newEl.textContent = 'new';

      fn('replace-el', newEl);
      expect(document.querySelector(`[${refAttr}="replace-el"]`).textContent).to.equal('new');
    });

    it('updates head components when passed document fragment', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createComment('data-uri="replace-head"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-uri="replace-head-next"'),
        newNodes = document.createDocumentFragment(),
        newStart = document.createComment('data-uri="replace-head"'),
        newMid = document.createElement('meta');

      mid.setAttribute('name', 'foo');
      newMid.setAttribute('name', 'bar');

      nodes.appendChild(start);
      nodes.appendChild(mid);
      nodes.appendChild(end); // need to end the component (by having the "next" component after it)
      document.head.appendChild(nodes);

      newNodes.appendChild(newStart);
      newNodes.appendChild(newMid);
      fn('replace-head', newNodes);
      expect(getComponentNode('replace-head').nextSibling.getAttribute('name')).to.equal('bar');
    });
  });
});
