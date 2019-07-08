/**
 * toggle between edit and view modes
 * @param  {object} location stub for testing
 */
export default function toggleEdit(location) {
  const query = '?edit=true',
    endQuery = '&edit=true';

  let url,
    queryIndex,
    endQueryIndex;

  location = location || /* istanbul ignore next: can't stub window.location */ window.location;
  url = `${location.protocol}//${location.host}${location.pathname}${location.search}`; // don't keep the hash
  queryIndex = url.indexOf(query);
  endQueryIndex = url.indexOf(endQuery);

  if (queryIndex > -1) {
    url = url.substring(0, queryIndex);
  } else if (endQueryIndex > -1) {
    url = url.substring(0, endQueryIndex);
  } else if (url.indexOf('?') > -1) {
    url = url + endQuery;
  } else {
    url = url + query;
  }

  location.assign(url);
}
