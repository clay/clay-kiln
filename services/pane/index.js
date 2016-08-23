var _ = require('lodash'),
  moment = require('moment'),
  dom = require('@nymag/dom'),
  ds = require('dollar-slice'),
  edit = require('../edit'),
  state = require('../page-state'),
  site = require('../site'),
  tpl = require('../tpl'),
  db = require('../edit/db'),
  datepicker = require('../field-helpers/datepicker'),
  paneController = require('../../controllers/pane'),
  filterableList = require('../filterable-list'),
  publishPaneController = require('../../controllers/publish-pane'),
  previewController = require('../../controllers/preview-pane'),
  references = require('../references'),
  addComponent = require('../components/add-component'),
  select = require('../components/select'),
  label = require('../label'),
  invisibleList = require('../components/invisible-list'),
  kilnHideClass = 'kiln-hide';

/**
 * add a disabled class to disabled tabs
 * @param {boolean} isDisabled
 * @returns {string}
 */
function setDisabled(isDisabled) {
  return isDisabled ? 'disabled' : '';
}

/**
 * create pane
 * @param {array} tabs
 * @param {object} [dynamicTab]
 * @returns {Element}
 */
function createPane(tabs, dynamicTab) {
  var el = tpl.get('.kiln-pane-template'),
    tabsEl = dom.find(el, '.pane-tabs'),
    tabsInnerEl = dom.find(el, '.pane-tabs-inner'),
    innerEl = dom.find(el, '.pane-inner');

  // loop through the tabs, adding the tab and contents
  _.each(tabs, function (tab, index) {
    var index1 = index + 1, // 1-indexed, for easier debugging
      contentWrapper = dom.create(`<div id="pane-content-${index1}" class="pane-content ${setDisabled(tab.disabled)}"></div>`);

    tabsInnerEl.appendChild(dom.create(`<span id="pane-tab-${index1}" data-content-id="pane-content-${index1}" class="pane-tab ${setDisabled(tab.disabled)}">${tab.header}</span>`));
    contentWrapper.appendChild(tab.content);
    innerEl.appendChild(contentWrapper);
  });

  // lastly, add the dynamic tab if it exists
  if (dynamicTab) {
    let contentWrapper = dom.create(`<div id="pane-content-dynamic" class="pane-content ${setDisabled(dynamicTab.disabled)}"></div>`);

    tabsEl.appendChild(dom.create(`<span id="pane-tab-dynamic" data-content-id="pane-content-dynamic" class="pane-tab-dynamic ${setDisabled(dynamicTab.disabled)}">${dynamicTab.header}</span>`));
    contentWrapper.appendChild(dynamicTab.content);
    innerEl.appendChild(contentWrapper);
  }

  return el;
}

/**
 * close an open pane
 */
function close() {
  var pane = dom.find('.kiln-toolbar-pane-background');

  if (pane) {
    dom.removeElement(pane);
  }
}

function findActiveTab(el, tabs, dynamicTab) {
  // it's faster to check the dynamic tab first, then iterate through the tabs
  if (dynamicTab && dynamicTab.active) {
    return {
      header: 'pane-tab-dynamic',
      content: 'pane-content-dynamic'
    };
  } else if (_.find(tabs, (tab) => tab.active)) {
    let active = _.findIndex(tabs, (tab) => tab.active) + 1; // 1-indexed

    return {
      header: `pane-tab-${active}`,
      content: `pane-content-${active}`
    };
  }
}

/**
 * open a pane
 * @param {array} tabs with `tab` and `content`
 * @param {object} dynamicTab will display at the right of the tabs
 * @returns {Element} pane
 */
function open(tabs, dynamicTab) {
  var toolbar = dom.find('.kiln-toolbar'),
    el = createPane(tabs, dynamicTab),
    active = findActiveTab(el, tabs, dynamicTab), // find active tab, if any
    pane, paneWrapper;

  close(); // close any other panes before opening a new one
  dom.insertBefore(toolbar, el);
  paneWrapper = toolbar.previousElementSibling; // now grab a reference to the dom
  // init controller for pane background, setting active tab if it exists
  ds.controller('paneWrapper', paneController);
  ds.get('paneWrapper', paneWrapper, active);
  // trick browser into doing a repaint, to force the animation
  setTimeout(function () {
    pane = dom.find(paneWrapper, '.kiln-toolbar-pane');
    pane.classList.add('on');
  }, 0);
  return paneWrapper;
}

