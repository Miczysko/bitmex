<template>
  <div class="wrap">
    <div class="columns">
      <div class="column">
        <div class="columns wallet-wrap">
          <div class="column wallet">
            <span class="wallet">Av: {{availableBalance}} / Total: {{totalBalance}}</span>
          </div>
        </div>
        <div class="columns">
          <div class="column">
            <long></long>
          </div>
          <div class="column">
            <short></short>
          </div>
        </div>
        <div class="columns open-orders">
          <open-orders></open-orders>
        </div>
        <div class="columns open-position">
          <open-positions></open-positions>
        </div>
        <div class="columns alerts">
          <alerts></alerts>
        </div>
      </div>
      <div class="column is-narrow">
        <order-book></order-book>
      </div>
      <div class="column is-narrow">
        <fills></fills>
      </div>
    </div>
  </div>
</template>

<script>
import Short from './OrderComponent/Short';
import Long from './OrderComponent/Long';
import OpenOrders from './OrderComponent/OpenOrders';
import OpenPositions from './OrderComponent/OpenPositions';
import OrderBook from './Ordercomponent/OrderBook';
import Fills from './OrderComponent/Fills';
import Alerts from './Alerts';
const _ = require('lodash');

export default {
  name: 'bitmex-vue',
  components: {
    Short,
    Long,
    OpenOrders,
    OpenPositions,
    OrderBook,
    Fills,
    Alerts
  },
  data() {
    return {
      bestBid: 0,
      bestAsk: 0,
      lastPrice: 0
    };
  },
  computed: {
    availableBalance() {
      return this.$store.getters.walletAvailableInXbt;
    },
    totalBalance() {
      return this.$store.getters.walletTotalInXbt;
    }
  },
  mounted() {
    this.$bitmex.socket.$on('margin', res => {
      let wallet = res.data[0];
      if (res.action == 'partial') {
        this.$store.commit('createWallet', wallet);
      } else if (res.action == 'update') {
        this.$store.commit('updateWallet', wallet);
      }
    });
  }
};
</script>

<style>
body {
  padding: 10px;
}
.long,
.short {
  padding: 10px;
}
.column.wallet {
  padding: 0 0.75rem;
}
span.wallet {
  float: right;
}
.columns.wallet-wrap {
  margin-bottom: 0;
}
</style>
