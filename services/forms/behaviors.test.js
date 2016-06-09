var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./behaviors'), // static-analysis means this must be string, not ('./' + filename);
  singleElement = '<div class="behaviour-element"></div>';

describe(dirname, function () {
  describe(filename, function () {
    describe('run', function () {
      var fn = lib[this.title],
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(console, 'warn', sandbox.spy());
      });

      afterEach(function () {
        sandbox.restore();
      });

      // behavior that adds an element
      function addTestBehaviors() {
        lib.add('testBehavior', function (context) {
          var el = document.createElement('div');

          el.setAttribute('class', 'behaviour-element');
          context.el.appendChild(el);
          return context;
        });

        // promise behavior that adds an element
        lib.add('testPromiseBehavior', function (context) {
          var el = document.createElement('div');

          el.setAttribute('class', 'behaviour-element');
          context.el.appendChild(el);
          return Promise.resolve(context);
        });
      }

      // behavior with args that does NOT add an element
      function expectBehaviorArgs() {
        lib.add('argBehavior', function (context, args) {
          expect(args.test).to.equal(true);
          return context;
        });
      }

      // test the context keys
      function hasContextKeys(context) {
        return Object.keys(context) === ['el', 'bindings', 'binders', 'formatters', 'name'];
      }

      // behavior to test context passed into it
      function expectBehaviorContext() {
        lib.add('contextBehavior', function (context) {
          expect(hasContextKeys(context)).to.equal(true);
          return context;
        });
      }

      it('accepts shortcut notation', function () {
        function test(resolved) {
          expect(resolved.el.firstElementChild.outerHTML).to.equal(singleElement);
        }

        addTestBehaviors();
        fn({_schema: {_name: 'name', _has: 'testBehavior'}}).then(test);
      });

      it('accepts inner shortcut notation', function () {
        function test(resolved) {
          expect(resolved.el.firstElementChild.outerHTML).to.equal(singleElement);
        }

        addTestBehaviors();
        fn({_schema: {_name: 'name', _has: ['testBehavior']}}).then(test);
      });

      it('accepts normal notation', function () {
        function test(resolved) {
          expect(resolved.el.firstElementChild.outerHTML).to.equal(singleElement);
        }

        addTestBehaviors();
        fn({_schema: {_name: 'name', _has: [{fn: 'testBehavior'}]}}).then(test);
      });

      it('accepts multiple behaviors', function () {
        function test(resolved) {
          expect(resolved.el.firstElementChild.outerHTML).to.equal(singleElement);
          expect(resolved.el.firstElementChild.nextElementSibling.outerHTML).to.equal(singleElement);
        }

        addTestBehaviors();
        fn({_schema: {_name: 'name', _has: [{fn: 'testBehavior'}, {fn: 'testBehavior'}]}}).then(test);
      });

      it('accepts behaviors that return a promise', function () {
        function test(resolved) {
          expect(resolved.el.firstElementChild.outerHTML).to.equal(singleElement);
        }

        addTestBehaviors();
        fn({_schema: {_name: 'name', _has: 'testPromiseBehavior'}}).then(test);
      });

      it('doesn\'t run behaviors that haven\'t been added', function () {
        function test(resolved) {
          expect(resolved.el.firstElementChild.outerHTML).to.equal(singleElement);
          expect(resolved.el.firstElementChild.nextElementSibling).to.equal(undefined);
          expect(console.warn.callCount).to.equal(1);
        }

        addTestBehaviors();
        fn({_schema: {_name: 'name', _has: [{fn: 'testBehavior'}, {fn: 'notAddedBehavior'}]}}).then(test);
      });

      it('passes arguments to behaviors', function () {
        function test(resolved) {
          expect(resolved.el).to.equal(document.createDocumentFragment());
        }

        expectBehaviorArgs();
        fn({_schema: {_name: 'name', _has: [{fn: 'argBehavior', test: true}]}}).then(test);
      });

      it('passes context through behaviors', function () {
        function test(resolved) {
          expect(resolved.el).to.equal(document.createDocumentFragment());
          expect(hasContextKeys(resolved)).to.equal(true); // test to make sure context is passed out of behavior
        }

        expectBehaviorContext();
        fn({_schema: {_name: 'name', _has: [{fn: 'contextBehavior'}]}}).then(test);
      });
    });

    describe('getExpandedBehaviors', function () {
      var fn = lib[this.title];

      it('gets a behavior defined as a string', function () {
        expect(fn('foo')).to.eql([{
          fn: 'foo',
          args: {}
        }]);
      });

      it('gets a behavior defined as an object', function () {
        expect(fn({fn: 'foo', baz: 'qux'})).to.eql([{
          fn: 'foo',
          args: {baz: 'qux'}
        }]);
      });

      it('gets an array of string behaviors', function () {
        expect(fn(['foo', 'bar'])).to.eql([{
          fn: 'foo',
          args: {}
        }, {
          fn: 'bar',
          args: {}
        }]);
      });

      it('gets an array of object behaviors', function () {
        expect(fn([{
          fn: 'foo'
        }, {
          fn: 'bar',
          baz: 'qux'
        }]))
          .to.eql([{
            fn: 'foo',
            args: {}
          }, {
            fn: 'bar',
            args: {baz: 'qux'}
          }]);
      });

      it('gets mixed string and object behaviors in an array', function () {
        expect(fn(['foo', {
          fn: 'bar',
          baz: 'qux'
        }]))
          .to.eql([{
            fn: 'foo',
            args: {}
          }, {
            fn: 'bar',
            args: {baz: 'qux'}
          }]);
      });
    });
  });
});
