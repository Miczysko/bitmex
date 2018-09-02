import Vuex from 'vuex';
import Vue from 'vue';
const storage = require('electron-json-storage-sync');
const _ = require('lodash');
import helpers from './../lib/helpers';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    quote: {
      bid: {
        price: 0,
        size: 0
      },
      ask: {
        price: 0,
        size: 0
      }
    },
    lastPrice: 0,
    orders: [],
    connected: false,
    ordersToAutoUpdate: [],
    wallet: {},
    position: {},
    preferences: null,
    defaultPreferences: {
      discounted: false,
      significantTrades: false
    },
    positionHistory: []
  },
  mutations: {
    updateQuoteBid(state, bid) {
      state.quote.bid = bid;
    },
    updateQuoteAsk(state, ask) {
      state.quote.ask = ask;
    },
    updateLastPrice(state, price) {
      state.lastPrice = price;
    },
    setOrders(state, orders) {
      state.orders = orders;
    },
    updateOrder(state, order) {
      let matchingOrder = state.orders.find(o => {
        return o.orderID === order.orderID;
      });
      if (matchingOrder) {
        matchingOrder = _.assign(matchingOrder, order);
      }
    },
    removeOrder(state, id) {
      if (id !== -1) {
        state.orders.splice(id, 1);
      }
    },
    addOrder(state, order) {
      order.newPrice = order.price;
      state.orders.push(order);
    },
    setConnected(state, val = true) {
      state.connected = val;
    },
    addOrderToAutoUpdate(state, order) {
      state.ordersToAutoUpdate.push(order);
    },
    removeOrderToAutoUpdate(state, order) {
      let i = state.ordersToAutoUpdate.findIndex(
        o => o.orderID === order.orderID
      );
      if (i !== -1) {
        state.ordersToAutoUpdate.splice(i, 1);
      }
    },
    createWallet(state, wallet) {
      state.wallet = wallet;
    },
    updateWallet(state, wallet) {
      state.wallet = _.assign(state.wallet, wallet);
    },
    createPosition(state, position) {
      state.position = position;
    },
    updatePosition(state, position) {
      state.position = _.assign(state.position, position);
    },
    setPreferences(state, data) {
      state.preferences = data;
      storage.set('preferences', data);
    },
    addToPositionHistory(state, data) {
      state.positionHistory.push(data);
      storage.set('positionHistory', state.positionHistory);
    }
  },
  getters: {
    walletTotalInXbt: state => {
      return helpers.round(state.wallet.walletBalance / 100000000, 8);
    },
    walletAvailableInXbt: state => {
      return helpers.round(state.wallet.availableMargin / 100000000, 8);
    },
    preferences: state => {
      if (!state.preferences) {
        let prefs = storage.get('preferences');
        if (prefs.status) {
          state.preferences = prefs.data;
        } else {
          return state.defaultPreferences;
        }
      }
      return state.preferences;
    },
    positionHistory: state => {
      if (state.positionHistory.length == 0) {
        let p = storage.get('positionHistory');
        if (p.status) {
          state.positionHistory = p.data;
        }
      }
      return state.positionHistory;
    }
  }
});
