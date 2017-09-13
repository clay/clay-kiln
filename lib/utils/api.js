import * as caret from './caret';
import * as create from '../component-data/create';
import * as componentElements from './component-elements';
import * as headComponents from './head-components';
import icon from './icon.vue';
import interpolate from './interpolate';
import label from './label';
import * as promises from './promises';
import * as references from './references';
import * as urls from './urls';
import getAvailableComponents from './available-components';
import * as local from './local';
import * as validationHelpers from '../validators/helpers';

// these utilities are exported so 3rd party plugins/validators/behaviors/panes can access them.
// note: the store is passed into those things automatically, so don't export it here
const api = {
  componentElements,
  caret,
  create,
  headComponents,
  icon,
  interpolate,
  label,
  promises,
  references,
  urls,
  getAvailableComponents,
  local,
  validationHelpers,
  version: process.env.KILN_VERSION
};

export default api;
