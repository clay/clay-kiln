/* eslint-disable one-var */
export const UPDATE_COMPONENT = 'UPDATE_COMPONENT';
export const REVERT_COMPONENT = 'REVERT_COMPONENT';
export const ADD_SCHEMA = 'ADD_SCHEMA';
export const ADD_DEFAULT_DATA = 'ADD_DEFAULT_DATA';
export const RENDER_COMPONENT = 'RENDER_COMPONENT';
export const REMOVE_COMPONENT = 'REMOVE_COMPONENT';
export const OPEN_ADD_COMPONENT = 'OPEN_ADD_COMPONENT';
export const CLOSE_ADD_COMPONENT = 'CLOSE_ADD_COMPONENT';
// block field focusing while component is saving
// this prevents weird double-focus edge cases
// (e.g. vue forms breaking because state.ui.currentForm is null)
export const CURRENTLY_SAVING = 'CURRENTLY_SAVING';
