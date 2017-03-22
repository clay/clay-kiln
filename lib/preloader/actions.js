import _ from 'lodash';
import nymagHbs from 'nymag-handlebars';
import { getComponentName, componentListProp, refProp } from '../utils/references';
import deepReduce from '../utils/deep-reduce';
import { normalizeSiteData } from '../core-data/site';
import { PRELOAD_PENDING, PRELOAD_SUCCESS, LOADING_SUCCESS } from './mutationTypes';
import { START_PROGRESS, FINISH_PROGRESS } from '../toolbar/mutationTypes';
import getPageState from '../page/page-state';
import defaultState from './default-state';

const hbs = nymagHbs();

/**
 * get schema for a layout
 * @param  {object} schemas
 * @param  {string} layoutRef
 * @return {object}
 */
function getLayoutSchema(schemas, layoutRef) {
  return schemas[getComponentName(layoutRef)];
}

/**
 * normalize a potential component list
 * @param  {array} arr which may be component list or just data
 * @return {array}
 */
function normalizeComponentList(arr) {
  if (_.has(_.head(arr), refProp)) {
    // it's a component list! only return the references
    return _.map(arr, (item) => _.pick(item, refProp));
  } else {
    // just component data, move along
    return arr;
  }
}

/**
 * normalize a potential component property
 * @param  {object} obj which may be a component prop or just data
 * @return {object}
 */
function normalizeComponentProp(obj) {
  if (_.has(obj, refProp)) {
    // it's a component prop! only return the reference
    return { [refProp]: obj[refProp] };
  } else {
    // just component data, move along
    return obj;
  }
}

/**
 * remove child component data, leaving only their references
 * @param  {object} data
 * @return {object}
 */
function normalize(data) {
  let cleanData = {};

  _.forOwn(data, (val, key) => {
    if (_.isArray(val)) {
      // possibly a component list
      cleanData[key] = normalizeComponentList(val);
    } else if (_.isObject(val)) {
      // possibly a component prop
      cleanData[key] = normalizeComponentProp(val);
    } else {
      // literally any other bit of data
      cleanData[key] = val;
    }
  });

  return cleanData;
}

/**
 * extract component data from preloadData obj
 * @param  {obj} result
 * @param  {obj} val
 * @return {obj}
 */
function reduceComponents(result, val) {
  return deepReduce(result, val, function (ref, val) {
    result[ref] = normalize(val);
  });
}

/**
 * extract layout data from original data
 * @param  {object} layoutSchema schema for layout
 * @param  {object} components   key/value store of components
 * @param  {object} original     original preloaded data
 * @return {object}
 */
function composeLayoutData(layoutSchema, components, original) {
  const layoutData = _.reduce(layoutSchema, (result, val, key) => {
    const isPage = _.has(val, `${componentListProp}.page`),
      isList = _.has(val, componentListProp);

    if (isPage) {
      // if it's a page area, simply return the string alias
      result[key] = key; // note: assumes layout prop is the same as page area prop
    } else if (isList) {
      // if it's an actual layout component list, grab the data
      result[key] = original[key];
    }
    return result;
  }, {});

  return { [original._layoutRef]: layoutData };
}

/**
 * make precompiled hbs templates ready for user
 * @param  {obj} result
 * @param  {obj} val
 * @param  {string} key
 * @return {obj}
 */
function reduceTemplates(result, val, key) {
  const tpl = hbs.template(val);

  hbs.registerPartial(key, tpl); // register template as partial
  result[key] = tpl; // and add it to the store
  return result;
}

/**
 * get string state to pass to progress bar
 * @param  {object} state
 * @return {string}
 */
function getPageStatus(state) {
  if (state.scheduled) {
    return 'scheduled';
  } else if (state.published) {
    return 'published';
  } else {
    return 'draft';
  }
}

/**
 * Turn the hash string on the location
 * into an object
 *
 * @return {Object}
 */
function parseUrl() {
  if (window.location.hash) {
    let props = window.location.hash.replace('#', '').split('&'),
      propMapping = {};

    _.forEach(props, prop => {
      var split = prop.split('=');

      propMapping[split[0]] = split[1];
    });

    return propMapping;
  } else {
    return null;
  }
}

export default function preload({ commit, dispatch }) {
  const data = _.get(window, 'kiln.preloadData'),
    schemas = _.get(window, 'kiln.preloadSchemas'),
    locals = _.get(window, 'kiln.locals'),
    models = _.get(window, 'kiln.componentModels'),
    templates = _.get(window, 'kiln.componentTemplates'),
    user = locals && locals.user,
    site = locals && normalizeSiteData(locals.site),
    layoutSchema = getLayoutSchema(schemas, data._layoutRef),
    tabulaRasa = _.assign({}, defaultState),
    components = _.reduce(data, reduceComponents, {}),
    urlProps = parseUrl();

  commit(PRELOAD_PENDING);
  commit(START_PROGRESS, 'offline');

  return getPageState(data._self).then((pageState) => {
    commit(PRELOAD_SUCCESS, _.assign(tabulaRasa, {
      components: _.assign(components, composeLayoutData(layoutSchema, components, data)),
      page: {
        uri: data._self,
        data: _.assign(data._pageData, { layout: data._layoutRef }),
        state: pageState
      },
      user: user,
      schemas: schemas,
      locals: locals,
      models: models,
      templates: _.reduce(templates, reduceTemplates, {}),
      site: site,
      url: urlProps
    }));
    commit(LOADING_SUCCESS);
    dispatch('createSnapshot');
    commit(FINISH_PROGRESS, getPageStatus(pageState));
  });
}
