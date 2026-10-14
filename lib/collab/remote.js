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
  refProp, editAttr, refAttr, getComponentName, hooksExt
} from '../utils/references';
import logger from '../utils/log';
import ctx, { getRev, setRev, isSaving } from './context';
import { changedFields } from './merge';
import { componentLabel } from './presence';
import {
  COLLAB_ACTIVITY, COLLAB_PENDING, COLLAB_PENDING_DONE, COLLAB_FLASH, COLLAB_FLASH_DONE, COLLAB_LAYOUT_DATA
} from './mutationTypes';

const log = logger(__filename),
  FLASH_MS = 2500,
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
  return document.querySelector(`[${refAttr}="${uri}"]`);
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
    containers = areas ? _.compact(_.map(areas, area => document.querySelector(`[${editAttr}="${area}"]`))) : _.compact([elementFor(uri)]);

  return !!formEl && _.some(containers, el => el !== formEl && el.contains(formEl));
}

/**
 * Child component uris referenced in some data that the store doesn't have.
 * @param {object} store
 * @param {*} data component data, or a page area (array of uris)
 * @returns {string[]}
 */
function missingChildren(store, data) {
  const refs = [];

  (function walk(value) {
    if (_.isString(value) && _.includes(value, '/_components/')) {
      refs.push(value);
    } else if (_.isArray(value)) {
      _.each(value, walk);
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
 * Fetch a component someone else changed, as kiln would have it after its
 * own save: stored data, run through the component's client-side model.
 * @param {string} uri
 * @returns {Promise<{data: object, rev: number|null}>}
 */
function fetchComponent(uri) {
  return getWithRevision(`${uri}${hooksExt}`, readHeaders())
    .then(({ data, rev }) => modelRender(uri, data).then(renderable => ({ data: renderable, rev })));
}

/**
 * Make sure the store has data (and schemas) for every component referenced,
 * so new components someone else added can render and be edited here.
 * @param {object} store
 * @param {*} data
 * @param {number} [depth]
 * @returns {Promise}
 */
export function ensureComponents(store, data, depth = 0) {
  const missing = missingChildren(store, data);

  if (!missing.length || depth > MAX_DEPTH) {
    return Promise.resolve();
  }

  return Promise.all(_.map(missing, uri => resolveSchema(getComponentName(uri))
    .then(() => fetchComponent(uri))
    .then(child => ensureComponents(store, child.data, depth + 1).then(() => {
      store.commit(UPDATE_COMPONENT, { uri, data: child.data });
      setRev(uri, child.rev);
    }))));
}

/**
 * Briefly highlight something someone else just changed.
 * @param {object} store
 * @param {string} uri
 * @param {object} [user]
 */
function flash(store, uri, user) {
  const id = ++flashId;

  if (!user) {
    return;
  }

  store.commit(COLLAB_FLASH, { id, uri, user });
  setTimeout(() => store.commit(COLLAB_FLASH_DONE, id), FLASH_MS);
}

/**
 * Show a component someone else saved.
 * @param {object} store
 * @param {string} uri
 * @param {object} event
 * @returns {Promise}
 */
function refreshComponent(store, uri, event) {
  return fetchComponent(uri).then(({ data, rev }) => {
    if (isBusy(store, uri)) {
      // the user started editing it while we were fetching: wait for them
      store.commit(COLLAB_PENDING, { uri, by: event.by, rev: event.rev });
      return;
    }

    const fields = changedFields(store.state.components[uri], data);

    return ensureComponents(store, data).then(() => {
      store.commit(UPDATE_COMPONENT, { uri, data, fields });
      setRev(uri, rev);
      rebaseHistory(store, { uri, data: _.pick(data, fields) });

      if (!fields.length) {
        return;
      }

      return store.dispatch('render', {
        uri, data, snapshot: false, paths: fields
      }).then(() => flash(store, uri, event.by.user));
    });
  });
}

/**
 * Show a layout someone else saved (its component lists).
 * @param {object} store
 * @param {string} uri
 * @param {object} event
 * @returns {Promise}
 */
function refreshLayout(store, uri, event) {
  return fetchComponent(uri).then(({ data, rev }) => {
    const fields = changedFields(_.get(store, 'state.layout.data'), data);

    if (fields.length && isBusy(store, uri, fields)) {
      store.commit(COLLAB_PENDING, { uri, by: event.by, rev: event.rev });
      return;
    }

    return ensureComponents(store, _.pick(data, fields)).then(() => {
      store.commit(COLLAB_LAYOUT_DATA, data);
      store.commit(UPDATE_COMPONENT, { uri, data, fields });
      setRev(uri, rev);

      if (fields.length) {
        return store.dispatch('render', {
          uri, data, snapshot: false, paths: fields
        });
      }
    });
  });
}

/**
 * Show page-level changes someone else saved (components added to, removed
 * from or moved within page areas).
 * @param {object} store
 * @param {string} uri
 * @param {object} event
 * @returns {Promise}
 */
function refreshPage(store, uri, event) {
  return getWithRevision(uri, readHeaders()).then(({ data, rev }) => {
    const oldData = _.get(store, 'state.page.data'),
      paths = changedFields(oldData, data),
      visible = _.reject(paths, path => _.includes(INTERNAL_PAGE_PROPS, path));

    if (visible.length && isBusy(store, uri, visible)) {
      store.commit(COLLAB_PENDING, { uri, by: event.by, rev: event.rev });
      return;
    }

    return ensureComponents(store, _.pick(data, visible))
      .then(() => visible.length ? getHTML(uri) : null)
      .then((html) => {
        store.commit(UPDATE_PAGE, data);
        setRev(uri, rev);
        rebaseHistory(store, { pageData: _.pick(data, paths) });

        if (html) {
          return store.dispatch('render', {
            uri, html, snapshot: false, paths: visible
          }).then(() => {
            const added = _.difference(_.flatten(_.map(visible, path => data[path])), _.flatten(_.map(visible, path => oldData[path])));

            _.each(added, child => _.isString(child) && flash(store, child, event.by.user));
          });
        }
      });
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
    if (_.get(event, 'by.session') === ctx.session) {
      return; // our own change
    }

    // kiln patches page metadata (last edited time, contributors) after every
    // save, so meta changes aren't worth listing; they just refresh the status
    if (event.type !== 'meta') {
      store.commit(COLLAB_ACTIVITY, {
        id: event.id, type: event.type, uri: event.uri, user: _.get(event, 'by.user'), at: event.at, text: describeEvent(event)
      });
    }

    if (event.type === 'save') {
      saves[event.uri] = event; // only the latest per uri matters
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

// exported for tests
export { missingChildren, describeEvent, refresh };
