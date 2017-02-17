import _ from 'lodash';
import { getTemplate, getLocals } from '../core-data/components';
import { attempt } from '../utils/promises';
import { create } from '@nymag/dom';

export function render(uri, data) {
  const tpl = getTemplate(uri);

  return attempt(() => tpl(_.assign({}, data, { locals: getLocals() }))).then((html) => create(html));
}
