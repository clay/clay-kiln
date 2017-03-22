import { assign } from 'lodash';
import preloader from '../preloader/mutations';
import page from '../page/mutations';
import decorators from '../decorators/mutations';
import forms from '../forms/mutations';
import components from '../component-data/mutations';
import pages from '../page-data/mutations';
import panes from '../panes/mutations';
import toolbar from '../toolbar/mutations';
import deepLinking from '../deep-linking/mutations';
import validators from '../validators/mutations';
import undo from '../undo/mutations';

const mutations = assign({}, preloader, page, decorators, forms, components, pages, panes, toolbar, deepLinking, validators, undo);

export default mutations;
