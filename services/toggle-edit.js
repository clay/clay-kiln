function toggleEdit() {
  var url = location.href,
    query = '?edit=true',
    endQuery = '&edit=true',
    queryIndex = url.indexOf(query),
    endQueryIndex = url.indexOf(endQuery);

  if (queryIndex > -1) {
    url =  url.substring(0, queryIndex);
  } else if (endQueryIndex > -1) {
    url = url.substring(0, endQueryIndex);
  } else if (url.indexOf('?') > -1) {
    url = url + endQuery;
  } else {
    url = url + query;
  }

  location.href = url;
}

module.exports = toggleEdit;
