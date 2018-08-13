import LandingPage from './components/LandingPage';
import Settings from './components/Settings';
import Login from './components/Login';
import Vue from 'vue';
import Bitmex from './../lib/bitmex-connector';
const storage = require('electron-json-storage-sync');

export const routes = [
  {
    path: '/',
    component: LandingPage,
    name: 'Home',
    beforeEnter: (to, from, next) => {
      let auth = storage.has('auth.v2');
      if (auth.status && !auth.data) {
        next('settings');
      } else if (!Vue.prototype.$auth) {
        next('login');
      } else {
        if (Vue.prototype.$bitmex) {
          Vue.prototype.$bitmex.socket.$off();
        }
        Vue.prototype.$bitmex = new Bitmex(
          Vue.prototype.$auth.key,
          Vue.prototype.$auth.secret
        );
        next();
      }
    }
  },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/login', name: 'Login', component: Login }
];
