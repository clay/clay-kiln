const _ = require('lodash'),
  allComponents = require('../components/all-components'),
  filterableList = require('../filterable-list'),
  addComponent = require('../components/add-component'),
  pane = require('./');

/**
 * open the add component pane
 * @param {array} components
 * @param {object} options to call addComponent with
 * @returns {Element}
 */
function openAddComponent(components, options) {
  var header = 'Add Component',
    isFuzzy = options.isFuzzy,
    listOptions = {
      click: function (id) {
        return addComponent(options.pane, options.field, id, options.ref)
          .then(() => pane.close()); // only close pane if we added successfully
      }
    },
    innerEl;

  // if an add-component pane is "fuzzy", it means that you can scroll to the bottom
  // of the pane to open up a list of ALL available components.
  // in the future, this will be restricted by permissions
  if (isFuzzy) {
    listOptions.addTitle = 'View all components';
    listOptions.add = function openFuzzyComponents() {
      pane.close();
      return pane.open([{ header: 'All Components', content: filterableList.create(allComponents(), {
        click: function (id) {
          return addComponent(options.pane, options.field, id, options.ref)
            .then(() => pane.close()); // only close pane if we added successfully
        }
      }) }]);
    };
  }

  innerEl = filterableList.create(components, listOptions);

  return pane.open([{header: header, content: innerEl}]);
}

module.exports = openAddComponent;
_.set(window, 'kiln.services.panes.openAddComponent', module.exports);
