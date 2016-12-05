const _ = require('lodash'),
  keycode = require('keycode'),
  dom = require('@nymag/dom'),
  edit = require('../edit'),
  progress = require('../progress'),
  site = require('../site'),
  db = require('../edit/db'),
  filterableList = require('../filterable-list'),
  pane = require('./index');

/**
 * create a new page based on the provided ID
 * note: if successful, will redirect to the new page.
 * otherwise, will display an error message
 * @param {string} id
 * @returns {Promise}
 */
function createPageByType(id) {
  return edit.createPage(id)
    .then(function (url) {
      location.href = url;
    })
    .catch(function () {
      progress.done('error');
      progress.open('error', 'Error creating new page', true);
    });
}

/**
 * add the current page to the list of available pages
 * @param {array} current pages
 * @returns {Function}
 */
function addCurrentPage(current) {
  return function (el) {
    var form = dom.create(`<form class="add-page-form">
        <input type="text" placeholder="Page Name" />
        <button type="submit">Add Page To List</button>
      </form>`),
      input = dom.find(form, 'input');

    input.addEventListener('keydown', function (e) {
      var key = keycode(e);

      if (key === 'esc') {
        e.stopPropagation(); // don't close pane when esc is hit
        dom.replaceElement(form, el);
      }
    });

    form.addEventListener('submit', function (e) {
      var value = input.value,
        id = _.last(dom.pageUri().split('/'));

      e.preventDefault();
      progress.start('save');
      current.push({
        id: id,
        title: value
      });

      return db.save(site.get('prefix') + '/lists/new-pages', current)
      .then(function () {
        pane.close();
        progress.done();
        progress.open('page', `<em>${value}</em> added to new pages list`, true);
      })
      .catch(function () {
        progress.done('error');
        progress.open('error', 'Error creating new page', true);
      });
    });

    dom.replaceElement(el, form);
    input.focus();
  };
}

/**
 * open new page/edit layout dialog pane
 * @returns {Promise}
 */
function openNewPage() {
  // /lists/new-pages contains a site-specific array of pages that should be available
  // to clone, each one having a `id` (the page id) and `title` (the button title) property
  // note: this shouldn't be cached
  return db.get(`${site.get('prefix')}/lists/new-pages`)
    .then(function (items) {
      var innerEl = filterableList.create(items, {
        click: createPageByType,
        add: addCurrentPage(items),
        addTitle: 'Add Current Page To List'
      });

      // create pane
      return pane.open([{header: 'New Page', content: innerEl}], null, 'left');
    });
}

module.exports = openNewPage;
_.set(window, 'kiln.services.panes.openNewPage', module.exports);
