// set up file for jest tests
import Vue from 'vue';
import { mount, shallowMount } from '@vue/test-utils';
import * as cuid from 'cuid';
import Quill from 'quill/dist/quill.min';
import { convertDeltaToHtml } from 'node-quill-converter';
import Delta from 'quill-delta';

Vue.config.productionTip = false;

// global functions to mount vue components
global.mount = mount;
global.shallowMount = shallowMount; // use when you don't want to render child components

// mock logger, so you can check that mockLogger was called
global.mockLogger = jest.fn();
jest.mock('clay-log', () => ({
  init: () => {},
  meta: () => mockLogger
}));

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
