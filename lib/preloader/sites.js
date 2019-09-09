import _ from 'lodash';
import { getObject } from '../core-data/api';


/**
 * get all sites (used by page list)
 * @param  {object} currentSite
 * @return {promise|undefined}
 */
export default function getSites(currentSite) {
  const prefix = currentSite && currentSite.prefix;

  if (prefix) {
    return getObject(`${prefix}/_sites`).then((res) => {
      return _.reduce(res, (sites, rawSite) => {
        const slug = _.get(rawSite, '_source.slug'),
          subsiteSlug = _.get(rawSite, '_source.subsiteSlug');

        sites[subsiteSlug || slug] = rawSite._source;

        return sites;
      }, {});
    });
  }
}
