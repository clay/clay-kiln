import * as lib from './head-components';

describe('head components', () => {
  describe('isComponentListStart', () => {
    const fn = lib.isComponentListStart;

    it('returns false if no node', () => {
      expect(fn()).to.equal(false);
    });

    it('returns false if node is not a comment', () => {
      expect(fn(document.createElement('div'))).to.equal(false);
    });

    it('returns false if node is not data-editable', () => {
      expect(fn(document.createComment('lol hi'))).to.equal(false);
    });

    it('returns true if component list start', () => {
      expect(fn(document.createComment('data-editable="foo"'))).to.equal(true);
    });
  });

  describe('getComponentListPath', () => {
    const fn = lib.getComponentListPath;

    it('gets path from comment', () => {
      expect(fn(document.createComment('data-editable="foo"'))).to.equal('foo');
    });
  });

  describe('isComponentListEnd', () => {
    const fn = lib.isComponentListEnd;

    it('returns false if no node', () => {
      expect(fn()).to.equal(false);
    });

    it('returns false if node is not a comment', () => {
      expect(fn(document.createElement('div'))).to.equal(false);
    });

    it('returns false if node is not data-editable-end', () => {
      expect(fn(document.createComment('lol hi'))).to.equal(false);
    });

    it('returns true if component list end', () => {
      expect(fn(document.createComment('data-editable-end'))).to.equal(true);
    });
  });

  describe('getComponentListEnd', () => {
    const fn = lib.getComponentListEnd;

    it('finds end of component list', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta'),
        end = document.createComment('data-editable-end');

      nodes.appendChild(start);
      nodes.appendChild(end);

      expect(fn(nodes.firstChild)).to.equal(end);
    });

    it('does not find end if no end', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta');

      nodes.appendChild(start);

      expect(fn(nodes.firstChild)).to.equal(undefined);
    });
  });

  describe('getComponentRef', () => {
    const fn = lib.getComponentRef;

    it('returns false if no node', () => {
      expect(fn()).to.equal(false);
    });

    it('returns false if node is not a comment', () => {
      expect(fn(document.createElement('div'))).to.equal(false);
    });

    it('returns false if node is not data-uri', () => {
      expect(fn(document.createComment('lol hi'))).to.equal(false);
    });

    it('returns reference for a component', () => {
      expect(fn(document.createComment('data-uri="foo"'))).to.equal('foo');
    });
  });

  describe('getComponentNode', () => {
    const fn = lib.getComponentNode;

    it('gets first node in a specified component', () => {
      const node = document.createComment('data-uri="domain.com/components/foo-1-2/instances/bar-1-2"');

      document.head.appendChild(node);
      expect(fn('domain.com/components/foo-1-2/instances/bar-1-2')).to.equal(node);
    });

    it('returns undefined if not found', () => {
      expect(fn('domain.com/components/not-found')).to.equal(undefined);
    });
  });

  describe('getComponentEnd', () => {
    const fn = lib.getComponentEnd;

    it('finds end of component when another component follows', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta'),
        end = document.createComment('data-uri="bar"');

      nodes.appendChild(start);
      nodes.appendChild(end);

      expect(fn(nodes.firstChild)).to.equal(nodes.firstChild);
    });

    it('finds end of component when list ends', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta'),
        end = document.createComment('data-editable-end');

      nodes.appendChild(start);
      nodes.appendChild(end);

      expect(fn(nodes.firstChild)).to.equal(nodes.firstChild);
    });

    it('does not find end if no end', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta');

      nodes.appendChild(start);

      expect(fn(nodes.firstChild)).to.equal(undefined);
    });
  });

  describe('removeComponentFromDOM', () => {
    const fn = lib.removeComponentFromDOM;

    it('removes component nodes from the dom', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createComment('data-uri="foo"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-uri="bar"');

      nodes.appendChild(start);
      nodes.appendChild(mid);
      nodes.appendChild(end);

      fn(nodes.firstChild);
      expect(nodes.childNodes.length).to.equal(2);
    });

    it('returns cloned copies of component nodes', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createComment('data-uri="foo"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-uri="bar"');

      nodes.appendChild(start);
      nodes.appendChild(mid);
      nodes.appendChild(end);

      expect(fn(nodes.firstChild).childNodes.length).to.equal(1);
    });
  });

  describe('insertAfter', () => {
    const fn = lib.insertAfter;

    it('inserts fragment nodes after specified node', () => {
      const fragment = document.createDocumentFragment(),
        start = document.createComment('data-uri="foo"'),
        mid = document.createElement('meta'),
        wrapper = document.createDocumentFragment(),
        node = document.createElement('meta');

      // create fragment
      fragment.appendChild(start);
      fragment.appendChild(mid);

      // create node + wrapper
      wrapper.appendChild(node);

      expect(wrapper.childNodes.length).to.equal(1);
      fn(wrapper.firstChild, fragment);
      expect(wrapper.childNodes.length).to.equal(3);
    });
  });

  describe('replaceHeadComponent', () => {
    const fn = lib.replaceHeadComponent;

    it('replaces component tags in the head', () => {
      const start = document.createComment('data-editable="foo-2-3"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-editable-end'),
        component1 = document.createComment('data-uri="domain.com/components/remove-me"'),
        component2 = document.createComment('data-uri="domain.com/components/insert-me"'),
        fragment = document.createDocumentFragment();

      document.head.appendChild(start);
      document.head.appendChild(component1);
      document.head.appendChild(mid);
      document.head.appendChild(end);

      fragment.appendChild(component2);
      fragment.appendChild(mid);

      fn('domain.com/components/remove-me', fragment);
      expect(lib.getComponentNode('domain.com/components/insert-me')).to.not.equal(null);
    });
  });

  describe('getList', () => {
    const fn = lib.getList;

    it('gets a list of components', () => {
      const start = document.createComment('data-editable="foo-2-3"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-editable-end'),
        component1 = document.createComment('data-uri="domain.com/components/1/instances/1"'),
        component2 = document.createComment('data-uri="domain.com/components/2/instances/2"'),
        component3 = document.createComment('data-uri="domain.com/components/3/instances/3"');

      document.head.appendChild(start);
      document.head.appendChild(component1);
      document.head.appendChild(mid);
      document.head.appendChild(component2);
      document.head.appendChild(mid);
      document.head.appendChild(component3);
      document.head.appendChild(mid);
      document.head.appendChild(end);

      function getTitle(item) {
        return item.title;
      }

      expect(fn(start).map(getTitle)).to.eql(['1', '2', '3']);
    });
  });

  describe('getListsInHead', () => {
    const fn = lib.getListsInHead;

    it('gets all lists in the head', () => {
      expect(fn().length).to.equal(2);
    });
  });
});
