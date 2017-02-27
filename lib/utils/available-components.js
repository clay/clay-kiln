import _ from 'lodash';
import store from '../core-data/store';

/**
 * determine if a component is available on the current site, based on logic
 * @param {string} slug e.g. "grubstreet"
 * @param {string} logic e.g. (di, press, thecut) or (not:di, not:press, not:thecut) or a mixture of both
 * @returns {boolean}
 */
function availableOnCurrentSite(slug, logic) {
  var tokens = logic.split(',').map((str) => str.trim()), // trim any extra whitespace
    // list of site slugs to include
    sitesToInclude = _.reject(tokens, (token) => _.includes(token, 'not:')),
    // list of site slugs to exclude (remove the "not:" from the tokens)
    sitesToExclude = _.map(_.filter(tokens, (token) => _.includes(token, 'not:')), (token) => token.replace(/not:\s?/ig, ''));

  if (!_.isEmpty(sitesToInclude)) {
    // if we have any sites explicitly included, then the component is available if we're
    // on one of those sites AND we're not on any sites in the excluded list
    // note: configuring "(siteName, otherSiteName, not:siteName)" is silly, but possible
    return _.includes(sitesToInclude, slug) && !_.includes(sitesToExclude, slug);
  } else {
    // if we don't explicitly include certain sites, then just make sure the
    // current site isn't excluded
    return !_.includes(sitesToExclude, slug);
  }
}

/**
 * see if a component can be added in this list,
 * by checking the exclude array and the current site
 * @param {string} str component name and optional site logic
 * @param {array} exclude
 * @returns {boolean}
 */
function filterComponent(str, exclude) {
  var matches = str.match(/([\w-]+)(?:\s?\((.*?)\))?/), // e.g. component-name (site logic)
    name = matches[1],
    siteLogic = matches[2];

  if (_.includes(exclude, name)) {
    // first, check to make sure a component isn't in the exclude list
    return false;
  } else if (siteLogic && !availableOnCurrentSite(store.state.site.slug, siteLogic)) {
    // then, check to make sure we can use this component on the current site
    return false;
  } else {
    // we can add this component to this list on this site!
    return true;
  }
}

/**
 * map through components, filtering out excluded
 * then filter out components not allowed on the current site
 * then remove any site logic (to only return the component names)
 * @param {array} possibleComponents
 * @param {array} [exclude] array of components to exclude
 * @returns {array} array of elements
 */
export default function getAvailable(possibleComponents, exclude) {
  return _.map(_.filter(possibleComponents, (item) => filterComponent(item, exclude)), (str) => str.replace(/\s?\(.*?\)/g, ''));
  // that regex removes anything in parenthesis (the site logic)
  // as well as any spaces between the name of the component and the parenthesis
}


