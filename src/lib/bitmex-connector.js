const axios = require('axios');
const crypto = require('crypto');
const qs = require('qs');
const uniqid = require('uniqid');
const WebSocket = require('ws');
const http = require('http');
import Vue from 'vue';
import store from './../renderer/store';

export default class Bitmex {
  constructor(key, secret) {
    this.key = key;
    this.secret = secret;
    this.proxyBaseUrl = 'http://localhost:2080/';
    this.apiUrl = 'https://www.bitmex.com';
    this.socket = new Vue();

    this.connectSocket();
  }

  connectSocket() {
    const ws = new WebSocket(
      'wss://www.bitmex.com/realtime?subscribe=quote:XBTUSD,orderBookL2:XBTUSD,trade:XBTUSD'
    );

    ws.onopen = () => {
      console.log('connected to bitmex socket');
      store.commit('setConnected', true);

      const expires = new Date().getTime() + 60 * 1000; // 1 min in the future
      const signature = crypto
        .createHmac('sha256', this.secret)
        .update('GET' + '/realtime' + expires)
        .digest('hex');

      ws.send(
        JSON.stringify({
          op: 'authKeyExpires',
          args: [this.key, expires, signature]
        }),
        res => {
          if (res) {
            console.error(res);
          } else {
            ws.send(
              JSON.stringify({
                op: 'subscribe',
                args: ['order', 'position']
              })
            );
          }
        }
      );
    };

    ws.on('message', data => {
      data = JSON.parse(data);
      if (data.table) {
        this.socket.$emit(data.table, data);
      }
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        console.log('Socket connection lost, trying to reconnect...');
        ws.terminate();
        this.connectSocket();
        store.commit('setConnected', false);
      }, 10000);
    });
  }

  getBalance() {
    return this.makeRequest('user/wallet', 'GET');
  }

  setLeverage(leverage) {
    return this.makeRequest('position/leverage', 'POST', {
      symbol: 'XBTUSD',
      leverage: leverage
    });
  }

  placeOrder(side, details, placeStop = true) {
    const id = uniqid();

    let data = {
      orders: []
    };

    if (placeStop) {
      let trigger, stopSide;
      if (side === 'Buy') {
        trigger = details.price - details.stop;
        stopSide = 'Sell';
      } else {
        trigger = details.price + details.stop;
        stopSide = 'Buy';
      }

      let stopConf = {
        symbol: 'XBTUSD',
        ordType: 'Stop',
        orderQty: details.quantity,
        stopPx: trigger,
        side: stopSide,
        execInst: 'Close,LastPrice',
        clOrdID: id
      };
      data.orders.push(stopConf);
    }

    let order = {
      symbol: 'XBTUSD',
      ordType: 'Limit',
      orderQty: details.quantity,
      price: Number(details.price),
      side: side,
      execInst: details.execInst,
      clOrdID: id
    };

    data.orders.push(order);

    return this.makeRequest('order/bulk', 'POST', data);
  }

  placeMarketOrder(side, data) {
    return this.makeRequest('order', 'POST', {
      side: side,
      symbol: 'XBTUSD',
      orderQty: data.quantity
    }).then(res => {
      if (!data.stop) {
        return res;
      }
      if (res.ok) {
        let order = res.data;
        let stop = {
          ordType: 'Stop',
          symbol: 'XBTUSD',
          side: order.side == 'Buy' ? 'Sell' : 'Buy',
          stopPx:
            order.side == 'Buy'
              ? order.price - data.stop
              : order.price + data.stop,
          orderQty: data.quantity,
          execInst: 'Close, LastPrice'
        };
        return this.makeRequest('order', 'POST', stop);
      } else {
        return res;
      }
    });
  }

  updateOrder(newOrder, newStop) {
    let orders = [];
    if (newOrder) {
      orders.push(newOrder);
    }
    if (newStop) {
      orders.push(newStop);
    }
    return this.makeRequest('order/bulk', 'PUT', {
      orders: orders
    });
  }

  cancelOrder(id) {
    return this.makeRequest('order', 'DELETE', { clOrdID: id });
  }

  cancelAllOrders() {
    return this.makeRequest('order/all', 'DELETE');
  }

  getOpenOrders(filter = {}) {
    return this.makeRequest('order', 'GET', filter);
  }

  makeRequest(endpoint, verb, data = '') {
    const path = '/api/v1/' + endpoint;
    let fullUrl = '';

    if (verb === 'GET') {
      fullUrl = this.apiUrl + path;
    } else {
      fullUrl = this.proxyBaseUrl + endpoint;
    }
    const expires = new Date().getTime() + 60 * 1000; // 1 min in the future

    let postBody = '',
      query = '';

    if (verb === 'GET') {
      query = '?' + qs.stringify(data);
    } else {
      postBody = JSON.stringify(data);
    }

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(verb + path + query + expires + postBody)
      .digest('hex');

    let config = {
      headers: {
        //'Content-Type': 'application/json',
        //Accept: 'application/json',
        //'X-Requested-With': 'XMLHttpRequest',
        'api-expires': expires,
        'api-key': this.key,
        'api-signature': signature
      },
      method: verb,
      url: fullUrl,
      httpAgent: new http.Agent({ keepAlive: true })
    };

    if (verb === 'GET') {
      config.url = fullUrl + query;
    } else {
      if (data) config.data = data;
    }
    return axios(config)
      .then(res => {
        return { ok: true, data: res.data };
      })
      .catch(res => {
        console.error(res.response);
        res.ok = false;
        return res.response;
      });
  }
}
