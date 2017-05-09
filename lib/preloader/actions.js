import _ from 'lodash';
import nymagHbs from 'nymag-handlebars';
import { props } from '../utils/promises';
import { getObject } from '../core-data/api';
import { getComponentName, componentListProp } from '../utils/references';
import deepReduce from '../utils/deep-reduce';
import { normalizeSiteData } from '../core-data/site';
import { PRELOAD_PENDING, PRELOAD_SUCCESS, LOADING_SUCCESS } from './mutationTypes';
import { START_PROGRESS, FINISH_PROGRESS } from '../toolbar/mutationTypes';
import getPageState from '../page-state';
import defaultState from './default-state';
import normalize from '../utils/normalize-component-data';
import getSites from './sites';

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
    const hashProps = window.location.hash.replace('#', '').split('»'),
      propMapping = {
        component: hashProps[0],
        instance: hashProps[1],
        path: hashProps[2]
      };

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

  return props({
    pageState: getPageState(data._self),
    pageData: getObject(data._self),
    allSites: getSites(site),
    listData: dispatch('getListData', { uri: data._self, prefix: site.prefix })
  }).then(({pageState, pageData, allSites, listData}) => {
    // register custom helpers
    window.kiln.helpers = window.kiln.helpers || {};
    _.forOwn(window.kiln.helpers, (helperFn, helperName) => {
      hbs.registerHelper(helperName, helperFn);
    });

    // add preloaded data to the store
    commit(PRELOAD_SUCCESS, _.assign(tabulaRasa, {
      components: _.assign(components, composeLayoutData(layoutSchema, components, data)),
      page: {
        uri: data._self,
        data: pageData,
        state: pageState,
        listData
      },
      user,
      schemas,
      locals,
      models,
      templates: _.reduce(templates, reduceTemplates, {}),
      site,
      allSites,
      url: urlProps
    }));
    commit(LOADING_SUCCESS);
    dispatch('createSnapshot');
    commit(FINISH_PROGRESS, getPageStatus(pageState));
  });
}
