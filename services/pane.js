var _ = require('lodash'),
  keycode = require('keycode'),
  moment = require('moment'),
  dom = require('@nymag/dom'),
  ds = require('dollar-slice'),
  edit = require('./edit'),
  progress = require('./progress'),
  state = require('./page-state'),
  site = require('./site'),
  tpl = require('./tpl'),
  db = require('../services/edit/db'),
  datepicker = require('./field-helpers/datepicker'),
  paneController = require('../controllers/pane'),
  filterableList = require('./filterable-list'),
  publishPaneController = require('../controllers/publish-pane'),
  previewController = require('../controllers/preview-pane'),
  references = require('./references'),
  addComponent = require('./components/add-component'),
  select = require('./components/select'),
  label = require('./label'),
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

/**
 * create actions for undoing scheduling and publishing
 * @param {object} res
 * @returns {Element}
 */
function createUndoActions(res) {
  const undo = tpl.get('.publish-undo-template');

  let unpublish, unschedule;

  // show undo actions if either are available
  if (res.scheduled || res.published) {
    dom.find(undo, '.undo').classList.remove(kilnHideClass);
  }

  // unscheduling
  if (res.scheduled) {
    state.toggleButton('scheduled', true); // just in case someone else scheduled this page
    unschedule = dom.find(undo, '.unschedule');
    if (unschedule) {
      unschedule.classList.remove(kilnHideClass);
    }
  }

  // unpublish (only affects page)
  if (res.published) {
    state.toggleButton('published', true); // just in case someone else published this page
    unpublish = dom.find(undo, '.unpublish');
    if (unpublish) {
      unpublish.classList.remove(kilnHideClass);
    }
  }

  return undo;
}

/**
 * create validation messages
 * @param {object} validation
 * @returns {Element}
 */
function createPublishValidation(validation) {
  var errors = validation.errors,
    warnings = validation.warnings;

  if (errors.length) {
    let el = document.createDocumentFragment(),
      messagesEl = tpl.get('.publish-error-message-template'),
      errorsEl = addErrorsOrWarnings(errors),
      warningsEl = addErrorsOrWarnings(warnings, 'publish-warning');

    el.appendChild(messagesEl);
    el.appendChild(errorsEl);
    el.appendChild(warningsEl);

    return el;
  } else if (warnings.length) {
    let el = document.createDocumentFragment(),
      messageEl = tpl.get('.publish-warning-message-template'),
      // same way the error pane does it
      errorsEl = addErrorsOrWarnings(warnings, 'publish-warning');

    el.appendChild(messageEl);
    el.appendChild(errorsEl);

    return el;
  } else {
    return tpl.get('.publish-valid-template');
  }
}

/**
 * create the health dynamic pane header
 * @param {object} validation
 * @returns {string}
 */
function createHealthHeader(validation) {
  var header = tpl.get('.health-header-template'),
    errors = validation.errors,
    warnings = validation.warnings;

  if (errors.length) {
    dom.find(header, '.errors').classList.remove(kilnHideClass);
  } else if (warnings.length) {
    dom.find(header, '.warnings').classList.remove(kilnHideClass);
  } else {
    dom.find(header, '.valid').classList.remove(kilnHideClass);
  }

  return header.firstElementChild.innerHTML;
}

/**
 * create messages for the publish pane, depending on the state
 * @param {object} res
 * @returns {Element}
 */
function createPublishMessages(res) {
  var messages = tpl.get('.publish-messages-template'),
    scheduleMessage, stateMessage;

  if (res.published) {
    stateMessage = dom.find(messages, '.publish-state-message');
    if (stateMessage && res.publishedAt) {
      stateMessage.innerHTML = `Published ${state.formatTime(res.publishedAt)}.`;
    } else if (stateMessage) {
      stateMessage.innerHTML = 'Page is currently published.';
    }
  }

  if (res.scheduled) {
    scheduleMessage = dom.find(messages, '.publish-schedule-message');
    if (scheduleMessage) {
      scheduleMessage.innerHTML = `Scheduled to publish ${state.formatTime(res.scheduledAt)}.`;
      scheduleMessage.classList.remove(kilnHideClass);
    }
  }

  return messages;
}

/**
 * get scheduled date
 * @param {object} res
 * @param {boolean} [res.scheduled]
 * @param {string} [res.scheduledAt]
 * @returns {object}
 */
function getScheduledValues(res) {
  var at = res.scheduled ? moment(res.scheduledAt) : moment(),
    date = at.format('YYYY-MM-DD'),
    time = at.format('HH:mm');

  return { date, time };
}

/**
 * create actions for the publish pane, depending on the state
 * @param {object} res
 * @returns {Element}
 */
function createPublishActions(res) {
  const actions = tpl.get('.publish-actions-template'),
    val = getScheduledValues(res);

  let scheduleDate, scheduleTime;

  // set date and time
  if (actions) {
    scheduleDate = dom.find(actions, '#schedule-date');
    scheduleTime = dom.find(actions, '#schedule-time');

    if (scheduleDate) {
      scheduleDate.setAttribute('min', val.date);
      scheduleDate.setAttribute('value', val.date);
      scheduleDate.setAttribute('placeholder', val.date);
    }

    if (scheduleTime) {
      scheduleTime.setAttribute('value', val.time);
      scheduleTime.setAttribute('placeholder', val.time);
    }

    // init datepicker for non-native browsers
    datepicker.init(scheduleDate, {static: true});
    datepicker.init(scheduleTime, {static: true});
  }

  return actions;
}

