import _ from 'lodash';
import { filterBySite } from './site-filter';

/**
 * map through components, filtering out excluded
 * then filter out components not allowed on the current site
 * then remove any site logic (to only return the component names)
 * @param {object} store
 * @param {array} possibleComponents
 * @param {array} [exclude] array of components to exclude
 * @returns {array} array of elements
 */
export default function getAvailable(store, possibleComponents, exclude) {
  const currentSlug = _.get(store, 'state.site.slug'),
    filteredComponents = filterBySite(possibleComponents, currentSlug);

  return _.filter(filteredComponents, component => !_.includes(exclude, component));
}
