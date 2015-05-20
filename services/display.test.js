'use strict';
var shouldDisplay = require('./display');

describe('display service', function () {
  it('should display inline', function () {
    expect(shouldDisplay('inline', { _display: 'inline'})).to.equal(true);

    expect(shouldDisplay('inline', { _display: 'meta'})).to.equal(false);
    expect(shouldDisplay('inline', { _display: 'modal'})).to.equal(false);
    expect(shouldDisplay('inline')).to.equal(false);
  });

  it('should display meta', function () {
    expect(shouldDisplay('meta', { _display: 'meta'})).to.equal(true);

    expect(shouldDisplay('meta', { _display: 'inline'})).to.equal(false);
    expect(shouldDisplay('meta', { _display: 'modal'})).to.equal(false);
    expect(shouldDisplay('meta')).to.equal(false);
  });

  it('should display modal', function () {
    expect(shouldDisplay('modal', { _display: 'modal'})).to.equal(true);
    expect(shouldDisplay('modal')).to.equal(true);

    expect(shouldDisplay('modal', { _display: 'inline'})).to.equal(false);
    expect(shouldDisplay('modal', { _display: 'meta'})).to.equal(false);
  });

  it('should default to modal', function () {
    expect(shouldDisplay({ _display: 'modal'})).to.equal(true);
    expect(shouldDisplay()).to.equal(true);
    
    expect(shouldDisplay({ _display: 'inline'})).to.equal(false);
    expect(shouldDisplay({ _display: 'meta'})).to.equal(false);
  });
});