import { getJSON } from './api';
import { uriToUrl } from '../utils/urls';

const TEXT_PROP = 'text';

function flattenText(items) {
  const pluckedText = _.compact(_.map(items, TEXT_PROP)),
    hasTextProp = _.isString(_.head(pluckedText));

  return hasTextProp ? pluckedText : items;
}

export function getList(prefix, listName) {
  const uri = uriToUrl(prefix + '/lists/' + listName);

  return getJSON(uri)
    .then(flattenText);
}
