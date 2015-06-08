'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./behaviors'), //static-analysis means this must be string, not ('./' + filename);
  singleElement = '<div class="behaviour-element"></div>';

describe(dirname, function () {
  describe(filename, function () {
    describe('run', function () {
      var fn = lib[this.title];

      function addTestBehaviors() {
        lib.add('testBehavior', function (context) {
          var el = document.createElement('div');
          el.setAttribute('class', 'behaviour-element');
          context.el.appendChild(el);
          return context;
        });
      }

      it('accepts shortcut notation', function () {
        var result;

        addTestBehaviors();
        result = fn({data: {_schema: {_has: 'testBehavior'}}, name: 'name', path: 'name'});
        expect(result.firstElementChild.outerHTML).to.equal(singleElement);
      });

      it('accepts inner shortcut notation', function () {
        var result;

        addTestBehaviors();
        result = fn({data: {_schema: {_has: ['testBehavior']}}, name: 'name', path: 'name'});
        expect(result.firstElementChild.outerHTML).to.equal(singleElement);
      });

      it('accepts normal notation', function () {
        var result;

        addTestBehaviors();
        result = fn({data: {_schema: {_has: [{ fn: 'testBehavior'}]}}, name: 'name', path: 'name'});
        expect(result.firstElementChild.outerHTML).to.equal(singleElement);
      });

      it('accepts multiple behaviors', function () {
        var result;

        addTestBehaviors();
        result = fn({data: {_schema: {_has: [{ fn: 'testBehavior'}, { fn: 'testBehavior' }]}}, name: 'name', path: 'name'});
        expect(result.firstElementChild.outerHTML).to.equal(singleElement);
        expect(result.firstElementChild.nextElementSibling.outerHTML).to.equal(singleElement);
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
        expect(fn({ fn: 'foo', baz: 'qux' })).to.eql([{
          fn: 'foo',
          args: { baz: 'qux' }
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
        }])).to.eql([{
            fn: 'foo',
            args: {}
          }, {
            fn: 'bar',
            args: { baz: 'qux' }
          }]);
      });

      it('gets mixed string and object behaviors in an array', function () {
        expect(fn(['foo', {
          fn: 'bar',
          baz: 'qux'
        }])).to.eql([{
            fn: 'foo',
            args: {}
          }, {
            fn: 'bar',
            args: { baz: 'qux' }
          }]);
      });
    });
  });
});
