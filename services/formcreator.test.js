'use strict';
var formcreator = require('./formcreator');

describe('formcreator service', function () {
  describe('createField()', function () {
    it('should create a single field', function () {
      expect(formcreator.createField('foo', { schema: {_has: 'bar'}, data: '' }, 'modal')).to.exist;
    });

    it('should recursively create fields', function () {
      var partials = {schema: { _has: 'baz' }, data: ''};
      expect(formcreator.createField('foo', { bar: partials, qux: partials }, 'modal')).to.exist;
    });
  });
});