function addPreview(preview) {
  if (preview) {
    return `<span class="error-preview">${preview}</span>`;
  } else {
    return '';
  }
}

/**
 * open preview + share pane
 * @returns {Element}
 */
function openPreview() {
  var pageUrl = edit.getPageUrl(),
    previewHeader = 'Preview',
    previewContent = tpl.get('.preview-actions-template'),
    shareHeader = 'Shareable Link',
    shareContent = tpl.get('.share-actions-template'),
    el;

  // set the page url into the responsive preview items
  _.each(dom.findAll(previewContent, 'a'), function (link) {
    link.setAttribute('href', pageUrl);
  });

  // set the page url into the share tab
  dom.find(shareContent, '.share-input').setAttribute('value', pageUrl);

  el = open([{ header: previewHeader, content: previewContent }, { header: shareHeader, content: shareContent }]);

  // init controller
  ds.controller('preview-pane', previewController);
  ds.get('preview-pane', el);
  return el;
}

/**
 * open the add component pane
 * @param {array} components
 * @param {object} options to call addComponent with
 * @returns {Element}
 */
function openAddComponent(components, options) {
  var header = 'Add Component',
    innerEl = filterableList.create(components, {
      click: function (id) {
        return addComponent(options.pane, options.field, id, options.ref)
          .then(() => close()); // only close pane if we added successfully
      }
    });

  return open([{header: header, content: innerEl}]);
}

function takeOffEveryZig() {
  var header = '<span class="ayb-header">HOW ARE YOU GENTLEMEN <em>!!</em></span>',
    messageEl = dom.create(`
      <img class="cats-ayb" src="${site.get('assetPath')}/media/components/clay-kiln/cats.png" />
      <div class="error-message ayb">ALL YOUR BASE ARE BELONG TO US</div>
    `),
    errorsEl = dom.create(`<div class="publish-error">
      <div class="label">YOU ARE ON THE WAY TO DESTRUCTION</div>
      <div class="description ayb">YOU HAVE NO CHANCE TO SURVIVE MAKE YOUR TIME</div>
    </div>`),
    innerEl = document.createDocumentFragment();

  innerEl.appendChild(messageEl);
  innerEl.appendChild(errorsEl);

  open([{header: header, content: innerEl}]);
}

/**
 * determine if an element is visible on the page
 * @param {Element} el
 * @returns {boolean}
 */
function showVisible(el) {
  // checking offsetParent works for all non-fixed elements,
  // and is much faster than checking getComputedStyle(el).display and visibility
  return el.offsetParent !== null;
}

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
 * @returns {Promise}
 */
function openComponents() {
  var searchHeader = 'Find Component',
    visibleComponents = _.filter(dom.findAll(`[${references.referenceAttribute}]`), showVisible).map(getName),
    currentSelected = dom.find('.component-selector-wrapper.selected'),
    searchContent = filterableList.create(visibleComponents, {
      click: function (id, el) {
        var currentSelectedItem = dom.find('.filtered-item.selected'),
          component = dom.find(`[${references.referenceAttribute}="${id}"]`);

        if (currentSelectedItem) {
          currentSelectedItem.classList.remove('selected');
        }

        select.unselect();
        select.select(component);
        select.scrollToComponent(component);
        el.classList.add('selected');
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

  return invisibleList.getListTabs().then(function (invisibleTabs) {
    el = open([{header: searchHeader, content: searchContent}].concat(invisibleTabs));

    // once the pane is created, make sure it's scrolled so that the current item is visible
    if (currentSelected && currentItem) {
      window.setTimeout(function () {
        dom.find(el, '.pane-inner').scrollTop = currentItem.offsetTop + currentItem.offsetHeight - 35;
      }, 300);
    }
  });
}

module.exports.close = close;
module.exports.open = open;
_.set(window, 'kiln.services.pane', module.exports); // export for plugins

// todo: split these out into separate files
module.exports.openPreview = openPreview;
module.exports.openAddComponent = openAddComponent;
module.exports.takeOffEveryZig = takeOffEveryZig;
module.exports.openComponents = openComponents;
