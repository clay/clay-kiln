import _ from 'lodash';
import { isPage, isLayout } from 'clayutils';
import { getWithRevision, getHTML, getMeta } from '../core-data/api';
import { UPDATE_COMPONENT } from '../component-data/mutationTypes';
import { UPDATE_PAGE } from '../page-data/mutationTypes';
import { UPDATE_PAGE_STATE } from '../page-state/mutationTypes';
import { render as modelRender } from '../component-data/model';
import { resolveSchema } from '../component-data/create';
import { rebaseHistory } from '../undo/actions';
import {
  refProp, editAttr, refAttr, getComponentName, hooksExt, componentListProp, componentProp, fieldProp
} from '../utils/references';
import logger from '../utils/log';
import ctx, {
  getRev, advanceRev, isSaving, markKnown, writeCount
} from './context';
import { isComponentInHead } from '../utils/component-elements';
import { getComponentListStart } from '../utils/head-components';
import { changedFields } from './merge';
import { componentLabel } from './presence';
import {
  COLLAB_ACTIVITY, COLLAB_PENDING, COLLAB_PENDING_DONE, COLLAB_FLASH, COLLAB_FLASH_DONE
} from './mutationTypes';

const log = logger(__filename),
  FLASH_MS = 2500,
  CATCH_UP_BATCH = 6, // components re-read at once when catching up
  // a change this tab missed while reconnecting, by nobody the feed told it about
  CATCH_UP_EVENT = { type: 'save', by: { reconnecting: true } },
  RECENT_EDIT_MS = 10 * 60 * 1000, // "you were editing" = changed it in the last 10 minutes
  MAX_DEPTH = 6,
  // page fields that don't show up on the page (see page-data/actions.js)
  INTERNAL_PAGE_PROPS = ['layout', 'customUrl', 'url', 'urlHistory'],
  STATE_VERBS = {
    publish: 'published', unpublish: 'unpublished', schedule: 'scheduled', unschedule: 'unscheduled'
  };

let queue = Promise.resolve(),
  flashId = 0;

/**
 * Run refreshes one at a time, in order.
 * @param {function} fn
 * @returns {Promise}
 */
function enqueue(fn) {
  queue = queue.then(fn).catch(err => log.error(`Collaboration refresh failed: ${err.message}`, { action: 'collab' }));

  return queue;
}

/**
 * Like enqueue, but the caller gets the result (or the error).
 * @param {function} fn
 * @returns {Promise}
 */
function queued(fn) {
  const run = queue.then(fn);

  queue = run.catch(_.noop);

  return run;
}

/**
 * @returns {object}
 */
function readHeaders() {
  return { 'X-Clay-Collab-Session': ctx.session };
}

/**
 * @param {string} uri
 * @returns {Element|null}
 */
function elementFor(uri) {
  return document.querySelector(`[${refAttr}="${cssEscape(uri)}"]`);
}

/**
 * Escape a value for an attribute selector (uris come from other editors).
 * @param {string} value
 * @returns {string}
 */
