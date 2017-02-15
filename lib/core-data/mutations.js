import { assign } from 'lodash';
import preloader from '../preloader/mutations';
import page from '../page/mutations';
import decorators from '../decorators/mutations';
import forms from '../forms/mutations';

const mutations = assign({}, preloader, page, decorators, forms);

export default mutations;
