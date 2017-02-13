import { reduce } from 'lodash';
import { basename, extname } from 'path';

// grab icons from the filesystem (webpack adds them as raw strings)
const iconsContext = require.context('../../media', false, /.*\.svg$/),
  icons = reduce(iconsContext.keys(), function (obj, key) {
    const name = basename(key, extname(key));

    obj[name] = iconsContext(key);
    return obj;
  }, {});

export default icons;
