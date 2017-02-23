import _ from 'lodash';
import { create } from '@nymag/dom';
import { getTemplate, getLocals } from '../core-data/components';
import { attempt } from '../utils/promises';
import { refProp } from '../utils/references';

export function render(uri, data) {
  const tpl = getTemplate(uri),
    renderableData = _.assign({}, data, { locals: getLocals() });

  if (!renderableData[refProp]) {
    // if it doesn't have a reference property, add it for rendering
    // note: data from the server will have it
    renderableData[refProp] = uri;
  }

  return attempt(() => tpl(renderableData)).then((html) => create(html));
}
