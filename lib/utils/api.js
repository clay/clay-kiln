import * as caret from './caret';
import * as create from '../component-data/create';
import * as componentElements from './component-elements';
import * as headComponents from './head-components';
import interpolate from './interpolate';
import label from './label';
import * as promises from './promises';
import * as references from './references';
import * as urls from './urls';
import getAvailableComponents from './available-components';
import * as local from './local';
import * as validationHelpers from '../validators/helpers';
import * as fieldHelpers from '../forms/field-helpers';
import logger from './log';
// we also expose some vue components, which is useful for plugins that want to mimic our look and feel
import avatar from './avatar.vue';
import filterableList from './filterable-list.vue';
import person from './person.vue';
import timepicker from './timepicker.vue';
import navMenuButton from '../nav/nav-menu-button.vue';
import {
  isComponent, isDefaultComponent, getComponentInstance, getComponentVersion, replaceVersion
} from 'clayutils';
// and finally we expose certain KeenUI components that we want plugins to be able to use
import UiAlert from 'keen/UiAlert';
import UiAutocomplete from 'keen/UiAutocomplete';
import UiButton from 'keen/UiButton';
import UiCheckbox from 'keen/UiCheckbox';
import UiCheckboxGroup from 'keen/UiCheckboxGroup';
import UiCollapsible from 'keen/UiCollapsible';
import UiDatepicker from 'keen/UiDatepicker';
import UiFileupload from 'keen/UiFileupload';
import UiIcon from 'keen/UiIcon';
import UiIconButton from 'keen/UiIconButton';
import UiMenu from 'keen/UiMenu';
import UiModal from 'keen/UiModal';
import UiProgressCircular from 'keen/UiProgressCircular';
import UiRadioGroup from 'keen/UiRadioGroup';
import UiRippleInk from 'keen/UiRippleInk';
import UiSelect from 'keen/UiSelect';
import UiSlider from 'keen/UiSlider';
import UiSwitch from 'keen/UiSwitch';
import UiTabs from 'keen/UiTabs';
import UiTab from 'keen/UiTab';
import UiTextbox from 'keen/UiTextbox';
import UiTooltip from 'keen/UiTooltip';

// these utilities are exported so 3rd party plugins/validators/inputs/panes can access them.
// note: the store is passed into those things automatically, so don't export it here
const api = {
  componentElements,
  caret,
  create,
  headComponents,
  interpolate,
  label,
  promises,
  // add all the clayutils functions that used to live in references.js
  references: Object.assign({}, references, {
    isComponent, isDefaultComponent, getComponentInstance, getComponentVersion, replaceVersion
  }),
  urls,
  getAvailableComponents,
  local,
  validationHelpers,
  fieldHelpers,
  logger, // plugin authors, please instantiate a logger from this (passing in the filename / plugin used, e.g. `const log = logger(__filename)`)
  version: process.env.KILN_VERSION,
  components: {
    // vue components
    avatar,
    filterableList,
    person,
    timepicker,
    navMenuButton,
    // keen components
    UiAlert,
    UiAutocomplete,
    UiButton,
    UiCheckbox,
    UiCheckboxGroup,
    UiCollapsible,
    UiDatepicker,
    UiFileupload,
    UiIcon,
    UiIconButton,
    UiMenu,
    UiModal,
    UiProgressCircular,
    UiRadioGroup,
    UiRippleInk,
    UiSelect,
    UiSlider,
    UiSwitch,
    UiTabs,
    UiTab,
    UiTextbox,
    UiTooltip
  }
};

export default api;
