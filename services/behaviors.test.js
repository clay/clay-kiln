'use strict';
var b = require('./behaviors');

describe('behaviors service', function () {
  describe('getExpandedBehaviors()', function () {
    it('gets a behavior defined as a string', function () {
      expect(b.getExpandedBehaviors('foo')).to.eql([{
        fn: 'foo',
        args: {}
      }]);
    });

    it('gets a behavior defined as an object', function () {
      console.log(b.getExpandedBehaviors({ fn: 'foo', baz: 'qux' }))
      expect(b.getExpandedBehaviors({ fn: 'foo', baz: 'qux' })).to.eql([{
        fn: 'foo',
        args: { baz: 'qux' }
      }]);
    });

    it('gets an array of string behaviors', function () {
      expect(b.getExpandedBehaviors(['foo', 'bar'])).to.eql([{
        fn: 'foo',
        args: {}
      }, {
        fn: 'bar',
        args: {}
      }]);
    });

    it('gets an array of object behaviors', function () {
      expect(b.getExpandedBehaviors([{
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
      expect(b.getExpandedBehaviors(['foo', {
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

    it('throws an error if you pass in anything that it can\'t parse', function () {
      expect(function () { b.getExpandedBehaviors(); }).to.throw(Error);
      expect(function () { b.getExpandedBehaviors(''); }).to.throw(Error);
      expect(function () { b.getExpandedBehaviors(1); }).to.throw(Error);
      expect(function () { b.getExpandedBehaviors([]); }).to.throw(Error);
      expect(function () { b.getExpandedBehaviors({}); }).to.throw(Error);
      expect(function () { b.getExpandedBehaviors(/^\w$/i); }).to.throw(Error);
    });
  });
});