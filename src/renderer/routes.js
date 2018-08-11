import LandingPage from './components/LandingPage';
import Settings from './components/Settings';
import Vue from 'vue';
import Bitmex from './../lib/bitmex-connector';
const storage = require('electron-json-storage-sync');

export const routes = [
  {
    path: '/',
    component: LandingPage,
    name: 'Home',
    beforeEnter: (to, from, next) => {
      let auth = storage.get('auth');
      if (auth.status) {
        Vue.prototype.$auth = auth.data;
        Vue.prototype.$bitmex = new Bitmex(auth.data.key, auth.data.secret);
        next();
      } else {
        next('settings');
      }
    }
  },
  { path: '/settings', name: 'Settings', component: Settings }
];
