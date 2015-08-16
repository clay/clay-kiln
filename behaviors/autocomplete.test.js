var fixture = require('../test/fixtures/behavior'),
  autocomplete = require('./autocomplete'),
  db = require('../services/edit/db'),
  site = require('../services/site'),
  dom = require('../services/dom');

describe('autocomplete behavior', function () {

  var sandbox,
    fakeListArg = 'authors',
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
    fakeObjList = fakeList.map(function (text) { return {text: text}; }),
    fakeInput = document.createElement('input');

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub(db);

    site.set({prefix: 'place.com/'});

    // Autocomplete expects an input element, so resets fixture.el and adds input element each time.
    dom.clearChildren(fixture.el);
    fixture.el.appendChild(fakeInput);

  });

  afterEach(function () {
    sandbox.restore();
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
      return autocomplete(fixture, {list: fakeListArg});
    }
    expect(noInput).to.throw(/Autocomplete requires a text input./);
  });

  it('assigns an unique id to each datalist', function () {
    var firstId, secondId;

    firstId = autocomplete(fixture, {list: fakeListArg}).el.querySelectorAll('datalist')[0].id;
    secondId = autocomplete(fixture, {list: fakeListArg}).el.querySelectorAll('datalist')[1].id;

    expect(firstId).to.not.equal(secondId);
  });

  it('gets options from API on focus', function () {
    var resultEl = autocomplete(fixture, {list: fakeListArg}).el; // Run behavior and get the resulting element.

    db.get.returns(Promise.resolve(fakeList));

    resultEl.querySelector('input').dispatchEvent(new Event('focus')); // Trigger focus event.
    expect(db.get.called).to.equal(true);
  });

  it('formats values into option elements', function () {
    expect(Array.prototype.slice.call(autocomplete.formatOptions(fakeList).querySelectorAll('option')).map(function (x) { return x.textContent; })).to.deep.equal(fakeList);
  });

  it('formats values into option elements (when list is an array of objects)', function () {
    expect(Array.prototype.slice.call(autocomplete.formatOptions(fakeObjList).querySelectorAll('option')).map(function (x) { return x.textContent; })).to.deep.equal(fakeList);
  });

});
