//console.log(__filename);
//
//var _ = require('lodash'),
//  dirname = __dirname.split('/').pop(),
//  filename = __filename.split('/').pop().split('.').shift(),
//  sinon = require('sinon'),
//  lib = require('./ban-tk');
//
//describe(dirname, function () {
//  describe(filename, function () {
//    var sandbox;
//
//    beforeEach(function () {
//      sandbox = sinon.sandbox.create();
//    });
//
//    afterEach(function () {
//      sandbox.restore();
//    });
//
//    describe('validate', function () {
//      var fn = lib[this.title];
//
//      it('returns false if not component list', function () {
//        var state = {refs: {
//          'a/components/paragraph/instances/b': {},
//          'c/components/paragraph/instances/d': {},
//          'e/components/paragraph': {},
//          'f/components/article': {},
//          'g/components/article/instances/h': {}
//        }};
//
//        expect(fn(state)).to.equal([]);
//      });
//    });
//  });
//});
//
//console.log(__filename);
