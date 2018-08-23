<template>
<div class="column">
  <h1 class="title is-6">Open Orders</h1>
  <table class="table is-striped is-bordered is-hoverable is-fullwidth">
    <thead>
      <tr>
        <th>Side</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Filled</th>
        <th>Remaining</th>
        <th>Status</th>
        <th>Update</th>
        <th>Cancel</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="order in orders" v-if="order.ordType !== 'Stop'">
        <td>{{order.side}}</td>
        <td>{{order.orderQty}}</td>
        <td>{{order.price}}</td>
        <td>{{order.cumQty}}</td>
        <td>{{order.leavesQty}}</td>
        <td>{{order.ordStatus}}</td>
        <td>
          <form action="">
            <div class="field has-addons">
              <div class="control">
                <a class="is-static button">Limit</a>
              </div>
              <div class="control is-expanded">
                <price-input class="input" v-model="order.newPrice"></price-input>
              </div>
              <div class="control">
                <a class="is-static button">Stop</a>
              </div>
              <div class="control is-expanded">
                <price-input type="text" class="input" v-model="order.newStop" />
              </div>
              <div class="control">
                <button class="button is-info" v-on:click.prevent="updateOrder(order)" :disabled="submitting">Update</button>
              </div>
            </div>
          </form>
          </td>
        <td><button class="button is-dark" v-on:click="cancelOrder(order)" :disabled="submitting">Cancel</button></td>
      </tr>
    </tbody>
  </table>
</div>
</template>

<script>
import PriceInput from './../PriceInput';
export default {
  components: {
    PriceInput
  },
  data() {
    return {
      newPrice: [],
      newStop: [],
      submitting: false
    };
  },
  methods: {
    cancelOrder(order) {
      this.submitting = true;
      this.$bitmex.cancelOrder(order.clOrdID).then(res => {
        if (res.ok) {
          this.$notify({
            type: 'success',
            title: 'Success',
            text: 'Order #' + order.clOrdID + ' cancelled'
          });
        }
        this.submitting = false;
      });
    },
    updateOrder(order) {
      this.submitting = true;

      let stopOrder = this.orders.filter(o => {
        return o.clOrdID == order.clOrdID && o.ordType == 'Stop';
      })[0];

      let stop = null;
      if (stopOrder) {
        if (!order.newStop) {
          order.newStop =
            order.side == 'Buy'
              ? Number(order.price) - Number(stopOrder.stopPx)
              : Number(stopOrder.stopPx) - Number(order.price);
        }

        let stopPx =
          order.side === 'Buy'
            ? Number(order.newPrice) - Number(order.newStop)
            : Number(order.newPrice) + Number(order.newStop);

        stop = {
          orderID: stopOrder.orderID,
          stopPx: stopPx
        };
      }

      if (!order.newPrice) {
        order.newPrice = order.price;
      }

      let newOrder = {
        orderID: order.orderID,
        price: Number(order.newPrice)
      };

      this.$bitmex.updateOrder(newOrder, stop).then(res => {
        if (res.ok) {
          this.$notify({
            type: 'success',
            title: 'Success',
            text: 'Order Updated!'
          });
        } else {
          this.$notify({
            type: 'error',
            title: 'Error Updating Order',
            text: res.data.error.message
          });
        }
        this.submitting = false;
      });
    }
  },
  computed: {
    orders() {
      return this.$store.state.orders;
    },
    toAutoUpdate() {
      return this.$store.state.ordersToAutoUpdate;
    },
    bid() {
      return this.$store.state.quote.bid.price;
    },
    ask() {
      return this.$store.state.quote.ask.price;
    }
  },
  watch: {
    bid() {
      this.toAutoUpdate.filter(o => o.side === 'Buy').forEach(o => {
        if (this.bid - o.originalPrice <= o.trailLimit || o.trailLimit == 0) {
          o.newPrice = this.bid;
          o.newStop = o.stop;
          this.updateOrder(o);
        }
      });
    },
    ask() {
      this.toAutoUpdate.filter(o => o.side === 'Sell').forEach(o => {
        if (o.originalPrice - this.ask <= o.trailLimit || o.trailLimit == 0) {
          o.newPrice = this.ask;
          o.newStop = o.stop;
          this.updateOrder(o);
        }
      });
    }
  },
  mounted() {
    this.$bitmex.socket.$on('order', orders => {
      switch (orders.action) {
        case 'partial':
          let openOrders = orders.data.filter(o => {
            return o.ordStatus !== 'Canceled';
          });
          this.$store.commit('setOrders', openOrders);
          break;
        case 'update':
          orders.data.forEach(order => {
            if (!('ordStatus' in order)) {
              this.$store.commit('updateOrder', order);
            } else {
              if (
                order.ordStatus === 'Canceled' ||
                order.ordStatus === 'Filled' ||
                order.ordStatus === 'Rejected'
              ) {
                let removeIndex = this.orders.findIndex(o => {
                  return o.orderID === order.orderID;
                });
                this.$store.commit('removeOrder', removeIndex);
                this.$store.commit('removeOrderToAutoUpdate', order);
              }
            }
          });
          break;
        case 'insert':
          orders.data.forEach(order => {
            this.$store.commit('addOrder', order);
          });
          break;
      }
    });
  }
};
</script>
