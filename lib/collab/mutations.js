import _ from 'lodash';
import {
  COLLAB_START, COLLAB_SYNCED, COLLAB_SYNC_FAILED, COLLAB_ACTIVITY, COLLAB_PENDING, COLLAB_PENDING_DONE,
  COLLAB_FLASH, COLLAB_FLASH_DONE, COLLAB_CLAIM, COLLAB_STOP
} from './mutationTypes';

const MAX_ACTIVITY = 30,
  BURST_MS = 20000;

// state.collab stays null unless the server turned collaboration on for this page
export default {
  [COLLAB_START]: (state, { session }) => {
    state.collab = {
      session,
      connected: false,
      failures: 0,
      lastSync: null,
      others: [], // presence entries of everyone else on the page, one per tab
      activity: [], // recent things other editors did, newest first
      pending: {}, // uri -> { by, rev } remote changes waiting for a local form to close
      flashes: [], // { id, uri, user } components that just changed, highlighted briefly (user null: caught up on while reconnecting)
      claim: null // { id, uri, path, label, by, own } a field this tab is taking over, waiting for whoever has it open
    };

    return state;
  },
  [COLLAB_SYNCED]: (state, { others, now }) => {
    state.collab = _.assign({}, state.collab, {
      connected: true, failures: 0, lastSync: now, others
    });

    return state;
  },
  [COLLAB_SYNC_FAILED]: (state) => {
    state.collab = _.assign({}, state.collab, { connected: false, failures: state.collab.failures + 1 });

    return state;
  },
  [COLLAB_ACTIVITY]: (state, entry) => {
    const latest = state.collab.activity[0],
      // one person's burst of edits reads as one line: "Ada edited Headline, Paragraph"
      sameBurst = latest && entry.labels && latest.labels && _.get(latest, 'user.id') === _.get(entry, 'user.id') && entry.at - latest.at < BURST_MS,
      activity = sameBurst
        ? [_.assign({}, latest, { at: entry.at, id: entry.id, labels: _.union(latest.labels, entry.labels) })].concat(state.collab.activity.slice(1))
        : [entry].concat(state.collab.activity);

    state.collab = _.assign({}, state.collab, { activity: activity.slice(0, MAX_ACTIVITY) });

    return state;
  },
  [COLLAB_PENDING]: (state, { uri, by, rev }) => {
    const existing = state.collab.pending[uri],
      // catching up doesn't know who changed it: keep a name we already have
      who = !existing || _.get(by, 'user') ? by : existing.by,
      newest = existing && _.isNumber(existing.rev) && !(rev >= existing.rev) ? existing.rev : rev;

    state.collab = _.assign({}, state.collab, { pending: _.assign({}, state.collab.pending, { [uri]: { by: who, rev: newest } }) });

    return state;
  },
  [COLLAB_PENDING_DONE]: (state, uri) => {
    state.collab = _.assign({}, state.collab, { pending: _.omit(state.collab.pending, uri) });

    return state;
  },
  [COLLAB_FLASH]: (state, flash) => {
    state.collab = _.assign({}, state.collab, { flashes: state.collab.flashes.concat(flash) });

    return state;
  },
  [COLLAB_FLASH_DONE]: (state, id) => {
    state.collab = _.assign({}, state.collab, { flashes: _.reject(state.collab.flashes, { id }) });

    return state;
  },
  [COLLAB_CLAIM]: (state, claim) => {
    state.collab = _.assign({}, state.collab, { claim: claim || null });

    return state;
  },
  [COLLAB_STOP]: (state) => {
    state.collab = null;

    return state;
  }
};
