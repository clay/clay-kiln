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
import logger from './log';
// we also expose some vue components, which is useful for plugins that want to mimic our look and feel
// note: for keenUI components, please include them directly from keenUI
import avatar from './avatar.vue';
import filterableList from './filterable-list.vue';
import person from './person.vue';

// these utilities are exported so 3rd party plugins/validators/inputs/panes can access them.
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
  logger, // plugin authors, please instantiate a logger from this (passing in the filename / plugin used, e.g. `const log = logger(__filename)`)
  version: process.env.KILN_VERSION,
  // vue components
  avatar,
  filterableList,
  person
};

export default api;
