var fixture = require('../test/fixtures/behavior'),
  autocomplete = require('./autocomplete'),
  dom = require('../services/dom'),
  sinon = require('sinon');

describe('autocomplete behavior', function () {

  var sandbox,
    fakeApi = '/lists/authors',
    fakeList = [
      'Amy Koran',
      'Zena Strother',
      'Karole Herdt',
      'Sheila Cowell',
      'Josiah Hagaman',
      'Beatris Doetsch',
      'Zachary Brunell',
      'Manuel Grassi',
      'Amie Ridgell',
      'Lupe Harrill',
      'Adriana Bakke',
      'Francoise Lashley',
      'Gwenn Sampley',
      'Randall Coller',
      'Terence Villegas',
      'Matthew Mcconnaughey',
      'Rosella Conroy',
      'Gemma Osburn',
      'Shanel Holt'
    ],
    fakeInput = document.createElement('input');

  beforeEach(function () {

    sandbox = sinon.sandbox.create();

    // reset element in fixture to have no children.
    dom.clearChildren(fixture.el);

  });

  afterEach(function () {
    sandbox.restore();
  });

  it('does not render a datalist if no api', function () {
    fixture.el.appendChild(fakeInput);
    expect(autocomplete(fixture, {}).el.querySelector('datalist')).to.equal(null);
  });

  it('does not render a datalist if no input', function () {
    expect(autocomplete(fixture, {api: fakeApi}).el.querySelector('datalist')).to.equal(null);
  });

  it('formats values into option elements', function () {
    expect(Array.prototype.slice.call(autocomplete.formatOptions(fakeList).querySelectorAll('option')).map(function (x) { return x.textContent; })).to.deep.equal(fakeList);
  });

  it('assigns an unique id to each datalist', function () {
    var firstId, secondId;

    fixture.el.appendChild(fakeInput);
    firstId = autocomplete(fixture, {api: fakeApi}).el.querySelector('datalist').id;

    dom.clearChildren(fixture.el);
    fixture.el.appendChild(fakeInput);
    secondId = autocomplete(fixture, {api: fakeApi}).el.querySelector('datalist').id;

    expect(firstId).to.not.equal(secondId);
  });

});
