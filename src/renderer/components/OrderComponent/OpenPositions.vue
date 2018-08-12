<template>
  <div class="column">
    <h1 class="title is-6">Position</h1>
    <table class="table is-striped is-bordered is-hoverable is-fullwidth">
      <thead>
        <tr>
          <th>Side</th>
          <th>Qty</th>
          <th>PNL</th>
          <th>Entry</th>
          <th>Liq.Price</th>
          <th>Close</th>
          <th>Auto close</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="position.isOpen">
          <td>{{currentSide}}</td>
          <td>{{position.currentQty}}</td>
          <td>{{position.unrealisedGrossPnl}}</td>
          <td>{{position.avgEntryPrice}}</td>
          <td>{{position.liquidationPrice}}</td>
          <td>
          <form action="">
            <div class="field has-addons">
              <div class="control">
                <a class="is-static button">Limit</a>
              </div>
              <div class="control is-expanded">
                <price-input type="text" class="input" v-model="closePrice"></price-input>
              </div>
              <div class="control">
                <button class="button is-info" v-on:click.prevent="closePosition">Update</button>
              </div>
            </div>
          </form>
          </td>
          <td>
            <div class="field has-addons">
              <a  class="button is-dark" v-on:click.prevent="autoCloseLimit">Limit</a>
              <a class="button is-error" v-on:click.prevent="marketClose">Market</a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import PriceInput from './../PriceInput';
const _ = require('lodash');
export default {
  components: {
    PriceInput
  },
  data() {
    return {
      position: {},
      closePrice: 0,
      closeOrderId: ''
    };
  },
  computed: {
    currentSide() {
      return this.position.currentQty > 0 ? 'Long' : 'Short';
    },
    bid() {
      return this.$store.state.quote.bid.price;
    },
    ask() {
      return this.$store.state.quote.ask.price;
    }
  },
  watch: {
    posiiton() {
      if (!position.isOpen) {
        this.closePrice = 0;
        this.closeOrderId = '';
      }
    }
  },
  methods: {
    closePosition(autoFollow = false) {
      let side = this.position.currentQty > 0 ? 'Sell' : 'Buy';

      let existingOrder = this.$store.state.orders.findIndex(
        o => o.orderID == this.closeOrderId
      );
      if (existingOrder !== -1) {
        //this.$bitmex.cancelOrder(this.closeOrderId);
        //this.closeOrderId = '';
        this.$bitmex
          .updateOrder({
            orderID: this.closeOrderId,
            price: Number(this.closePrice)
          })
          .then(res => {
            if (res.ok) {
              this.$notify({
                title: 'Success!',
                type: 'success',
                text: 'Order updated'
              });
            } else {
              this.$notify({
                type: 'error',
                title: 'Error',
                text: res.data.error.message
              });
            }
          });
      } else {
        if (autoFollow == true) {
          this.closePrice = side == 'Buy' ? this.bid : this.ask;
        }

        this.$bitmex
          .placeOrder(
            side,
            {
              quantity: Math.abs(this.position.currentQty),
              price: this.closePrice,
              execInst: 'ReduceOnly'
            },
            false
          )
          .then(res => {
            if (res.ok) {
              let order = res.data[0];
              this.closeOrderId = order.orderID;

              this.$notify({
                type: 'success',
                title: 'Success!',
                text: 'Updated order'
              });

              if (autoFollow == true) {
                order.followMax = 0;
                order.originalPrice = this.closePrice;
                this.$store.commit('addOrderToAutoUpdate', order);
              }
            } else {
              this.$notify({
                type: 'error',
                title: 'Error',
                text: res.data.error.message
              });
            }
          });
      }
    },
    autoCloseLimit() {
      this.closePosition(true);
    },
    marketClose() {
      let side = this.position.currentQty > 0 ? 'Sell' : 'Buy';
      this.$bitmex
        .placeMarketOrder(side, {
          side: side,
          quantity: Math.abs(this.position.currentQty)
        })
        .then(res => {
          if (res.ok) {
            this.$notify({
              type: 'Success',
              title: 'Success',
              text: 'Position closed at ' + res.data.price
            });
          } else {
            this.$notify({
              type: 'error',
              title: 'Error',
              text: res.data.error.message
            });
          }
        });
    }
  },
  mounted() {
    this.$bitmex.socket.$on('position', positions => {
      let position = positions.data[0];
      switch (positions.action) {
        case 'partial':
          this.position = position;
          break;
        case 'update':
          this.position = _.assign(this.position, position);
          break;
      }
    });
  }
};
</script>