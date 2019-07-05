import * as template from './template';
import { refAttr } from '../utils/references';
import { getComponentNode } from '../utils/head-components';
import * as lib from './reactive-render';

jest.mock('./template');

describe('reactive render', () => {
  beforeEach(() => {
    template.render.mockReturnValue('hi');
  });

  describe('updateDOM', () => {
    const fn = lib.updateDOM;

    test('logs error if passed unknown node type', () => {
      const weirdNode = document.createComment('hi mom');

      fn('foo', weirdNode);
      expect(mockLogger).toHaveBeenCalledWith('error', 'Unknown node type (8) for "foo"', { action: 'updateDOM' });
    });

    test('updates body components when passed element', () => {
      const oldEl = document.createElement('div'),
        newEl = document.createElement('div');

      oldEl.setAttribute(refAttr, 'replace-el');
      oldEl.textContent = 'old';
      document.body.appendChild(oldEl);

      newEl.setAttribute(refAttr, 'replace-el');
      newEl.textContent = 'new';

      fn('replace-el', newEl);
      expect(document.querySelector(`[${refAttr}="replace-el"]`).textContent).toBe('new');
    });

    test('updates head components when passed document fragment', () => {
      const nodes = document.createDocumentFragment(),
        listStart = document.createComment('data-editable="head-list"'),
        start = document.createComment('data-uri="replace-head"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-uri="replace-head-next"'),
        newNodes = document.createDocumentFragment(),
        newStart = document.createComment('data-uri="replace-head"'),
        newMid = document.createElement('meta');

      mid.setAttribute('name', 'foo');
      newMid.setAttribute('name', 'bar');

      nodes.appendChild(listStart);
      nodes.appendChild(start);
      nodes.appendChild(mid);
      nodes.appendChild(end); // need to end the component (by having the "next" component after it)
      document.head.appendChild(nodes);

      newNodes.appendChild(newStart);
      newNodes.appendChild(newMid);
      fn('replace-head', newNodes);
      expect(getComponentNode('replace-head').nextSibling.getAttribute('name')).toBe('bar');
    });
  });
});
