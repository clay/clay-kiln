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
 * @returns {object[]} [{ session, user, focus, state }]
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
 * If someone else has this component (or field) open, the confirm dialog to
 * show before opening it. Editing different fields of the same component is
 * fine (saves merge per field), so only the same field — or a whole-component
 * form — counts.
 * @param {object} store
 * @param {string} uri
 * @param {string} [path]
 * @returns {object|null} openConfirm config
 */
export function softLockFor(store, uri, path) {
  const holder = _.find(focuses(store), ({ focus }) => focus.uri === uri && (!path || !focus.path || focus.path === path));

  if (!holder) {
    return null;
  }

  const name = holder.user.name,
    what = holder.focus.label || componentLabel(uri);

  return {
    title: `${name} is editing this`,
    text: `${name} has ${what} open right now. You can still edit it: if you both change the same field, your save wins and you'll get a one-click option to restore ${name}'s version.`,
    button: 'Edit anyway',
    type: 'primary'
  };
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
