import _ from 'lodash';
import preloader from '../preloader/mutations';
import decorators from '../decorators/mutations';
import forms from '../forms/mutations';
import components from '../component-data/mutations';
import pageData from '../page-data/mutations';
import pageState from '../page-state/mutations';
import toolbar from '../toolbar/mutations';
import deepLinking from '../deep-linking/mutations';
import validators from '../validators/mutations';
import undo from '../undo/mutations';
import lists from '../lists/mutations';
import drawers from '../drawers/mutations';
import nav from '../nav/mutations';
import layout from '../layout-state/mutations';

// here we list some mutations that DO NOT AFFECT STATE,
// but are useful for plugins to listen for specific kinds of things in kiln.
// they don't follow the standard mutationTypes + function syntax, since they should
// only be referenced right here.
let vanityFunction = state => state,
  vanityMutations = [
    // each of these vanity mutations will get the vanityFunction applied
    'STOP_EDITING',
    'SWITCH_TAB', // when switching form/pane tabs
    'CREATE_PAGE',
    'FILTER_PAGELIST_SITE',
    'FILTER_PAGELIST_STATUS',
    'FILTER_PAGELIST_SEARCH',
    'OPEN_PREVIEW_LINK',
    'COPY_PREVIEW_LINK',
    'OPEN_VALIDATION_LINK',
    'CREATE_COMPONENTS',
    'DUPLICATE_COMPONENT',
    'DUPLICATE_COMPONENT_WITH_DATA',
    'FINISHED_DECORATING',
    'ADD_PAGE_TEMPLATE'
  ];

const mutations = _.assign({}, preloader, pageData, pageState, decorators, forms, components, toolbar, deepLinking, validators, undo, lists, drawers, nav, layout, _.reduce(vanityMutations, (obj, name) => _.assign(obj, { [name]: vanityFunction }), {}));

export default mutations;
