'use strict';
var formcreator = require('./formcreator');

describe('formcreator service', function () {
  describe('createField()', function () {
    it('should create a single field', function () {
      expect(formcreator.createField('foo', { _has: 'bar' }, 'modal')).to.exist;
    });

    it('should recursively create fields', function () {
      expect(formcreator.createField('foo', { bar: { _has: 'baz' }, qux: { _has: 'baz' } }, 'modal')).to.exist;
    });
  });
});