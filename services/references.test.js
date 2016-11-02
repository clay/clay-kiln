var references = require('./references');

describe('references service', function () {
  it('has editable attribute', function () {
    expect(references.editableAttribute).to.equal('data-editable');
  });

  it('has reference attribute', function () {
    expect(references.referenceAttribute).to.equal('data-uri');
  });

  it('has field attribute', function () {
    expect(references.fieldAttribute).to.equal('rv-field');
  });

  it('has reference property', function () {
    expect(references.referenceProperty).to.equal('_ref');
  });

  it('has field property', function () {
    expect(references.fieldProperty).to.equal('_has');
  });

  it('has behavior key', function () {
    expect(references.behaviorKey).to.equal('fn');
  });

  it('has display property', function () {
    expect(references.displayProperty).to.equal('_display');
  });

  it('has placeholder attribute', function () {
    expect(references.placeholderAttribute).to.equal('data-placeholder');
  });

  it('has placeholder property', function () {
    expect(references.placeholderProperty).to.equal('_placeholder');
  });

  it('has label property', function () {
    expect(references.labelProperty).to.equal('_label');
  });

  it('has component list property', function () {
    expect(references.componentListProperty).to.equal('_componentList');
  });

  it('has component property', function () {
    expect(references.componentProperty).to.equal('_component');
  });

  it('has groups property', function () {
    expect(references.groupsProperty).to.equal('_groups');
  });

  it('has description property', function () {
    expect(references.descriptionProperty).to.equal('_description');
  });

  describe('getComponentNameFromReference()', function () {
    it('gets name from default ref', function () {
      expect(references.getComponentNameFromReference('/components/base')).to.equal('base');
    });

    it('gets name from instance ref', function () {
      expect(references.getComponentNameFromReference('/components/base/instances/0')).to.equal('base');
    });

    it('gets name from html ref', function () {
      expect(references.getComponentNameFromReference('/components/base.html')).to.equal('base');
    });

    it('gets name from full uri', function () {
      expect(references.getComponentNameFromReference('nymag.com/press/components/base/instances/foobarbaz@published')).to.equal('base');
    });
  });

  describe('getInstanceIdFromReference()', function () {
    it('gets instance id from ref', function () {
      expect(references.getInstanceIdFromReference('/components/base/instances/0')).to.equal('0');
    });

    it('CANNOT get instance id from default ref', function () {
      expect(references.getInstanceIdFromReference('/components/base')).to.not.equal('0');
    });

    it('CANNOT get instance id from html ref', function () {
      expect(references.getInstanceIdFromReference('/components/base/instances/0.html')).to.not.equal('0');
    });
  });

  describe('replaceVersion', function () {
    const fn = references[this.title];

    it('adds version to base', function () {
      expect(fn('domain.com/pages/foo', 'bar')).to.equal('domain.com/pages/foo@bar');
    });

    it('replaces version', function () {
      expect(fn('domain.com/pages/foo@bar', 'baz')).to.equal('domain.com/pages/foo@baz');
    });

    it('removes version', function () {
      expect(fn('domain.com/pages/foo@bar')).to.equal('domain.com/pages/foo');
    });
  });
});
