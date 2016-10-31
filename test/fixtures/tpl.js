const dom = require('@nymag/dom'),
  _ = require('lodash');

// minimal templates, only what we need to test the logic and functionality
function stubWrapperTemplate() {
  return dom.create(`<div class="kiln-toolbar-pane-background">
    <div class="kiln-toolbar-pane">
      <header class="pane-tabs">
        <div class="pane-tabs-inner"></div>
      </header>
      <div class="pane-inner"></div>
    </div>
  </div>`);
}

function stubHealthTemplate() {
  return dom.create(`<div class="health-header-wrapper">
    <span class="health-icon valid kiln-hide">{% include 'public/media/components/clay-kiln/health-valid.svg' %}</span>
    <span class="health-icon warnings kiln-hide">{% include 'public/media/components/clay-kiln/health-warnings.svg' %}</span>
    <span class="health-icon errors kiln-hide">{% include 'public/media/components/clay-kiln/health-errors.svg' %}</span>
    <span class="health-header">Health</span>
  </div>`);
}

function stubUndoTemplate() {
  return dom.create(`<div><div class="publish-undo undo kiln-hide">
    <button class="unpublish kiln-hide">Unpublish Page</button>
    <button class="unschedule kiln-hide">Unschedule</button>
  </div></div>`);
}

function stubValidTemplate() {
  return dom.create('<div class="publish-valid">valid</div>');
}

function stubMessageTemplate() {
  return dom.create(`<div class="publish-messages messages">
    <p class="publish-state-message">In Draft.</p>
    <p class="publish-schedule-message kiln-hide">Scheduled to publish</p>
  </div>`);
}

function stubPublishTemplate() {
  return dom.create(`<div class="publish-actions actions">
    <button class="publish-now">Publish Now</button>
    <form class="schedule">
      <label class="schedule-label" for="schedule-date">Date</label>
      <input id="schedule-date" class="schedule-input" type="date" min="" value="" placeholder=""></input>
      <label class="schedule-label" for="schedule-time">Time</label>
      <input id="schedule-time" class="schedule-input" type="time" value="" placeholder=""></input>
      <button class="schedule-publish">Schedule Publish</button>
    </form>
  </div>`);
}

function stubCustomUrlTemplate() {
  return dom.create(`<form class="custom-url-form">
    <label for="custom-url" class="custom-url-message">Designate a custom URL for this page. This should only be used for special cases.</p>
    <input id="custom-url" class="custom-url-input" type="text" placeholder="/special-page.html" />
    <button type="submit" class="custom-url-submit">Save Location</button>
  </form>`);
}

function stubPreviewActionsTemplate() {
  return dom.create(`<ul class="preview-actions actions">
    <li class="preview-item">
      <a class="preview-link small">
        <span class="preview-link-size">s</span>
        <span class="preview-link-text">Small</span>
        <span class="preview-link-icon">↑</span>
      </a>
    </li>
    <li class="preview-item">
      <a class="preview-link medium">
        <span class="preview-link-size">m</span>
        <span class="preview-link-text">Medium</span>
        <span class="preview-link-icon">↑</span>
      </a>
    </li>
    <li class="preview-item">
      <a class="preview-link large">
        <span class="preview-link-size">l</span>
        <span class="preview-link-text">Large</span>
        <span class="preview-link-icon">↑</span>
      </a>
    </li>
  </ul>`);
}

function stubShareActionsTemplate() {
  return dom.create(`<div class="info-message">Share the link below to preview the latest version of this page.</div>
  <div class="share-actions actions">
    <input class="share-input"></input>
    <button class="share-copy">{% include 'public/media/components/clay-kiln/copy.svg' %}</button>
  </div>`);
}

function stubErrorsTemplate() {
  return dom.create(`<div class="publish-error">
    <span class="label">There was a problem:</span>
    <span class="description">Please see below for details</span>
    <ul class="errors"></ul>
  </div>`);
}

