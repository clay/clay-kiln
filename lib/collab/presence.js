import _ from 'lodash';
import { isLayout, isPage } from 'clayutils';
import label from '../utils/label';
import { getComponentName } from '../utils/references';

const STATE_RANK = { active: 0, idle: 1, hidden: 2 };

/**
 * Name of a component (or the page/layout) for people to read.
 * @param {string} uri
 * @returns {string}
 */
export function componentLabel(uri) {
  if (!uri) {
    return '';
  }

  if (isPage(uri)) {
    return 'page settings';
  }

  if (isLayout(uri)) {
    return 'layout';
  }

  return label(getComponentName(uri));
}

/**
 * Everyone else on the page, one entry per person (people with several tabs
 * open show once, with their most relevant tab: the one editing something,
 * then the most active one).
 * @param {object} store
 * @returns {object[]} [{ user, focus, state, sessions }]
 */
export function editors(store) {
  const others = _.get(store, 'state.collab.others', []);

  return _.map(_.groupBy(others, 'user.id'), (sessions) => {
    const best = _.sortBy(sessions, [session => session.focus ? 0 : 1, session => STATE_RANK[session.state] || 0])[0];

    return {
      user: best.user, focus: best.focus, state: best.state, sessions: sessions.length
    };
  });
}

/**
 * Other people's open forms, one per tab, for drawing on the page.
 * @param {object} store
 * @returns {object[]} [{ tab, user, focus, state }]
 */
export function focuses(store) {
  return _.filter(_.get(store, 'state.collab.others', []), 'focus.uri');
}

/**
 * What someone is doing, in words.
 * @param {object} editor from editors()
 * @returns {string}
 */
export function describe(editor) {
  if (editor.focus && editor.focus.uri) {
    return `${editor.focus.typing ? 'Typing in' : 'Editing'} ${editor.focus.label || componentLabel(editor.focus.uri)}`;
  }

  if (editor.state === 'idle') {
    return 'Idle';
  }

  return editor.state === 'hidden' ? 'Away (tab in background)' : 'Viewing';
}

/**
 * Initials for an avatar without a picture.
 * @param {string} name
 * @returns {string}
 */
export function initials(name) {
  const parts = _.compact(String(name || '?').split(/[\s._@-]+/));

  return _.map(parts.length > 1 ? [_.first(parts), _.last(parts)] : parts, part => part[0].toUpperCase()).join('').slice(0, 2);
}
