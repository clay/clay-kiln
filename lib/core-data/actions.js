import _ from 'lodash';
import preloader from '../preloader/actions';
import * as decorators from '../decorators/actions';
import * as forms from '../forms/actions';
import * as components from '../component-data/actions';
import * as pages from '../page-data/actions';
import * as pageState from '../page-state/actions';
import * as toolbar from '../toolbar/actions';
import * as panes from '../panes/actions';
import * as deepLinking from '../deep-linking/actions';
import * as validators from '../validators/actions';
import * as undo from '../undo/actions';

const actions = _.assign({}, decorators, forms, { preload: preloader }, components, pages, pageState, toolbar, panes, deepLinking, validators, undo);

export default actions;
