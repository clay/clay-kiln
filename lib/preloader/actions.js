import _ from 'lodash';
import nymagHbs from 'nymag-handlebars';
import { getComponentName, descProp, componentListProp, componentProp } from '../utils/references';
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
 * extract component data from preloadData obj
 * @param  {obj} result
 * @param  {obj} val
 * @return {obj}
 */
function reduceComponents(result, val) {
  return deepReduce(result, val, function (ref, val) {
    result[ref] = val;
  });
}

/**
 * recursively reduce component refs,
 * producing objects with _parent and refs
 * @param  {string} parentUri
 * @return {object}
 */
function reduceDeepArea(parentUri) {
  return function (result, val) {
    return deepReduce(result, val, function (ref, data) {
      result[ref] = _.reduce(data, reduceDeepArea(ref), { _parent: parentUri });
    });
  };
}

/**
 * build tree of component references
 * @param {string} root uri (page or layout uri)
 * @param  {array} areas to check against
 * @return {object}
 */
function reduceDeepTree(root, areas) {
  return function (result, val, key) {
    if (_.includes(areas, key)) {
      const parentUri = root;

      _.reduce(val, reduceDeepArea(parentUri), result);
    }

    return result;
  };
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
 * extract tree of component refs from preloadData obj
 * @param {object} original
 * @param {object} layoutSchema
 * @return {obj}
 */
function reduceTree(original, layoutSchema) {
  const pageAreas = _.filter(Object.keys(layoutSchema), function (key) {
      return key !== descProp && _.get(layoutSchema, `${key}.${componentListProp}.page`) || _.get(layoutSchema, `${key}.${componentProp}.page`);
    }),
    layoutAreas = _.filter(Object.keys(layoutSchema), function (key) {
      return key !== descProp && !_.includes(pageAreas, key);
    }),
    pageRoot = original._self,
    layoutRoot = original._layoutRef;

  return {
    [pageRoot]: _.reduce(original, reduceDeepTree(pageRoot, pageAreas), {}),
    [layoutRoot]: _.reduce(original, reduceDeepTree(layoutRoot, layoutAreas), {}),
  };
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

export default function preload({ commit }) {
  const data = _.get(window, 'kiln.preloadData'),
    schemas = _.get(window, 'kiln.preloadSchemas'),
    locals = _.get(window, 'kiln.locals'),
    models = _.get(window, 'kiln.componentModels'),
    templates = _.get(window, 'kiln.componentTemplates'),
    user = locals && locals.user,
    site = locals && normalizeSiteData(locals.site),
    layoutSchema = getLayoutSchema(schemas, data._layoutRef),
    tabulaRasa = _.assign({}, defaultState),
    components = _.reduce(data, reduceComponents, {});

  commit(PRELOAD_PENDING);
  commit(START_PROGRESS, 'offline');

  return getPageState(data._self).then((pageState) => {
    commit(PRELOAD_SUCCESS, _.assign(tabulaRasa, {
      components: _.assign(components, composeLayoutData(layoutSchema, components, data)),
      tree: reduceTree(data, layoutSchema),
      page: {
        uri: data._self,
        data: data._pageData,
        state: pageState
      },
      user: user,
      schemas: schemas,
      locals: locals,
      models: models,
      templates: _.reduce(templates, reduceTemplates, {}),
      site: site
    }));
    commit(LOADING_SUCCESS);
    commit(FINISH_PROGRESS, getPageStatus(pageState));
  });
}
