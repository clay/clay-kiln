var fixture = require('../test/fixtures/behavior'),
  autocomplete = require('./autocomplete'),
  dom = require('../services/dom');

describe('autocomplete behavior', function () {

  var fakeApi = '/lists/authors',
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

    // Autocomplete expects an input element, so resets fixture.el and adds input element each time.
    dom.clearChildren(fixture.el);
    fixture.el.appendChild(fakeInput);

  });

  it('throws error if no api', function () {
    function noApi() {
      return autocomplete(fixture, {});
    }
    expect(noApi).to.throw(/Autocomplete requires an API./);
  });

  it('throws error if no input', function () {
    dom.clearChildren(fixture.el); // Remove input that was added by beforeEach.
    function noInput() {
      return autocomplete(fixture, {api: fakeApi});
    }
    expect(noInput).to.throw(/Autocomplete requires a text input./);
  });

  it('formats values into option elements', function () {
    expect(Array.prototype.slice.call(autocomplete.formatOptions(fakeList).querySelectorAll('option')).map(function (x) { return x.textContent; })).to.deep.equal(fakeList);
  });

  it('assigns an unique id to each datalist', function () {
    var firstId, secondId;

    firstId = autocomplete(fixture, {api: fakeApi}).el.querySelectorAll('datalist')[0].id;
    secondId = autocomplete(fixture, {api: fakeApi}).el.querySelectorAll('datalist')[1].id;

    expect(firstId).to.not.equal(secondId);
  });

});
