const _ = require('lodash'),
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
    innerEl = filterableList.create(components, {
      click: function (id) {
        return addComponent(options.pane, options.field, id, options.ref)
          .then(() => close()); // only close pane if we added successfully
      }
    });

  return pane.open([{header: header, content: innerEl}]);
}

module.exports = openAddComponent;
_.set(window, 'kiln.services.panes.openAddComponent', module.exports);
