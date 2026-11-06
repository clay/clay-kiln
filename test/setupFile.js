// set up file for jest tests
import Vue from 'vue';
import { mount, shallowMount } from '@vue/test-utils';
import * as cuid from 'cuid';
import Quill from 'quill/dist/quill.min';
import { convertDeltaToHtml } from 'node-quill-converter';
import Delta from 'quill-delta';

Vue.config.productionTip = false;

// kiln relies on the browser's own fetch (it used to import the whatwg-fetch polyfill, which
// does nothing in any browser kiln supports) but Jest's jsdom has none. Tests mock the api,
// so this only fails loudly if one reaches for the network by accident.
if (typeof global.fetch !== 'function') {
  global.fetch = () => Promise.reject(new Error('fetch is not stubbed in this test'));
}

// Quill's polyfill calls document.execCommand('enableObjectResizing') on
// DOMContentLoaded. The jsdom bundled with Jest 29 no longer stubs execCommand
// (the jsdom under Jest 23 did), so the call throws and kills the test worker.
// Restore the no-op stub; nothing in the tests relies on execCommand.
if (typeof document.execCommand !== 'function') {
  document.execCommand = () => false;
}

// global functions to mount vue components
global.mount = mount;
global.shallowMount = shallowMount; // use when you don't want to render child components

// mock logger, so you can check that mockLogger was called
global.mockLogger = jest.fn();
jest.mock('clay-log', () => ({
  init: () => {},
  meta: () => mockLogger
}));

global.window.kiln = { inputs: {} };

// mock cuid because it doesn't like being run in jsdom
jest.mock('cuid');
cuid.default.mockReturnValue('abc');

// add jsdom-compliant quill polyfill for dealing with deltas
jest.mock('quill/dist/quill.min.js');
Quill.mockImplementation(function QuillMock() {
  this.root = { innerHTML: '' };
  this.setContents = function (delta) {
    this.root.innerHTML = convertDeltaToHtml(delta);
  };
  this.imports = {}; // phrase blots
  this.register = function (blotName, blotConfig) {
    this.imports[blotName] = blotConfig;
  };
});
// note: yeah, we're using actual quill deltas here. pretty snazzy eh?
Quill.import.mockImplementation(() => Delta);
