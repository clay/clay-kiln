import { assign } from 'lodash';
import preloader from '../preloader/actions';
import * as decorators from '../decorators/actions';
import * as forms from '../forms/actions';
import * as components from '../component-data/actions';

const actions = assign({}, decorators, forms, { preload: preloader }, components);

export default actions;