/**
 * create the form to set a custom url
 * @param {object} res which may contain customUrl
 * @returns {Element}
 */
function createLocationForm(res) {
  const form = tpl.get('.custom-url-form-template'),
    val = res.customUrl;

  if (val) {
    // remove the site prefix when displaying the url in the form
    // it'll be added when saving the form
    dom.find(form, '.custom-url-input').value = val.replace(db.uriToUrl(site.get('prefix')), '');
  }

  return form;
}

/**
 * open publish pane
 * @param {object} validation
 * @param {Object[]} validation.errors
 * @param {Object[]} validation.warnings
 * @returns {Promise}
 */
function openPublish(validation) {
  var pubContent = document.createDocumentFragment(),
    locationContent = document.createDocumentFragment(),
    healthContent = document.createDocumentFragment();

  return state.get().then(function (res) {
    var tabs, dynamicTab, el;

    // append publish message and actions to the doc fragment
    pubContent.appendChild(createUndoActions(res));
    pubContent.appendChild(createPublishMessages(res));
    pubContent.appendChild(createPublishActions(res));

    locationContent.appendChild(createLocationForm(res));

    // add dynamic pane with validation
    healthContent.appendChild(createPublishValidation(validation));

    // if there are errors, make the health tab active when the pane opens
    // and disable the publish tab
    if (_.get(validation, 'errors.length')) {
      // publish is disabled
      tabs = [{
        header: 'Publish',
        content: pubContent,
        disabled: true
      }, {
        header: 'Location',
        content: locationContent
      }];
      dynamicTab = {
        header: createHealthHeader(validation),
        content: healthContent,
        active: true // health tab is active when pane opens
      };
    } else {
      tabs = [{
        header: 'Publish',
        content: pubContent,
        active: true // publish tab is active when pane opens
      }, {
        header: 'Location',
        content: locationContent
      }];
      dynamicTab = {
        header: createHealthHeader(validation),
        content: healthContent
      };
    }

    // create pane!
    el = open(tabs, dynamicTab);

    // init controller for publish pane
    ds.controller('publish-pane', publishPaneController);
    ds.get('publish-pane', el);
  });
}

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
        dom.replaceElement(form, el);
      }
    });

    form.addEventListener('submit', function (e) {
      var value = input.value,
        id = _.last(dom.pageUri().split('/'));

      e.preventDefault();
      progress.start('page');
      current.push({
        id: id,
        title: value
      });

      return db.save(site.get('prefix') + '/lists/new-pages', current)
      .then(function () {
        close();
        progress.done('page');
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
      return open([{header: 'New Page', content: innerEl}]);
    });
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
 * format and assemble error messages
 * @param {Object[]} errors (or warnings)
 * @param {string} [modifier] modifier class for warnings, info, etc
 * @returns {Element}
 */
function addErrorsOrWarnings(errors, modifier) {
  return _.reduce(errors, function (el, error) {
    var errorEl = tpl.get('.publish-errors-template'),
      errorLabel = dom.find(errorEl, '.label'),
      labelVal = _.get(error, 'rule.label'),
      descVal = _.get(error, 'rule.description'),
      errorDescription = dom.find(errorEl, '.description'),
      list = dom.find(errorEl, '.errors');

    // add rule label if it exists
    if (errorLabel) {
      errorLabel.innerHTML = labelVal ? `${labelVal}:` : 'There was a problem:';
      // note the colon after the label, hence using a ternary operator
    }

    // add rule description if it exists
    if (errorDescription) {
      errorDescription.innerHTML = descVal || 'Please see below for details';
    }

    // add each place where the error/warning occurs
    _.each(error.errors, function (item) {
      var itemEl = dom.create(`<li><span class="error-label">${item.label}</span>${addPreview(item.preview)}</li>`);

      list.appendChild(itemEl);
    });

    el.appendChild(errorEl);
    // add modifier class if it exists
    if (modifier) {
      dom.find(el, '.publish-error').classList.add(modifier);
    }
    return el;
  }, document.createDocumentFragment());
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

  el = open([{header: searchHeader, content: searchContent}]);

  // once the pane is created, make sure it's scrolled so that the current item is visible
  if (currentSelected && currentItem) {
    window.setTimeout(function () {
      dom.find(el, '.pane-inner').scrollTop = currentItem.offsetTop + currentItem.offsetHeight - 35;
    }, 300);
  }
}

module.exports.close = close;
module.exports.open = open;
module.exports.openNewPage = openNewPage;
module.exports.openPublish = openPublish;
module.exports.openPreview = openPreview;
module.exports.openAddComponent = openAddComponent;
module.exports.takeOffEveryZig = takeOffEveryZig;
module.exports.openComponents = openComponents;
_.set(window, 'kiln.services.pane', module.exports); // export for plugins
