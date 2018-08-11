import Vuex from 'vuex';
import Vue from 'vue';

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
    ordersToAutoUpdate: []
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
      let i = state.orders.findIndex(o => o.orderID === order.orderID);
      if (i !== -1) {
        state.orders[i] = order;
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
    }
  }
});
