const dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./invisible-list');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('isComponentListStart', function () {
      const fn = lib[this.title];

      it('returns false if no node', function () {
        expect(fn()).to.equal(false);
      });

      it('returns false if node is not a comment', function () {
        expect(fn(document.createElement('div'))).to.equal(false);
      });

      it('returns false if node is not data-editable', function () {
        expect(fn(document.createComment('lol hi'))).to.equal(false);
      });

      it('returns true if component list start', function () {
        expect(fn(document.createComment('data-editable="foo"'))).to.equal(true);
      });
    });

    describe('getComponentListPath', function () {
      const fn = lib[this.title];

      it('gets path from comment', function () {
        expect(fn(document.createComment('data-editable="foo"'))).to.equal('foo');
      });
    });

    describe('getComponentListStart', function () {
      const fn = lib[this.title];

      it('gets first node in a component list', function () {
        var listNode = document.createComment('data-editable="foo-1-2-3"');

        document.head.appendChild(listNode);
        expect(fn('foo-1-2-3')).to.equal(listNode);
      });
    });

    describe('isComponentListEnd', function () {
      const fn = lib[this.title];

      it('returns false if no node', function () {
        expect(fn()).to.equal(false);
      });

      it('returns false if node is not a comment', function () {
        expect(fn(document.createElement('div'))).to.equal(false);
      });

      it('returns false if node is not data-editable-end', function () {
        expect(fn(document.createComment('lol hi'))).to.equal(false);
      });

      it('returns true if component list end', function () {
        expect(fn(document.createComment('data-editable-end'))).to.equal(true);
      });
    });

    describe('getComponentListEnd', function () {
      const fn = lib[this.title];

      it('finds end of component list', function () {
        var nodes = document.createDocumentFragment(),
          start = document.createElement('meta'),
          end = document.createComment('data-editable-end');

        nodes.appendChild(start);
        nodes.appendChild(end);

        expect(fn(nodes.firstChild)).to.equal(end);
      });

      it('does not find end if no end', function () {
        var nodes = document.createDocumentFragment(),
          start = document.createElement('meta');

        nodes.appendChild(start);

        expect(fn(nodes.firstChild)).to.equal(undefined);
      });
    });

    describe('getComponentRef', function () {
      const fn = lib[this.title];

      it('returns false if no node', function () {
        expect(fn()).to.equal(false);
      });

      it('returns false if node is not a comment', function () {
        expect(fn(document.createElement('div'))).to.equal(false);
      });

      it('returns false if node is not data-uri', function () {
        expect(fn(document.createComment('lol hi'))).to.equal(false);
      });

      it('returns reference for a component', function () {
        expect(fn(document.createComment('data-uri="foo"'))).to.equal('foo');
      });
    });

    describe('getComponentNode', function () {
      const fn = lib[this.title];

      it('gets first node in a specified component', function () {
        var node = document.createComment('data-uri="domain.com/components/foo-1-2/instances/bar-1-2"');

        document.head.appendChild(node);
        expect(fn('domain.com/components/foo-1-2/instances/bar-1-2')).to.equal(node);
      });
    });

    describe('getComponentEnd', function () {
      const fn = lib[this.title];

      it('finds end of component when another component follows', function () {
        var nodes = document.createDocumentFragment(),
          start = document.createElement('meta'),
          end = document.createComment('data-uri="bar"');

        nodes.appendChild(start);
        nodes.appendChild(end);

        expect(fn(nodes.firstChild)).to.equal(nodes.firstChild);
      });

      it('finds end of component when list ends', function () {
        var nodes = document.createDocumentFragment(),
          start = document.createElement('meta'),
          end = document.createComment('data-editable-end');

        nodes.appendChild(start);
        nodes.appendChild(end);

        expect(fn(nodes.firstChild)).to.equal(nodes.firstChild);
      });

      it('does not find end if no end', function () {
        var nodes = document.createDocumentFragment(),
          start = document.createElement('meta');

        nodes.appendChild(start);

        expect(fn(nodes.firstChild)).to.equal(undefined);
      });
    });

    describe('removeComponentFromDOM', function () {
      const fn = lib[this.title];

      it('removes component nodes from the dom', function () {
        var nodes = document.createDocumentFragment(),
          start = document.createComment('data-uri="foo"'),
          mid = document.createElement('meta'),
          end = document.createComment('data-uri="bar"');

        nodes.appendChild(start);
        nodes.appendChild(mid);
        nodes.appendChild(end);

        fn(nodes.firstChild);
        expect(nodes.childNodes.length).to.equal(2);
      });

      it('returns cloned copies of component nodes', function () {
        var nodes = document.createDocumentFragment(),
          start = document.createComment('data-uri="foo"'),
          mid = document.createElement('meta'),
          end = document.createComment('data-uri="bar"');

        nodes.appendChild(start);
        nodes.appendChild(mid);
        nodes.appendChild(end);

        expect(fn(nodes.firstChild).childNodes.length).to.equal(1);
      });
    });

    describe('insertAfter', function () {
      const fn = lib[this.title];

      it('inserts fragment nodes after specified node', function () {
        var fragment = document.createDocumentFragment(),
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

    describe('getList', function () {
      const fn = lib[this.title];

      it('gets a list of components', function () {
        var start = document.createComment('data-editable="foo-2-3"'),
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

        expect(fn(start).map(getTitle)).to.deep.equal(['1', '2', '3']);
      });
    });
  });
});
