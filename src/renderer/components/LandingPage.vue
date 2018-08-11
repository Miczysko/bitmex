<template>
  <div class="wrap">
    <div class="columns">
      <div class="column">
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
  mounted() {}
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
</style>
