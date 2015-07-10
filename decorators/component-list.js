var _ = require('lodash'),
  references = require('../services/references'),
  dom = require('../services/dom');

/**
 * click handler for adding a component
 * @param {event} e
 */
function addComponent(e) {
  var componentName = e.target.getAttribute('data-component-name');

  e.stopPropagation();
  console.log('adding component: ' + componentName); // todo: actually add the component and render it
}

/**
 * create a new button for each component
 * @param {string} item name
 * @returns {element} buttonEl
 */
function createComponentButton(item) {
  var buttonEl = dom.create(`<button class="add-component" data-component-name="${item}">${item}</button>`);

  buttonEl.addEventListener('click', addComponent);
  return buttonEl;
}

/**
 * map through components, filtering out excluded
 * @param {array} possibleComponents
 * @param {array} [exclude] array of components to exclude
 * @returns {array} array of elements
 */
function getButtons(possibleComponents, exclude) {
  return _.compact(_.map(possibleComponents, function (item) {
    if (exclude && exclude.length) {
      if (!_.contains(exclude)) {
        return createComponentButton(item);
      }
    } else {
      return createComponentButton(item);
    }
  }));
}

/**
 * create pane and buttons
 * @param {object} args
 * @returns {Element}
 */
function createPane(args) {
  var include = args.include,
    exclude = args.exclude,
    allComponents = ['paragraph'], // todo: get list of all components
    tpl =
      `<section class="component-list-bottom">
        <div class="open-add-components">
          <span class="open-add-components-inner">+</span>
        </div>
        <section class="add-components-pane">
        </section>
      </section>`,
    pane = dom.create(tpl),
    buttons;

  // figure out what components should be available for adding
  if (include && include.length) {
    buttons = getButtons(include, exclude);
  } else {
    buttons = getButtons(allComponents, exclude);
  }

  // put add components buttons into the pane
  _.each(buttons, function (button) {
    dom.find(pane, '.add-components-pane').appendChild(button);
  });

  return pane;
}

/**
 * match when schema says it's a component list
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {boolean}
 */
function when(el, options) {
  var schema = _.get(options, 'data._schema');

  return schema.hasOwnProperty(references.componentListProperty);
}

/**
 * add "add component" button
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Element}
 */
function handler(el, options) {
  var args = _.get(options, 'data._schema.' + references.componentListProperty),
    pane, button;

  // if _componentList: true, make the args an object
  args = _.isObject(args) ? args : {};

  // create the pane
  pane = createPane(args);
  button = dom.find(pane, '.open-add-components');

  // add click events to toggle pane
  button.addEventListener('click', function () {
    var addComponentsPane = dom.find(pane, '.add-components-pane');

    button.classList.toggle('open');
    addComponentsPane.classList.toggle('open');
  });

  // add the pane to the end of the component list
  el.appendChild(pane);

  return el;
}

module.exports.when = when;
module.exports.handler = handler;
