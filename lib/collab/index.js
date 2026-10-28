/**
 * Real-time collaboration (opt-in, see docs/collaboration.md).
 *
 * Runs only when amphora has collaboration enabled, which it signals by
 * adding `locals.collaboration` to edit-mode pages. Otherwise nothing here
 * starts: no polling, no extra headers, and saves behave exactly as before.
 */
export { start, stop, sync } from './client';
export { isActive } from './context';
