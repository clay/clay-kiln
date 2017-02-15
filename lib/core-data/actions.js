import { assign } from 'lodash';
import preloader from '../preloader/actions';
import * as decorators from '../decorators/actions';

const actions = assign({}, decorators, { preload: preloader });

export default actions;
