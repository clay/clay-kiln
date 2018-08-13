import _ from 'lodash';
import clayHBS from 'clayhandlebars';
import { props } from '../utils/promises';
import { getObject } from '../core-data/api';
import { getComponentName, componentListProp } from '../utils/references';
import deepReduce from '../utils/deep-reduce';
import { normalizeSiteData } from '../core-data/site';
import { PRELOAD_PENDING, PRELOAD_SUCCESS, LOADING_SUCCESS } from './mutationTypes';
import defaultState from './default-state';
import normalize from '../utils/normalize-component-data';
import getSites from './sites';
import parseUrl from './parse-url';
import { hasAnyBehaviors, convertSchema } from '../core-data/behaviors2input';
import { getItem } from '../utils/local';

/**
 * @module preloader
 */

const hbs = clayHBS();

/**
 * get component models so we can mount them on window.kiln.componentModels
 * @param  {object} modules
 * @return {object}
 */
function getComponentModels(modules) {
  Object.keys(modules)
    .filter((key) => _.endsWith(key, '.model'))
    .forEach((key) => {
      window.kiln.componentModels[key.replace('.model', '')] = window.require(key);
    });

  return window.kiln.componentModels;
}

/**
 * get schema for a layout
 * @param  {object} schemas
 * @param  {string} layoutRef
 * @return {object}
 */
function getLayoutSchema(schemas, layoutRef) {
  const name = getComponentName(layoutRef),
    schema = schemas[name];

  if (hasAnyBehaviors(schema)) {
    return convertSchema(schema, name);
  } else {
    return schema;
  }
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

export default function preload({ commit, dispatch }) {
  const data = _.get(window, 'kiln.preloadData'),
    schemas = _.get(window, 'kiln.preloadSchemas'),
    locals = _.get(window, 'kiln.locals'),
    models = getComponentModels(window.modules),
    templates = _.get(window, 'kiln.componentTemplates'),
    user = locals && locals.user,
    site = locals && normalizeSiteData(locals.site),
    layoutSchema = getLayoutSchema(schemas, data._layoutRef),
    tabulaRasa = _.assign({}, defaultState),
    components = _.reduce(data, reduceComponents, {}),
    urlProps = parseUrl();

  commit(PRELOAD_PENDING);

  return props({
    pageState: dispatch('getListData', { uri: data._self, prefix: site.prefix }),
    layoutState: dispatch('fetchLayoutState', { uri: data._layoutRef, prefix: site.prefix, user: user }),
    pageData: getObject(data._self),
    allSites: getSites(site),
    favoritePageCategory: getItem('kiln-page-category')
  }).then(({ pageState, layoutState, pageData, allSites, favoritePageCategory }) => {
    // register custom helpers
    window.kiln.helpers = window.kiln.helpers || {};
    _.forOwn(window.kiln.helpers, (helperFn, helperName) => {
      hbs.registerHelper(helperName, helperFn);
    });

    // add preloaded data to the store
    commit(PRELOAD_SUCCESS, _.assign(tabulaRasa, {
      components: _.assign(components, composeLayoutData(layoutSchema, components, data)),
      componentVariations: _.get(data, '_componentVariations'),
      page: {
        uri: data._self,
        data: pageData,
        state: pageState
      },
      layout: layoutState,
      user,
      schemas: _.mapValues(schemas, (schema, name) => {
        if (hasAnyBehaviors(schema)) {
          return convertSchema(schema, name);
        } else {
          return schema;
        }
      }),
      locals,
      models,
      templates: _.reduce(templates, reduceTemplates, {}),
      site,
      allSites,
      url: urlProps
    }));
    commit(LOADING_SUCCESS);
    // if the user has a favorite new page category set,
    // make sure it'll be in the state when they open that list
    if (favoritePageCategory) {
      commit('CHANGE_FAVORITE_PAGE_CATEGORY', favoritePageCategory);
    }
    dispatch('createSnapshot');
    dispatch('finishProgress', getPageStatus(pageState));
  });
}
