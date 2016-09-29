const _ = require('lodash'),
  dom = require('@nymag/dom'),
  filterableList = require('../filterable-list'),
  references = require('../references'),
  select = require('../components/select'),
  label = require('../label'),
  visibleComponents = require('../components/visible-components'),
  invisibleList = require('../components/invisible-list'),
  head = require('../components/head-components'),
  promises = require('../promises'),
  pane = require('./');

/**
 * get name of component from the component's element
 * @param {Element} el
 * @returns {string}
 */
function getName(el) {
  var ref = el.getAttribute(references.referenceAttribute);

  return {
    id: ref,
    title: label(references.getComponentNameFromReference(ref))
  };
}

/**
 * open the component search pane
 * @param {string} [path] optional path to a head component list that should be active
 * @returns {Promise}
 */
function openComponents(path) {
  var searchHeader = 'Find Component',
    currentSelected = dom.find('.component-selector-wrapper.selected'),
    visibleList = visibleComponents.list().map(getName),
    searchContent = filterableList.create(visibleList, {
      click: function (id, el) {
        var currentSelectedItem = dom.find('.filtered-item.selected'),
          component = dom.find(`[${references.referenceAttribute}="${id}"]`);

        if (currentSelectedItem) {
          currentSelectedItem.classList.remove('selected');
        }

        select.select(component);
        select.scrollToComponent(component);
        el.classList.add('selected');
        pane.close(); // Close the pane so user can interact with component
      },
      inputPlaceholder: 'Search all visible components'
    }),
    currentItem, el;

  if (currentSelected) {
    currentItem = dom.find(searchContent, `[data-item-id="${currentSelected.getAttribute(references.referenceAttribute)}"]`);

    if (currentItem) {
      currentItem.classList.add('selected');
    }
  }

  return promises.props({
    head: head.getListTabs(path),
    invisible: invisibleList.getListTabs(path)
  }).then(function (resolved) {
    el = pane.open([{header: searchHeader, content: searchContent}].concat(resolved.head, resolved.invisible));

    // once the pane is created, make sure it's scrolled so that the current item is visible
    if (currentSelected && currentItem) {
      window.setTimeout(function () {
        dom.find(el, '.pane-inner').scrollTop = currentItem.offsetTop + currentItem.offsetHeight - 35;
      }, 300);
    }

    return el;
  });
}


module.exports = openComponents;
_.set(window, 'kiln.services.panes.openComponents', module.exports);
