import { assign } from 'lodash';
import preloader from '../preloader/actions';
import * as decorators from '../decorators/actions';
import * as forms from '../forms/actions';
import * as components from '../component-data/actions';
import * as pages from '../page-data/actions';
import * as toolbar from '../toolbar/actions';
import * as panes from '../panes/actions';

const actions = assign({}, decorators, forms, { preload: preloader }, components, pages, toolbar, panes);

export default actions;
