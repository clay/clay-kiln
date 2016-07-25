var _ = require('lodash'),
  dom = require('@nymag/dom'),
  site = require('../services/site');

/**
 * Create options for select.
 * @param {[string]} options
 * @returns {string}
 */
function createOptions(options) {
  return _.map(options, function (option) {
    return `<option value="${option}">${ _.startCase(option) || 'None' }</option>`;
  }).join('\n');
}

/**
 * create a field from some options
 * @param {string} name
 * @param {array} options
 * @returns {Element}
 */
function createField(name, options) {
  return dom.create(`
    <label class="input-label">
      <select class="editor-select" rv-field="${name}" rv-value="${name}.data.value">
        ${ createOptions(options) }
      </select>
    </label>
  `);
}

/**
 * Replace result.el with select drop-down of options
 * @param {{name: string}} result
 * @param {obejct} args
 * @param {array} args.sites
 * @param {array} args.default
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    defaultOptions = args.default,
    currentSite = site.get('slug'),
    matched = _.find(args.sites, (siteConfig) => siteConfig.slug === currentSite);

  if (matched) {
    // search for a site slug to match
    result.el = createField(name, matched.options);
  } else if (defaultOptions) {
    // use default options if no site matches
    result.el = createField(name, defaultOptions);
  } else {
    // if no sites match and there are no default options, that's a programmer error
    throw new Error(`${name} » site-specific-selector: No options specified for current site!`);
  }

  return result;
};