export function cssEscape(value) {
  return window.CSS && window.CSS.escape ? window.CSS.escape(value) : String(value).replace(/["\\\]]/g, '\\$&');
}

/**
 * Would re-rendering `uri` disturb what this user is doing right now? Their
 * own open form on it, a save of it still in flight, or (inline forms only) an
 * open editor inside it, which a re-render would destroy.
 * @param {object} store
 * @param {string} uri
 * @param {string[]} [areas] page/layout areas that would be re-rendered
 * @returns {boolean}
 */
export function isBusy(store, uri, areas) {
  const form = _.get(store, 'state.ui.currentForm');

  if (isSaving(uri)) {
    return true;
  }

  if (!form) {
    return false;
  }

  if (form.uri === uri) {
    return true;
  }

  if (!form.inline) {
    return false; // overlay forms live in the toolbar and survive re-renders
  }

  const formEl = elementFor(form.uri),
    containers = areas ? _.compact(_.map(areas, area => document.querySelector(`[${editAttr}="${cssEscape(area)}"]`))) : _.compact([elementFor(uri)]);

  return !!formEl && _.some(containers, el => el !== formEl && el.contains(formEl));
}

/**
 * Child component uris referenced in some data that the store doesn't have:
 * `{ _ref }` objects in component data, and uri strings in page areas (only
 * when `areas` is set: text fields can contain urls that look like uris).
 * @param {object} store
 * @param {*} data component data, or page data
 * @param {boolean} [areas] data is page data (areas are lists of uris)
 * @returns {string[]}
 */
function missingChildren(store, data, areas) {
  const refs = [];

  (function walk(value) {
    if (_.isArray(value)) {
      _.each(value, item => areas && _.isString(item) && _.includes(item, '/_components/') ? refs.push(item) : walk(item));
    } else if (_.isPlainObject(value)) {
      if (_.isString(value[refProp])) {
        refs.push(value[refProp]);
      }
      _.each(_.omit(value, refProp), walk);
    }
  }(data));

  return _.uniq(_.filter(refs, ref => _.isEmpty(store.state.components[ref])));
}

/**
 * Read something with its revision, noting when the read started: if this
 * tab finds out it may have missed changes meanwhile (ctx.distrusts), the
 * revision can't be trusted (see trustedRev).
 * @param {string} url
 * @returns {Promise<{data: object, rev: number|null, distrusts: number}>}
 */
function read(url) {
  const distrusts = ctx.distrusts;

  return getWithRevision(url, readHeaders()).then(({ data, rev }) => ({ data, rev, distrusts }));
}

/**
 * The revision of something read from the server, unless this tab found out
 * it may have missed changes since the read started (then it's unknown, and
 * saving merges with whatever the server has).
 * @param {object} version { rev, distrusts? }
 * @returns {number|null}
 */
function trustedRev(version) {
  return !_.isNumber(version.distrusts) || version.distrusts === ctx.distrusts ? version.rev : null;
}

/**
 * Fetch a component someone else changed, as kiln would have it after its
 * own save: stored data, run through the component's client-side model.
 * @param {string} uri
 * @returns {Promise<{data: object, rev: number|null, distrusts: number}>}
 */
function fetchComponent(uri) {
  return read(`${uri}${hooksExt}`)
    .then(version => modelRender(uri, version.data).then(renderable => _.assign({}, version, { data: renderable })));
}

/**
 * The server's copy of a component, as kiln would have it (see fetchComponent).
 * @param {string} uri
 * @returns {Promise<{data: object, rev: number|null}>}
 */
export function fetchLatest(uri) {
  return fetchComponent(uri);
}

/**
 * Make sure the store has data (and schemas) for every component referenced,
 * so new components someone else added can render and be edited here. A
 * child that can't be loaded is skipped (and logged) rather than blocking the
 * rest.
 * @param {object} store
 * @param {*} data
 * @param {object} [options]
 * @param {boolean} [options.areas] data is page data
 * @param {number} [options.depth]
 * @returns {Promise}
 */
export function ensureComponents(store, data, { areas = false, depth = 0 } = {}) {
  const missing = missingChildren(store, data, areas);

  if (!missing.length || depth > MAX_DEPTH) {
    return Promise.resolve();
  }

  return Promise.all(_.map(missing, uri => resolveSchema(getComponentName(uri))
    .then(() => fetchComponent(uri))
    .then(child => ensureComponents(store, child.data, { depth: depth + 1 }).then(() => {
      store.commit(UPDATE_COMPONENT, { uri, data: child.data });
      markKnown(uri);
      advanceRev(uri, trustedRev(child));
      // undo restores whole snapshots: they need this component too
      rebaseHistory(store, { uri, data: child.data, add: true });
    }))
    .catch(err => log.error(`Could not load ${uri} (added by someone else): ${err.message}`, { action: 'collab' }))));
}

/**
 * Briefly highlight something someone else just changed ("Updated by Ada"),
 * or that changed while this tab was reconnecting.
 * @param {object} store
 * @param {string} uri
 * @param {object} [by] { user } or { reconnecting: true }
 */
function flash(store, uri, by) {
  const id = ++flashId,
    el = elementFor(uri),
    user = _.get(by, 'user') || null;

  // big containers (an article) change whenever anything inside them does:
  // highlighting the whole screen is noise, the changed children flash instead
  if (!user && !_.get(by, 'reconnecting') || el && el.getBoundingClientRect().height > window.innerHeight * 0.8) {
    return;
  }

  store.commit(COLLAB_FLASH, { id, uri, user });
  setTimeout(() => store.commit(COLLAB_FLASH_DONE, id), FLASH_MS);
}

/**
 * Child components a change took out of component lists.
 * @param {object} before
 * @param {object} after
 * @returns {object[]} [{ path, uri, index }]
 */
export function removedChildren(before, after) {
  return _.flatMap(_.keys(before), (path) => {
    const old = before[path],
      current = after && after[path];

    if (!_.isArray(old) || !_.every(old, item => _.isPlainObject(item) && _.isString(item[refProp]))) {
      return [];
    }

    const kept = _.map(_.isArray(current) ? current : [], refProp);

    return _.compact(_.map(old, (item, index) => _.includes(kept, item[refProp]) ? null : { path, uri: item[refProp], index }));
  });
}

/**
 * Someone removed a component this user was just editing: say so, and offer
 * to put it back (its data, including this user's edits, is still saved).
 * @param {object} store
 * @param {string} parent
 * @param {object[]} removed from removedChildren
 * @param {object} event
 */
function offerRestore(store, parent, removed, event) {
  const name = _.get(event, 'by.user.name'),
    mine = _.filter(removed, item => Date.now() - (ctx.recentEdits[item.uri] || 0) < RECENT_EDIT_MS);

  _.each(mine, (item) => {
    const what = componentLabel(item.uri);

    store.dispatch('showSnackbar', {
      message: name || !_.get(event, 'by.reconnecting') ? `${name || 'Someone'} removed the ${what} you were editing` : `The ${what} you were editing was removed while you were reconnecting`,
      action: 'Restore',
      actionDuration: 15000,
      onActionClick: () => {
        const list = (_.get(store, ['state', 'components', parent, item.path]) || []).slice();

        list.splice(Math.min(item.index, list.length), 0, { [refProp]: item.uri });
        store.dispatch('saveComponent', { uri: parent, data: { [item.path]: list } });
      }
    });
  });
}

/**
 * Show a version of a component someone else saved, unless this user is busy
 * with it (then it waits until they're done).
 * @param {object} store
 * @param {string} uri
 * @param {object} version { data, rev } fetched from the server
 * @param {object} options
 * @param {object} options.event the change
 * @param {number} options.writes this tab's save count for it when the fetch started
 * @returns {Promise}
 */
function showComponent(store, uri, version, { event, writes }) {
  const data = version.data;

  return ensureComponents(store, data).then(() => {
    // checked right before touching the page: the user may have started
    // editing it while we were fetching
    if (isBusy(store, uri)) {
      store.commit(COLLAB_PENDING, { uri, by: event.by, rev: _.isNumber(event.rev) ? event.rev : version.rev });
      return;
    }

    if (writeCount(uri) !== writes) {
      return; // this tab saved it meanwhile: that save already has (or merged) their change
    }

    const before = store.state.components[uri],
      fields = changedFields(before, data),
      removed = removedChildren(before, data);

    store.commit(UPDATE_COMPONENT, { uri, data, fields });
    advanceRev(uri, trustedRev(version));
    rebaseHistory(store, { uri, data: _.pick(data, fields) });

    if (_.get(event, 'by.user') && ctx.missed[uri]) {
      // shown a moment ago as "Updated while you were reconnecting": now we know who
      delete ctx.missed[uri];
      if (!fields.length) {
        flash(store, uri, event.by);
      }
    }

    if (!fields.length) {
      return;
    }

    return store.dispatch('render', {
      uri, data, snapshot: false, paths: fields
    }).then(() => {
      flash(store, uri, event.by);
      offerRestore(store, uri, removed, event);
    });
  });
}

/**
 * Show a component someone else saved.
 * @param {object} store
 * @param {string} uri
 * @param {object} event
 * @returns {Promise}
 */
function refreshComponent(store, uri, event) {
  const writes = writeCount(uri);

  return fetchComponent(uri).then(version => showComponent(store, uri, version, { event, writes }));
}

/**
 * The refs in a component list, whatever shape its items are in (kiln keeps
 * layout lists composed with their children's data, the server sends refs).
 * @param {array} [list]
 * @returns {string[]}
 */
function listRefs(list) {
  return _.map(list, item => _.isString(item) ? item : _.get(item, refProp));
}

/**
 * The layout's own component lists that someone else changed. Page areas are
 * only aliases for page data, and other layout fields aren't shown.
 * @param {object} store
 * @param {object} data the layout's data from the server
 * @returns {string[]}
 */
export function changedLayoutLists(store, data) {
  const schema = _.get(store, 'state.layout.schema') || {},
    current = _.get(store, 'state.layout.data') || {};

  return _.filter(_.keys(schema), path => _.has(schema[path], componentListProp)
    && !_.has(schema[path], `${componentListProp}.page`)
    && !_.isEqual(listRefs(current[path]), listRefs(data && data[path])));
}

/**
 * Layout data the way kiln keeps it (see composeLayoutData in the preloader),
 * with the changed lists replaced.
 * @param {object} store
 * @param {object} data the layout's data from the server
 * @param {string[]} paths changed lists
 * @returns {object}
 */
export function composeLayoutLists(store, data, paths) {
  const lists = _.map(paths, path => _.map(listRefs(data[path]), ref => _.assign({ [refProp]: ref }, _.get(store, ['state', 'components', ref]))));

  return _.assign({}, _.get(store, 'state.layout.data'), _.zipObject(paths, lists));
}

/**
 * Changed layout lists that can be re-rendered from the page's server html:
 * ones on the page (in the body or the head) and in the new html, except
 * the one holding kiln itself, whose toolbar only exists in this tab.
 * @param {string[]} paths
 * @param {Document} html
 * @returns {string[]}
 */
export function renderableLayoutLists(paths, html) {
  return _.filter(paths, (path) => {
    const selector = `[${editAttr}="${cssEscape(path)}"]`,
      el = document.querySelector(selector);

    if (el) {
      return !el.querySelector('.kiln-wrapper') && !!html.querySelector(selector);
    }

    return !!getComponentListStart(path) && !!getComponentListStart(path, html);
  });
}

/**
 * Show a version of the layout: kiln's layout data, and the lists that changed
 * re-rendered from the page's server html (layouts render the kiln toolbar
 * into the page, which only the server can do).
 * @param {object} store
 * @param {string} uri
 * @param {object} version { data, rev } of the layout
 * @param {object} [event] someone else's change: wait if this user is busy
 * @returns {Promise<boolean>} whether any of its lists changed
 */
export function showLayout(store, uri, version, event) {
  const data = version.data,
    fields = changedLayoutLists(store, data);

  return ensureComponents(store, _.pick(data, fields))
    .then(() => fields.length ? getHTML(ctx.page) : null)
    .then((html) => {
      if (event && fields.length && isBusy(store, uri, fields)) {
        store.commit(COLLAB_PENDING, { uri, by: event.by, rev: event.rev });
        return null;
      }

      const paths = html ? renderableLayoutLists(fields, html) : [];

      store.commit(UPDATE_COMPONENT, { uri, data: composeLayoutLists(store, data, fields), fields });
      advanceRev(uri, trustedRev(version));
      rebaseHistory(store, { uri, data: _.pick(data, fields) });

      return paths.length ? store.dispatch('render', {
        uri: ctx.page, html, snapshot: false, paths
      }) : null;
    })
    .then(() => fields.length > 0);
}

/**
 * Show layout changes someone else saved.
 * @param {object} store
 * @param {string} uri
 * @param {object} event
 * @returns {Promise}
 */
function refreshLayout(store, uri, event) {
  return fetchComponent(uri).then(version => showLayout(store, uri, version, event));
}

/**
 * Show page-level changes someone else saved (components added to, removed
 * from or moved within page areas).
 * @param {object} store
 * @param {string} uri
 * @param {object} event
 * @returns {Promise<boolean>} whether any page area changed
 */
function refreshPage(store, uri, event) {
  return read(uri).then((version) => {
    const data = version.data,
      oldData = _.get(store, 'state.page.data'),
      paths = changedFields(oldData, data),
      visible = _.reject(paths, path => _.includes(INTERNAL_PAGE_PROPS, path));

    return ensureComponents(store, _.pick(data, visible), { areas: true })
      .then(() => visible.length ? getHTML(uri) : null)
      .then((html) => {
        if (visible.length && isBusy(store, uri, visible)) {
          store.commit(COLLAB_PENDING, { uri, by: event.by, rev: event.rev });
          return;
        }

        store.commit(UPDATE_PAGE, data);
        advanceRev(uri, trustedRev(version));
        rebaseHistory(store, { pageData: _.pick(data, paths) });

        if (html) {
          return store.dispatch('render', {
            uri, html, snapshot: false, paths: visible
          }).then(() => {
            const added = _.difference(_.flatten(_.map(visible, path => data[path])), _.flatten(_.map(visible, path => oldData[path])));

            _.each(added, child => _.isString(child) && flash(store, child, event.by));
          });
        }
      })
      .then(() => visible.length > 0);
  });
}

/**
 * Bring something someone else saved onto this page, unless it's busy.
 * @param {object} store
 * @param {object} event
 * @returns {Promise}
 */
function refresh(store, event) {
  const uri = event.uri;

  if (isPage(uri)) {
    return refreshPage(store, uri, event);
  } else if (isLayout(uri)) {
    return refreshLayout(store, uri, event);
  }

  return refreshComponent(store, uri, event);
}

/**
 * Re-read something now and show what changed, e.g. right before opening a
 * form someone else just handed over (so it opens with their changes).
 * @param {object} store
 * @param {string} uri
 * @param {object} [by] who changed it, for the highlight
 * @returns {Promise}
 */
export function refreshNow(store, uri, by) {
  return queued(() => refresh(store, { type: 'save', uri, by: by || {} }));
}

/**
 * Is this uri something on this page?
 * @param {object} store
 * @param {string} uri
 * @returns {boolean}
 */
function isOnPage(store, uri) {
  return uri === ctx.page || uri === ctx.layout || !_.isEmpty(_.get(store, ['state', 'components', uri]));
}

/**
 * Handle a remote save: refresh now, or remember it until the user is done
 * with what they're editing.
 * @param {object} store
 * @param {object} event
 */
function onRemoteSave(store, event) {
  const known = getRev(event.uri);

  if (!isOnPage(store, event.uri) || _.isNumber(known) && _.isNumber(event.rev) && known >= event.rev) {
    return; // not on this page, or we already have it
  }

  if (isBusy(store, event.uri)) {
    store.commit(COLLAB_PENDING, { uri: event.uri, by: event.by, rev: event.rev });
    return;
  }

  enqueue(() => refresh(store, event));
}

/**
 * Someone published / unpublished / (un)scheduled or changed page settings:
 * update this tab's page status, and say so.
 * @param {object} store
 * @param {object} event
 * @returns {Promise}
 */
function onRemoteStateChange(store, event) {
  const verb = STATE_VERBS[event.type],
    name = _.get(event, 'by.user.name', 'Someone');

  if (event.uri === ctx.layout) {
    return store.dispatch('fetchLayoutState').then(() => {
      if (verb) {
        store.dispatch('showSnackbar', `${name} ${verb} the layout`);
      }
    });
  }

  if (event.uri !== ctx.page) {
    return Promise.resolve();
  }

  return getMeta(ctx.page).then((pageState) => {
    store.commit(UPDATE_PAGE_STATE, pageState || {});

    if (verb) {
      store.dispatch('showSnackbar', `${name} ${verb} this page`);
    }
  }).catch(err => log.error(`Could not refresh page status: ${err.message}`, { action: 'collab' }));
}

// several metadata changes in a row only need one refresh
const refreshStateSoon = _.debounce((store, event) => enqueue(() => onRemoteStateChange(store, event)), 1000);

/**
 * An entry for the activity list. Component edits carry their label, so a
 * burst of them can be shown as one line.
 * @param {object} event
 * @returns {object}
 */
function activityEntry(event) {
  const entry = {
    id: event.id, type: event.type, uri: event.uri, user: _.get(event, 'by.user'), at: event.at, text: describeEvent(event)
  };

  if (event.type === 'save' && event.uri !== ctx.page && event.uri !== ctx.layout) {
    entry.labels = [componentLabel(event.uri)];
  }

  return entry;
}

/**
 * Words for the activity list.
 * @param {object} event
 * @returns {string}
 */
function describeEvent(event) {
  if (STATE_VERBS[event.type]) {
    return `${STATE_VERBS[event.type]} ${event.uri === ctx.layout ? 'the layout' : 'the page'}`;
  }

  if (event.type === 'meta') {
    return 'changed page settings';
  }

  if (event.uri === ctx.page) {
    return 'rearranged the page';
  }

  return `edited ${componentLabel(event.uri)}`;
}

/**
 * Apply a batch of change-feed events from a sync.
 * @param {object} store
 * @param {object[]} events in feed order
 */
export function handleEvents(store, events) {
  const saves = {};
  let metaChanged = null;

  _.each(events, (event) => {
    if (_.get(event, 'by.own')) {
      return; // this tab's own change
    }

    // kiln patches page metadata (last edited time, contributors) after every
    // save, and head components (meta tags) follow other components' changes,
    // so neither is worth listing; they still refresh
    if (event.type !== 'meta' && !isComponentInHead(event.uri)) {
      store.commit(COLLAB_ACTIVITY, activityEntry(event));
    }

    if (event.type === 'save') {
      // only the newest revision per uri matters
      saves[event.uri] = !saves[event.uri] || (event.rev || 0) >= (saves[event.uri].rev || 0) ? event : saves[event.uri];
    } else if (event.type === 'meta') {
      metaChanged = event;
    } else {
      enqueue(() => onRemoteStateChange(store, event));
    }
  });

  _.each(saves, event => onRemoteSave(store, event));

  if (metaChanged) {
    refreshStateSoon(store, metaChanged);
  }
}

/**
 * Apply remote changes that were waiting for the user to finish editing.
 * @param {object} store
 */
export function flushPending(store) {
  _.forOwn(_.get(store, 'state.collab.pending', {}), (pending, uri) => {
    const known = getRev(uri);

    if (_.isNumber(known) && _.isNumber(pending.rev) && known >= pending.rev) {
      // our own save already merged their change in
      store.commit(COLLAB_PENDING_DONE, uri);
    } else if (!isBusy(store, uri, isPage(uri) || isLayout(uri) ? null : undefined)) {
      store.commit(COLLAB_PENDING_DONE, uri);
      enqueue(() => refresh(store, { uri, rev: pending.rev, by: pending.by || {} }));
    }
  });
}

/**
 * The fields of a component people can edit in kiln (its schema's fields and
 * component lists). Kiln's copy of everything else is how the server rendered
 * it, which the server's stored data doesn't have to match.
 * @param {object} store
 * @param {string} uri
 * @returns {string[]}
 */
function editableFields(store, uri) {
  const schema = _.get(store, ['state', 'schemas', getComponentName(uri)]) || {};

  return _.filter(_.keys(schema), key => _.isPlainObject(schema[key]) && (_.has(schema[key], fieldProp) || _.has(schema[key], componentListProp) || _.has(schema[key], componentProp)));
}

/**
 * Did someone change a field people can edit? amphora adds componentVariation
 * when rendering a component that doesn't store one, and stored data may have
 * no value where the rendered copy has null.
 * @param {object} store
 * @param {string} uri
 * @param {object} shown what this tab has
 * @param {object} saved what the server has, through the client-side model
 * @returns {boolean}
 */
export function editedSince(store, uri, shown, saved) {
  const name = getComponentName(uri);

  return _.some(editableFields(store, uri), (field) => {
    let a = _.get(shown, field),
      b = _.get(saved, field);

    if (field === 'componentVariation') {
      a = a || name;
      b = b || name;
    }

    return !(_.isNil(a) && _.isNil(b)) && !_.isEqual(a, b);
  });
}

/**
 * Compare a component re-read while catching up with what this tab shows, and
 * show it if someone changed it.
 * @param {object} store
 * @param {string} uri
 * @param {object} version { data, rev, distrusts }
 * @param {number} writes this tab's save count for it when the fetch started
 * @returns {Promise<boolean>} whether it changed
 */
function catchUpComponent(store, uri, version, writes) {
  const known = getRev(uri);

  if (isSaving(uri) || writeCount(uri) !== writes || _.isNumber(known) && _.isNumber(version.rev) && known > version.rev) {
    // this tab is saving it (that save merges with the server's copy), or a
    // newer version came in while we were fetching
    return Promise.resolve(false);
  }

  if (!editedSince(store, uri, store.state.components[uri], version.data)) {
    advanceRev(uri, trustedRev(version)); // what this tab shows is current

    return Promise.resolve(false);
  }

  return showComponent(store, uri, version, { event: CATCH_UP_EVENT, writes }).then(() => true);
}

/**
 * Run fn over items, a few at a time.
 * @param {array} items
 * @param {number} size
 * @param {function} fn returns a promise
 * @returns {Promise}
 */
function inBatches(items, size, fn) {
  return _.reduce(_.chunk(items, size), (done, batch) => done.then(() => Promise.all(_.map(batch, fn))), Promise.resolve());
}

/**
 * Re-read the page and show whatever changed, the way a reload would but
 * without one, for when this tab may have missed changes: it was
 * reconnecting, or the server says saves went around collaboration. Changes
 * are shown like anyone else's ("Updated while you were reconnecting" when
 * the feed didn't say who made them); one this user has open waits until
 * they're done, and their save merges with it. Something that can't be
 * re-read keeps no revision (saving it merges with the server's copy) and is
 * reported, to be re-read again later.
 * @param {object} store
 * @param {string[]} [only] re-read just these (a retry); default everything
 * @returns {Promise<{changed: string[], waiting: string[], failed: string[]}>} changed: shown now; waiting: until this user is done with it
 */
export function catchUp(store, only) {
  const changed = [],
    waiting = [],
    failed = [],
    everything = _.keys(_.pickBy(_.get(store, 'state.components', {}), data => !_.isEmpty(data))).concat(_.compact([ctx.page, ctx.layout])),
    wanted = _.uniq(only || everything),
    uris = _.reject(wanted, uri => uri === ctx.page || uri === ctx.layout);

  function track(uri, promise) {
    return promise.then((didChange) => {
      if (didChange) {
        ctx.missed[uri] = true;
        (_.has(_.get(store, 'state.collab.pending'), uri) ? waiting : changed).push(uri);
      }
    }, (err) => {
      failed.push(uri);
      log.error(`Could not catch up on ${uri}: ${err.message}`, { action: 'collab' });
    });
  }

  return inBatches(uris, CATCH_UP_BATCH, (uri) => {
    const writes = writeCount(uri);

    return track(uri, fetchComponent(uri).then(version => queued(() => catchUpComponent(store, uri, version, writes))));
  })
    .then(() => _.includes(wanted, ctx.page) && track(ctx.page, queued(() => refreshPage(store, ctx.page, CATCH_UP_EVENT))))
    .then(() => ctx.layout && _.includes(wanted, ctx.layout) && track(ctx.layout, queued(() => refreshLayout(store, ctx.layout, CATCH_UP_EVENT))))
    .then(() => {
      if (!only) {
        // publishing and scheduling may have gone unrecorded too
        enqueue(() => onRemoteStateChange(store, { type: 'catch-up', uri: ctx.page }));
        if (ctx.layout) {
          enqueue(() => onRemoteStateChange(store, { type: 'catch-up', uri: ctx.layout }));
        }
      }

      return { changed, waiting, failed };
    });
}

// exported for tests
export { missingChildren, describeEvent, refresh };
