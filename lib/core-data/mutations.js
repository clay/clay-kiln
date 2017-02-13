import { assign } from 'lodash';
import preloader from '../preloader/mutations';
import page from '../page/mutations';

const mutations = assign({}, preloader, page);

export default mutations;
