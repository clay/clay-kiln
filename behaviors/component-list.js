var _ = require('lodash'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var name = result.bindings.name,
    min = args.min,
    max = args.max,
    include = args.include,
    exclude = args.exclude,
    components = result.bindings.data,
    tpl = `
      <section class="component-list" data-field="${name}" rv-value="data">
        <div class="component-list-item" rv-each-component="componentEls" rv-html="component.outerHTML">
        </div>
        <section class="component-list-bottom">
          <div class="open-add-components" rv-on-click="toggleAddComponents">
            <span class="open-add-components-inner">+</span>
          </div>
          <section class="add-components-pane">
          </section>
        </section>
      </section>
    `,
    list = dom.create(tpl),
    allComponents = ['paragraph'], // todo: get list of all components
    buttons;

  /**
   * click handler for adding a component
   * @param {event} e
   */
  function addComponent(e) {
    var componentName = e.target.getAttribute('data-component-name');

    e.stopPropagation();
    alert('adding component: ' + componentName); // todo: actually add the component and render it
  }

  /**
   * create a new add-component button
   * @param {string} item name
   * @returns {element} buttonEl
   */
  function createButton(item) {
    var buttonEl = dom.create(`<button class="add-component" data-component-name="${item}">${item}</button>`);

    buttonEl.addEventListener('click', addComponent);
    return buttonEl;
  }

  /**
   * map through components, filtering out excluded
   * @param {array} possibleComponents
   * @returns {array} array of elements
   */
  function getButtons(possibleComponents) {
    return _.map(possibleComponents, function (item) {
      if (exclude && exclude.length) {
        if (!_.contains(exclude)) {
          return createButton(item);
        }
      } else {
        return createButton(item);
      }
    });
  }

  // figure out what components should be available for adding
  if (include && include.length) {
    buttons = getButtons(include);
  } else {
    buttons = getButtons(allComponents);
  }

  // put add components buttons into the pane
  _.each(buttons, function (button) {
    dom.find(list, '.add-components-pane').appendChild(button);
  });

  // get the html of each component in the list
  // put it into the bindings
  result.bindings.componentEls = _.map(components, function (component) {
    return dom.find('[data-ref="' + component._ref + '"]');
  });

  result.bindings.toggleAddComponents = function (e, bindings) {
    var button = dom.find(list, '.open-add-components'),
      addComponentsPane = dom.find(list, '.add-components-pane');

    button.classList.toggle('open');
    addComponentsPane.classList.toggle('open');
  };

  result.el = list;

  return result;
};
