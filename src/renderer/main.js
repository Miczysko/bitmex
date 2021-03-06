import Vue from 'vue';
import axios from 'axios';
import VueRouter from 'vue-router';
import 'bulma/css/bulma.css';
import { routes } from './routes';
import Notifications from 'vue-notification';
import bitmexProxy from './../lib/proxy';

import App from './App';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { webFrame } from 'electron';

library.add(faLock);

Vue.component('font-awesome-icon', FontAwesomeIcon);

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.prototype.$eventBus = new Vue();
Vue.config.productionTip = false;

Vue.use(VueRouter);
Vue.use(Notifications);

/**
 * Start proxy server for bitmex http requests
 */
bitmexProxy();

const router = new VueRouter({
  routes
});

import store from './store';

new Vue({
  components: { App },
  template: '<App/>',
  router,
  store
}).$mount('#app');

/**
 * Add right click inspect menu
 */
const { remote } = require('electron');
const { Menu, MenuItem } = remote;

const menu = new Menu();
let rightClickPosition = null;
menu.append(
  new MenuItem({
    label: 'Inspect element',
    click() {
      remote
        .getCurrentWindow()
        .inspectElement(rightClickPosition.x, rightClickPosition.y);
    }
  })
);

window.addEventListener(
  'contextmenu',
  e => {
    e.preventDefault();
    rightClickPosition = { x: e.x, y: e.y };
    menu.popup({ window: remote.getCurrentWindow() });
  },
  false
);

window.addEventListener('keypress', e => {
  if (e.key == '-') {
    let z = webFrame.getZoomFactor();
    webFrame.setZoomFactor(z - 0.1);
  }
  if (e.key == '+') {
    let z = webFrame.getZoomFactor();
    webFrame.setZoomFactor(z + 0.1);
  }
});

// Remove old plaintext key storage
const storage = require('electron-json-storage');
storage.has('auth', (err, hasKey) => {
  if (err) {
    throw err;
  }
  if (hasKey) {
    storage.remove('auth');
  }
});
