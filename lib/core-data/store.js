import { createStore, applyMiddleware } from 'redux';
import Vue from 'vue';
import Revue from 'revue';
import promiseMiddleware from 'redux-promise-middleware';
import reducer from './reducer';

const reduxStore = createStore(reducer, {}, applyMiddleware(promiseMiddleware())),
  store = new Revue(Vue, reduxStore);

export default store;
