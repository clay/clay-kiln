import _ from 'lodash';
import preloader from '../preloader/mutations';
import decorators from '../decorators/mutations';
import forms from '../forms/mutations';
import components from '../component-data/mutations';
import pageData from '../page-data/mutations';
import pageState from '../page-state/mutations';
import panes from '../panes/mutations';
import toolbar from '../toolbar/mutations';
import deepLinking from '../deep-linking/mutations';
import validators from '../validators/mutations';
import undo from '../undo/mutations';

const mutations = _.assign({}, preloader, pageData, pageState, decorators, forms, components, panes, toolbar, deepLinking, validators, undo);

export default mutations;
