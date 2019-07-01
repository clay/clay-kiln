import * as lib from './component-elements';
import {
  refAttr, layoutAttr, hiddenAttr, editAttr
} from './references';
import { find, create } from '@nymag/dom';

function stubComponent(name) {
  const el = document.createElement('div'),
    child = document.createElement('span');

  child.classList.add('child');
  el.appendChild(child);

  el.setAttribute(refAttr, `domain.com/_components/${name}`);
  el.classList.add(name);

  return el;
}

function stubChildren(children) {
  const el = stubComponent('parent'),
    firstChild = document.createElement('span'),
    lastChild = document.createElement('span');

  // first child is NOT a component!
  firstChild.classList.add('first-child');
  el.appendChild(firstChild);

  children.forEach((child) => {
    el.appendChild(stubComponent(child));
  });

  // last child is NOT a component!
  lastChild.classList.add('last-child');
  el.appendChild(lastChild);

  return el;
}

describe('component-elements', () => {
  describe('getComponentEl', () => {
    const fn = lib.getComponentEl;

    test('finds the parent', () => {
      const el = stubComponent('foo');

      expect(fn(find(el, '.child'))).toBe(el);
    });

    test('returns itself if component', () => {
      const el = stubComponent('foo');

      expect(fn(el)).toBe(el);
    });

    test('returns undefined if no el', () => {
      expect(fn()).toBe(undefined);
    });
  });

  describe('getParentComponent', () => {
    const fn = lib.getParentComponent;

    test('finds parent of element in component', () => {
      const el = stubComponent('foo');

      expect(fn(find(el, '.child'))).toBe(el);
    });

    test('finds parent of component element', () => {
      const el = stubChildren(['foo']);

      expect(fn(find(el, '.foo'))).toBe(el);
    });

    test('finds parent element in dom', () => {
      const el = stubComponent('found-in-body'),
        child = stubComponent('found-in-parent'),
        newEl = stubComponent('found-in-parent');

      el.appendChild(child);
      document.body.appendChild(el);

      expect(fn(newEl)).toBe(el);
    });
  });

  describe('getLayout', () => {
    const fn = lib.getLayout;

    document.firstElementChild.setAttribute(refAttr, 'domain.com/_pages/1');
    document.firstElementChild.setAttribute(layoutAttr, 'domain.com/_components/layout');

    test('finds layout element and uri', () => {
      expect(fn()).toEqual({
        el: document.firstElementChild,
        uri: 'domain.com/_components/layout'
      });
    });
  });

  describe('getPrevComponent', () => {
    const fn = lib.getPrevComponent,
      el = stubChildren(['foo', 'bar', 'baz']);

    test('returns undefined if no previous siblings', () => {
      expect(fn(find(el, '.first-child'))).toBe(undefined);
    });

    test('returns undefined if no previous components', () => {
      expect(fn(find(el, '.foo'))).toBe(undefined);
    });

    test('returns previous component', () => {
      expect(fn(find(el, '.bar'))).toBe(find(el, '.foo'));
    });

    test('allows matching against component name', () => {
      expect(fn(find(el, '.baz'), 'foo')).toBe(find(el, '.foo'));
    });
  });

  describe('getNextComponent', () => {
    const fn = lib.getNextComponent,
      el = stubChildren(['foo', 'bar', 'baz']);

    test('returns undefined if no next siblings', () => {
      expect(fn(find(el, '.last-child'))).toBe(undefined);
    });

    test('returns undefined if no next components', () => {
      expect(fn(find(el, '.baz'))).toBe(undefined);
    });

    test('returns next component', () => {
      expect(fn(find(el, '.bar'))).toBe(find(el, '.baz'));
    });

    test('allows matching against component name', () => {
      expect(fn(find(el, '.foo'), 'baz')).toBe(find(el, '.baz'));
    });
  });

  describe('getVisibleList', () => {
    const fn = lib.getVisibleList,
      doc = create(`<div>
        <span ${refAttr}="domain.com/_components/a"></span>
        <span ${refAttr}="domain.com/_components/b"></span>
        <span ${refAttr}="domain.com/_components/c" ${hiddenAttr}="true"></span>
      </div>`);

    // mock visibility
    Object.defineProperty(find(doc, `[${refAttr}="domain.com/_components/a"]`), 'offsetParent', {});
    Object.defineProperty(find(doc, `[${refAttr}="domain.com/_components/b"]`), 'offsetParent', {});

    // append to the dom, so the offsetParent isn't null
    document.body.appendChild(doc);

    test('gets a list of visible components', () => {
      expect(fn(doc).length).toBe(2);
    });
  });

  describe('getPrevVisible', () => {
    const fn = lib.getPrevVisible,
      doc = create(`<div>
        <span ${refAttr}="domain.com/_components/a"></span>
        <span ${refAttr}="domain.com/_components/b" ${hiddenAttr}="true"></span>
        <span ${refAttr}="domain.com/_components/c"></span>
      </div>`);

    // mock visibility
    Object.defineProperty(find(doc, `[${refAttr}="domain.com/_components/a"]`), 'offsetParent', {});
    Object.defineProperty(find(doc, `[${refAttr}="domain.com/_components/c"]`), 'offsetParent', {});

    // append to the dom, so the offsetParent isn't null
    document.body.appendChild(doc);

    test('returns previous visible component', () => {
      expect(fn(find(doc, `[${refAttr}="domain.com/_components/c"]`), doc)).toBe(find(doc, `[${refAttr}="domain.com/_components/a"]`));
    });

    test('returns undefined if no previous visible component', () => {
      expect(fn(find(doc, `[${refAttr}="domain.com/_components/a"]`), doc)).toBe(undefined);
    });
  });

  describe('getNextVisible', () => {
    const fn = lib.getNextVisible,
      doc = create(`<div>
        <span ${refAttr}="domain.com/_components/a"></span>
        <span ${refAttr}="domain.com/_components/b" ${hiddenAttr}="true"></span>
        <span ${refAttr}="domain.com/_components/c"></span>
      </div>`);

    // mock visibility
    Object.defineProperty(find(doc, `[${refAttr}="domain.com/_components/a"]`), 'offsetParent', {});
    Object.defineProperty(find(doc, `[${refAttr}="domain.com/_components/c"]`), 'offsetParent', {});

    // append to the dom, so the offsetParent isn't null
    document.body.appendChild(doc);

    test('returns next visible component', () => {
      expect(fn(find(doc, `[${refAttr}="domain.com/_components/a"]`), doc)).toBe(find(doc, `[${refAttr}="domain.com/_components/c"]`));
    });

    test('returns undefined if no next visible component', () => {
      expect(fn(find(doc, `[${refAttr}="domain.com/_components/c"]`), doc)).toBe(undefined);
    });
  });

  describe('fieldSelectors', () => {
    const fn = lib.fieldSelectors;

    test(
      'returns selector for editable root',
      () => expect(fn('foo', 'bar')[0]).toBe('[data-uri="foo"][data-editable="bar"]')
    );
    test(
      'returns selector for editable child',
      () => expect(fn('foo', 'bar')[1]).toBe('[data-uri="foo"] [data-editable="bar"]')
    );
  });

  describe('getFieldEl', () => {
    const fn = lib.getFieldEl;

    test('gets el for editable root', () => {
      const el = document.createElement('div');

      el.setAttribute(refAttr, 'root-editable');
      el.setAttribute(editAttr, 'foo');
      document.body.appendChild(el);
      expect(fn('root-editable', 'foo')).toBe(el);
    });

    test('gets el for editable child', () => {
      const el = document.createElement('div'),
        child = document.createElement('span');

      el.setAttribute(refAttr, 'child-editable');
      child.setAttribute(editAttr, 'foo');
      el.appendChild(child);
      document.body.appendChild(el);
      expect(fn('child-editable', 'foo')).toBe(child);
    });
  });
});
