// set up file for jest tests
import Vue from 'vue';
import { mount, shallowMount } from '@vue/test-utils';

Vue.config.productionTip = false;

global.mount = mount;
global.shallowMount = shallowMount; // use when you don't want to render child components
