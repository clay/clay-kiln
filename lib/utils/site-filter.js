import _ from 'lodash';

const itemRegex = /([^\(\n]+)(?:\((.*?)\))?/;

/**
 * determine if an item is available on a specific site, based on logic
 * @param  {string} logic e.g. (di, press, thecut) or (not:di, not:press, not:thecut) or a mixture of both
 * @param  {string} slug e.g. "grubstreet"
 * @return {boolean}
 */
function matchLogic(logic, slug) {
  const tokens = logic.split(',').map(str => str.trim()),
    // list of site slugs to include
    sitesToInclude = _.reject(tokens, token => _.includes(token, 'not:')),
    // list of site slugs to exclude (remove the "not:" from the tokens)
    sitesToExclude = _.map(_.filter(tokens, token => _.includes(token, 'not:')), token => token.replace(/not:\s?/ig, ''));

  if (!_.isEmpty(sitesToInclude)) {
    // if the item is specifically included on certain sites, it's available
    // note: if you've also excluded it, it won't be available
    // doing that is silly (e.g. "foo-item (siteName, otherSiteName, not:siteName)") but possible
    return _.includes(sitesToInclude, slug) && !_.includes(sitesToExclude, slug);
  } else {
    // if we don't explicitly include certain sites, then just make sure the
    // current site isn't excluded
    return !_.includes(sitesToExclude, slug);
  }
}

/**
 * filter an array of items by a site slug
 * e.g. ['foo (site1, site2)', 'bar (not: site1)']
 * e.g. [{ value: 'foo', text: 'Foo', sites: 'not:site1' }]
 * @param  {array} items
 * @param  {string} slug
 * @return {array} items without site logic
 */
export function filterBySite(items, slug) {
  if (!slug) {
    throw new Error('Please specify a slug to match items against!');
  }

  return _.reduce(items, (result, item) => {
    let value,
      logic;

    if (_.isString(item)) {
      const matches = item.match(itemRegex);

      value = matches && matches[1] ? matches[1].trim() : item; // allow emptystring in value
      logic = matches && matches[2] && matches[2].trim();
    } else {
      value = item;
      logic = item.sites;
    }

    if (!logic || matchLogic(logic, slug)) {
      // items with no logic are available
      // items with logic that matches the site slug are available
      return result.concat(value);
    } else {
      return result;
    }
  }, []);
}
