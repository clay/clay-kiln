import * as lib from './component-elements';
import { refAttr, layoutAttr } from './references';
import { find } from '@nymag/dom';

function stubComponent(name) {
  const el = document.createElement('div'),
    child = document.createElement('span');

  child.classList.add('child');
  el.appendChild(child);

  el.setAttribute(refAttr, `domain.com/components/${name}`);
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

    it('finds the parent', () => {
      const el = stubComponent('foo');

      expect(fn(find(el, '.child'))).to.equal(el);
    });

    it('returns itself if component', () => {
      const el = stubComponent('foo');

      expect(fn(el)).to.equal(el);
    });

    it('returns undefined if no el', () => {
      expect(fn()).to.equal(undefined);
    });
  });

  describe('getParentComponent', () => {
    const fn = lib.getParentComponent;

    it('finds parent of element in component', () => {
      const el = stubComponent('foo');

      expect(fn(find(el, '.child'))).to.equal(el);
    });

    it('finds parent of component element', () => {
      const el = stubChildren(['foo']);

      expect(fn(find(el, '.foo'))).to.equal(el);
    });
  });

  describe('getLayout', () => {
    const fn = lib.getLayout;

    document.firstElementChild.setAttribute(refAttr, 'domain.com/pages/1');
    document.firstElementChild.setAttribute(layoutAttr, 'domain.com/components/layout');

    it('finds layout element and uri', () => {
      expect(fn()).to.eql({
        el: document.firstElementChild,
        uri: 'domain.com/components/layout'
      });
    });
  });

  describe('getPrevComponent', () => {
    const fn = lib.getPrevComponent,
      el = stubChildren(['foo', 'bar', 'baz']);

    it('returns undefined if no previous siblings', () => {
      expect(fn(find(el, '.first-child'))).to.equal(undefined);
    });

    it('returns undefined if no previous components', () => {
      expect(fn(find(el, '.foo'))).to.equal(undefined);
    });

    it('returns previous component', () => {
      expect(fn(find(el, '.bar'))).to.equal(find(el, '.foo'));
    });

    it('allows matching against component name', () => {
      expect(fn(find(el, '.baz'), 'foo')).to.equal(find(el, '.foo'));
    });
  });

  describe('getNextComponent', () => {
    const fn = lib.getNextComponent,
      el = stubChildren(['foo', 'bar', 'baz']);

    it('returns undefined if no next siblings', () => {
      expect(fn(find(el, '.last-child'))).to.equal(undefined);
    });

    it('returns undefined if no next components', () => {
      expect(fn(find(el, '.baz'))).to.equal(undefined);
    });

    it('returns next component', () => {
      expect(fn(find(el, '.bar'))).to.equal(find(el, '.baz'));
    });

    it('allows matching against component name', () => {
      expect(fn(find(el, '.foo'), 'baz')).to.equal(find(el, '.baz'));
    });
  });
});
