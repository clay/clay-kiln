import { assign } from 'lodash';
import preloader from '../preloader/mutations';
import page from '../page/mutations';
import decorators from '../decorators/mutations';

const mutations = assign({}, preloader, page, decorators);

export default mutations;