function stubErrorTemplate() {
  return dom.create('<div>ERROR MESSAGE</div>');
}

function stubWarningTemplate() {
  return dom.create('<div>WARNING MESSAGE</div>');
}

function stubFilteredInputTemplate() {
  return dom.create('<input class="filtered-input" />');
}

function stubFilteredItemsTemplate() {
  return dom.create('<div><ul class="filtered-items"></div>');
}

function stubFilteredAddTemplate() {
  return dom.create(`<div class="filtered-add">
    <button class="filtered-add-button" title="Add To List">+</button>
    <span class="filtered-add-title">Add To List</span>
  </div>`);
}

function stubFilteredItemTemplate() {
  // wrapper divs to simulate doc fragments
  return dom.create(`<div><li class="filtered-item">
    <button class="filtered-item-reorder kiln-hide" title="Reorder">=</button>
    <span class="filtered-item-title"></span>
    <button class="filtered-item-settings kiln-hide" title="Settings">*</button>
    <button class="filtered-item-remove kiln-hide" title="Remove">X</button>
  </li></div>`);
}

function stubComponentSelectorTemplate() {
  return dom.create(`<aside class="component-selector">
    <aside class="component-selector-top">
      <div class="selected-info">
        <span class="selector-location">
          <span class="selector-this-page" title="This Page"></span>
          <span class="selector-many-pages" title="Multiple Pages"></span>
        </span>
        <span class="selector-button selected-label"></span>
      </div>
      <div class="selected-actions">
        <button class="selector-button selected-action-settings kiln-hide" title="Component Settings"></button>
        <button class="selector-button selected-action-delete kiln-hide" title="Delete Component"></button>
      </div>
    </aside>
    <aside class="component-selector-bottom">
      <div class="selector-navigation">
        <button class="selector-button selector-nav-up" title="Previous Visible Component"></button>
        <button class="selector-button selector-nav-down" title="Next Visible Component"></button>
      </div>
      <button class="selector-button selected-add kiln-hide" title="Add Component"></button>
      <button class="selector-button selected-replace kiln-hide" title="Replace Component"></button>
    </aside>
  </aside>`);
}

function stubPlaceholderTemplate() {
  return dom.create(`<div>
    <span class="placeholder-label"></span>
    <span class="placeholder-add-component kiln-hide" title="Add Component To List"></span>
  </div>`);
}

function stubSettingsTabTemplate() {
  return dom.create(`<ul class="settings-tab-items">
    <li class="settings-item"><button class="directory">Directory</button></li>
  </ul>`);
}

/**
 * stub all arguments provided
 * @param {array} args
 * @param {object} tplStub (stubbed tpl service)
 */
function stubAll(args, tplStub) {
  _.each(args, function (arg) {
    tplStub.get.withArgs(arg).returns(module.exports[arg]());
  });
}

module.exports = {
  '.kiln-pane-template': stubWrapperTemplate,
  '.health-header-template': stubHealthTemplate,
  '.publish-undo-template': stubUndoTemplate,
  '.publish-valid-template': stubValidTemplate,
  '.publish-messages-template': stubMessageTemplate,
  '.publish-actions-template': stubPublishTemplate,
  '.preview-actions-template': stubPreviewActionsTemplate,
  '.share-actions-template': stubShareActionsTemplate,
  '.publish-errors-template': stubErrorsTemplate,
  '.publish-error-message-template': stubErrorTemplate,
  '.publish-warning-message-template': stubWarningTemplate,
  '.custom-url-form-template': stubCustomUrlTemplate,
  '.filtered-input-template': stubFilteredInputTemplate,
  '.filtered-items-template': stubFilteredItemsTemplate,
  '.filtered-add-template': stubFilteredAddTemplate,
  '.filtered-item-template': stubFilteredItemTemplate,
  '.component-selector-template': stubComponentSelectorTemplate,
  '.placeholder-template': stubPlaceholderTemplate,
  '.settings-tab-template': stubSettingsTabTemplate,
  stubAll: stubAll
};
