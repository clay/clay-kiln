import _ from 'lodash';
import nymagHbs from 'nymag-handlebars';
import { isComponent, getComponentName, refProp, descProp, componentListProp, componentProp } from '../utils/references';
import { normalizeSiteData } from './site';

const ignoredKeys = [
    '_components',
    '_componentSchemas',
    '_pageData',
    '_layoutRef',
    refProp,
    '_self',
    'blockParams',
    'filename',
    'knownHelpers',
    'locals',
    'media',
    'site',
    'state',
    'template'
  ],
  hbs = nymagHbs();

let tabulaRasa = {
  // data for components and the current page
  components: {}, // component data, keyed by uri
  tree: {}, // tree of component refs. root has two props, pageURI and layoutURI
  page: {
    uri: null,
    data: {}, // page data
    state: {} // scheduled, published, etc
  },
  // data for lists
  lists: {
    users: [],
    authors: [],
    'new-pages': [],
    tags: []
  },
  // data for logged-in user
  user: {},
  // ui state management
  current: {
    form: {}, // currently open form
    pane: {}, // currently open pane
    selection: {}, // currently selected component
    focus: {}, // currently focused field / group
  },
  // publishing validation
  validation: {
    errors: [],
    warnings: []
  },
  // read-only
  schemas: {},
  locals: {},
  models: {},
  templates: {},
  site: {}
};

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
 * get page data and current state
 * @return {Promise}
 */
function getPageData() {
  // todo: get page data
  return Promise.resolve({});
}

/**
 * get data for lists
 * @return {Promise}
 */
function getLists() {
  // todo: get lists
  return Promise.resolve({});
}

/**
 * deeply reduce a tree of components
 * @param {object} result
 * @param  {*}   tree
 * @param  {Function} fn   to call when component object is found
 * @returns {object}
 */
function deepReduce(result, tree, fn) {
  if (_.isObject(tree) && tree[refProp] && isComponent(tree[refProp])) {
    // we found a component!
    fn(tree[refProp], tree);
  }

  if (_.isObject(tree)) {
    _.forOwn(tree, function (val, key) {
      if (!_.includes(key, '_') && !_.includes(ignoredKeys)) {
        // don't iterate through any of the templating/amphora metadata or locals/state
        deepReduce(result, val, fn);
      }
    });
  } else if (_.isArray(tree)) {
    _.each(tree, (item) => deepReduce(result, item, fn));
  }
  return result;
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

export default function preload() {
  const data = _.get(window, 'kiln.preloadData'),
    schemas = _.get(window, 'kiln.preloadSchemas'),
    locals = _.get(window, 'kiln.locals'),
    models = _.get(window, 'kiln.componentModels'),
    templates = _.get(window, 'kiln.componentTemplates'),
    user = locals && locals.user,
    site = locals && normalizeSiteData(locals.site),
    layoutSchema = getLayoutSchema(schemas, data._layoutRef);

  console.log(site)

  return Promise.all([getPageData(), getLists()]).then(function (promises) {
    const pageData = promises[0],
      lists = promises[1];

    return _.assign(tabulaRasa, {
      components: _.reduce(data, reduceComponents, {}),
      tree: reduceTree(data, layoutSchema),
      page: pageData,
      lists: lists,
      user: user,
      schemas: schemas,
      locals: locals,
      models: models,
      templates: _.reduce(templates, reduceTemplates, {}),
      site: site
    });
  });
}
