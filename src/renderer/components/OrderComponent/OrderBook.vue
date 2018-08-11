<template>
<div class="wrap">
  <table class="table sells is-fullwidth">
    <thead>
      <tr>
        <th>Price</th>
        <th>Size</th>
        <th><div class="field has-addons">Sum <input type="text" v-model="rows" class="input rows"></div></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="sell in sellsToShow" :style="{background: 'rgba(229,96,59,' + sell.opacity +')'}" :class="{open: sell.open}">
        <td v-on:click="sendPrice(sell)">{{sell.price.toFixed(1)}}</td>
        <td>{{sell.size.toLocaleString()}}</td>
        <td>{{sell.sum.toLocaleString()}}</td>
      </tr>
    </tbody>
  </table>
  <div class="last">
    <h1 class="title is-4 is-centered">{{lastPrice.toFixed(1)}}</h1>
  </div>
  <table class="table buys is-fullwidth">
    <tbody>
      <tr v-for="buy in buysToShow" :style="{background: 'rgba(140,191,38,' + buy.opacity + ')'}" :class="{open : buy.open}">
        <td v-on:click="sendPrice(buy)">{{buy.price.toFixed(1)}}</td>
        <td>{{buy.size.toLocaleString()}}</td>
        <td>{{buy.sum.toLocaleString()}}</td>
      </tr>
    </tbody>
  </table>
</div>
</template>

<script>
const _ = require('lodash');
export default {
  data() {
    return {
      buys: [],
      sells: [],
      buysToShow: [],
      sellsToShow: [],
      rows: 17
    };
  },
  computed: {
    lastPrice() {
      return this.$store.state.lastPrice;
    },
    orders() {
      return this.$store.state.orders;
    }
  },
  methods: {
    setBuysAndSellsToShow() {
      if (this.buys.length == 0 || this.sells.length == 0) return;
      let buys = this.buys.slice(0, this.rows);
      let sells = this.sells.slice(0, this.rows);

      this.$store.commit('updateQuoteBid', {
        price: buys[0].price,
        size: buys[0].size
      });
      this.$store.commit('updateQuoteAsk', {
        price: sells[0].price,
        size: sells[0].size
      });

      buys = this.setOpenOrders(buys, 'Buy');
      sells = this.setOpenOrders(sells, 'Sell');
      /*
      let buysSum = 0;
      let sellsSum = 0;

      buys.forEach(b => {
        buysSum += b.size;
      });

      sells.forEach(s => {
        sellsSum += s.size;
      });

      let biggest = Math.max(buysSum, sellsSum);
      */

      let biggestBid = Math.max.apply(
        Math,
        buys.map(function(o) {
          return o.size;
        })
      );
      let biggestAsk = Math.max.apply(
        Math,
        sells.map(function(o) {
          return o.size;
        })
      );
      let biggest = Math.max(biggestBid, biggestAsk);

      buys = this.setOpacities(buys, biggest);
      sells = this.setOpacities(sells, biggest);

      this.buysToShow = buys;
      this.sellsToShow = sells.reverse();
    },
    setOpenOrders(book, side = 'Buy') {
      book.forEach(b => {
        let i = this.orders.findIndex(o => {
          return o.price === b.price && o.side === side;
        });
        if (i !== -1) {
          b.open = true;
        } else {
          b.open = false;
        }
      });

      return book;
    },
    sortBuys() {
      this.buys = _.orderBy(this.buys, ['price'], ['desc']);
    },
    sortSells() {
      this.sells = _.orderBy(this.sells, ['price'], ['asc']);
    },
    setOpacities(book, biggestOrder = 0) {
      let r = [];

      let curSum = 0;
      book.forEach(o => {
        curSum += o.size;
        o.sum = curSum;
        o.opacity = _.clamp((o.size / biggestOrder).toFixed(2), 0, 1);
        r.push(o);
      });
      return r;
    },
    sendPrice(price) {
      this.$eventBus.$emit('bookPriceSelected', {
        side: price.side,
        price: price.price
      });
    }
  },
  mounted() {
    this.$bitmex.socket.$on('orderBookL2', data => {
      if (data.action == 'partial') {
        let entries = data.data;

        let buys = entries.filter(entry => {
          return entry.side == 'Buy';
        });

        //buys = _.orderBy(buys, ['price'], ['desc']);

        let sells = entries.filter(entry => {
          return entry.side == 'Sell';
        });

        //sells = _.orderBy(sells, ['price'], ['asc']);

        this.buys = buys;
        this.sells = sells;

        this.sortBuys();
        this.sortSells();

        this.setBuysAndSellsToShow();
      } else if (data.action == 'update') {
        data.data.forEach(update => {
          let side = update.side === 'Buy' ? this.buys : this.sells;
          let entry = _.find(side, { id: update.id });
          if (entry) {
            entry.size = update.size;
          }
        });
        this.setBuysAndSellsToShow();
      } else if (data.action == 'insert') {
        let toInsert = data.data;
        toInsert.forEach(insert => {
          if (insert.side == 'Buy') {
            this.buys.push(insert);
            this.sortBuys();
          } else {
            this.sells.push(insert);
            this.sortSells();
          }
        });
        this.setBuysAndSellsToShow();
      } else if (data.action == 'delete') {
        data.data.forEach(del => {
          if (del.side == 'Buy') {
            let delIndex = this.buys.findIndex(buy => {
              return buy.id == del.id;
            });
            if (delIndex !== -1) {
              this.buys.splice(delIndex, 1);
              this.sortBuys();
            }
          } else {
            let delIndex = this.sells.findIndex(sell => {
              return sell.id == del.id;
            });
            if (delIndex !== -1) {
              this.sells.splice(delIndex, 1);
              this.sortSells();
            }
          }
        });
        this.setBuysAndSellsToShow();
      }
    });
  }
};
</script>

<style scoped>
.table {
  color: #fffeff;
  min-width: 259px;
}
tbody {
  background: #333;
}
.table td {
  border: none;
  padding: 0 0.6em;
  text-align: right;
}
.sells td {
}
.sells {
  margin: 0;
}
.last {
  text-align: center;
}
.buys td {
}
.open {
  color: yellow;
}

.rows {
  width: 45px;
  font-size: 12px;
  margin-left: 3px;
}
</style>
