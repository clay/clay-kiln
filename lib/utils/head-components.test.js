import * as lib from './head-components';

describe('head components', () => {
  const headList = document.createDocumentFragment(),
    start = document.createComment('data-editable="sample-component-list"'),
    mid1 = document.createComment('data-uri="domain.com/_components/sample-list-one"'),
    mid2 = document.createElement('meta'),
    end = document.createComment('data-editable-end');

  beforeAll(() => {
    headList.appendChild(start);
    headList.appendChild(mid1);
    headList.appendChild(mid2);
    headList.appendChild(end);
    document.head.appendChild(headList);
  });

  describe('isComponentListStart', () => {
    const fn = lib.isComponentListStart;

    test('returns false if no node', () => {
      expect(fn()).toBe(false);
    });

    test('returns false if node is not a comment', () => {
      expect(fn(document.createElement('div'))).toBe(false);
    });

    test('returns false if node is not data-editable', () => {
      expect(fn(document.createComment('lol hi'))).toBe(false);
    });

    test('returns true if component list start', () => {
      expect(fn(document.createComment('data-editable="foo"'))).toBe(true);
    });
  });

  describe('getComponentListPath', () => {
    const fn = lib.getComponentListPath;

    test('gets path from comment', () => {
      expect(fn(document.createComment('data-editable="foo"'))).toBe('foo');
    });
  });

  describe('getComponentListStart', () => {
    const fn = lib.getComponentListStart;

    test('gets start of component list from path', () => {
      expect(fn('sample-component-list').nodeValue).toBe('data-editable="sample-component-list"');
    });
  });

  describe('getComponentListStartFromComponent', () => {
    const fn = lib.getComponentListStartFromComponent;

    test('gets start of component list from node', () => {
      expect(fn(end)).toBe('sample-component-list');
    });

    test('returns undefined if not in a list', () => {
      expect(fn(document.head)).toBe(undefined);
    });
  });

  describe('isComponentListEnd', () => {
    const fn = lib.isComponentListEnd;

    test('returns false if no node', () => {
      expect(fn()).toBe(false);
    });

    test('returns false if node is not a comment', () => {
      expect(fn(document.createElement('div'))).toBe(false);
    });

    test('returns false if node is not data-editable-end', () => {
      expect(fn(document.createComment('lol hi'))).toBe(false);
    });

    test('returns true if component list end', () => {
      expect(fn(document.createComment('data-editable-end'))).toBe(true);
    });
  });

  describe('getComponentListEnd', () => {
    const fn = lib.getComponentListEnd;

    test('finds end of component list', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta'),
        end = document.createComment('data-editable-end');

      nodes.appendChild(start);
      nodes.appendChild(end);

      expect(fn(nodes.firstChild)).toBe(end);
    });

    test('does not find end if no end', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta');

      nodes.appendChild(start);

      expect(fn(nodes.firstChild)).toBe(undefined);
    });
  });

  describe('getComponentRef', () => {
    const fn = lib.getComponentRef;

    test('returns false if no node', () => {
      expect(fn()).toBe(false);
    });

    test('returns false if node is not a comment', () => {
      expect(fn(document.createElement('div'))).toBe(false);
    });

    test('returns false if node is not data-uri', () => {
      expect(fn(document.createComment('lol hi'))).toBe(false);
    });

    test('returns reference for a component', () => {
      expect(fn(document.createComment('data-uri="foo"'))).toBe('foo');
    });
  });

  describe('getComponentNode', () => {
    const fn = lib.getComponentNode;

    test('gets first node in a specified component', () => {
      const node = document.createComment('data-uri="domain.com/components/foo-1-2/instances/bar-1-2"');

      document.head.appendChild(node);
      expect(fn('domain.com/components/foo-1-2/instances/bar-1-2')).toBe(node);
    });

    test('returns undefined if not found', () => {
      expect(fn('domain.com/components/not-found')).toBe(undefined);
    });
  });

  describe('getComponentEnd', () => {
    const fn = lib.getComponentEnd;

    test('finds end of component when another component follows', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta'),
        end = document.createComment('data-uri="bar"');

      nodes.appendChild(start);
      nodes.appendChild(end);

      expect(fn(nodes.firstChild)).toBe(nodes.firstChild);
    });

    test('finds end of component when list ends', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta'),
        end = document.createComment('data-editable-end');

      nodes.appendChild(start);
      nodes.appendChild(end);

      expect(fn(nodes.firstChild)).toBe(nodes.firstChild);
    });

    test('does not find end if no end', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createElement('meta');

      nodes.appendChild(start);

      expect(fn(nodes.firstChild)).toBe(undefined);
    });
  });

  describe('getComponentListFragment', () => {
    const fn = lib.getComponentListFragment;

    test('gets document fragment from path', () => {
      expect(fn('sample-component-list').firstChild.nodeValue).toBe('data-editable="sample-component-list"');
    });
  });

  describe('removeComponentFromDOM', () => {
    const fn = lib.removeComponentFromDOM;

    test('removes component nodes from the dom', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createComment('data-uri="foo"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-uri="bar"');

      nodes.appendChild(start);
      nodes.appendChild(mid);
      nodes.appendChild(end);

      fn(nodes.firstChild);
      expect(nodes.childNodes.length).toBe(2);
    });

    test('returns cloned copies of component nodes', () => {
      const nodes = document.createDocumentFragment(),
        start = document.createComment('data-uri="foo"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-uri="bar"');

      nodes.appendChild(start);
      nodes.appendChild(mid);
      nodes.appendChild(end);

      expect(fn(nodes.firstChild).childNodes.length).toBe(1);
    });
  });

  describe('insertAfter', () => {
    const fn = lib.insertAfter;

    test('inserts fragment nodes after specified node', () => {
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

      expect(wrapper.childNodes.length).toBe(1);
      fn(wrapper.firstChild, fragment);
      expect(wrapper.childNodes.length).toBe(3);
    });
  });

  describe('replaceHeadComponent', () => {
    const fn = lib.replaceHeadComponent;

    test('replaces component tags in the head', () => {
      const start = document.createComment('data-editable="foo-2-3"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-editable-end'),
        component1 = document.createComment('data-uri="domain.com/_components/remove-me"'),
        component2 = document.createComment('data-uri="domain.com/_components/insert-me"'),
        fragment = document.createDocumentFragment();

      document.head.appendChild(start);
      document.head.appendChild(component1);
      document.head.appendChild(mid);
      document.head.appendChild(end);

      fragment.appendChild(component2);
      fragment.appendChild(mid);

      fn('domain.com/_components/remove-me', fragment);
      expect(lib.getComponentNode('domain.com/_components/insert-me')).not.toBe(null);
    });
  });

  describe('getList', () => {
    const fn = lib.getList;

    test('gets a list of components', () => {
      const start = document.createComment('data-editable="foo-2-3"'),
        mid = document.createElement('meta'),
        end = document.createComment('data-editable-end'),
        component1 = document.createComment('data-uri="domain.com/_components/1/instances/1"'),
        component2 = document.createComment('data-uri="domain.com/_components/2/instances/2"'),
        component3 = document.createComment('data-uri="domain.com/_components/3/instances/3"');

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

      expect(fn(start).map(getTitle)).toEqual(['1', '2', '3']);
    });
  });

  describe('getListsInHead', () => {
    const fn = lib.getListsInHead;

    test('gets all lists in the head', () => {
      expect(fn().length).toBe(3);
    });
  });
});
