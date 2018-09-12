<template>
<div class="fillbook">
  <div class="field"><label class="checkbox">Significant Trades<input type="checkbox" v-model="preferences.significantTrades" v-on:change="savePrefs" /></label></div>
  <webview class="significant-trades" v-if="preferences.significantTrades" src="https://tucsky.github.io/SignificantTrades/#"></webview>
  <table v-if="!preferences.significantTrades" class="table is-fullwidth">
    <thead>
      <tr>
        <th>Price</th>
        <th>Size</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="fill in fills" v-bind:class="{buy : fill.side == 'Buy', sell: fill.side =='Sell', bigOrder: fill.big}">
        <td>{{fill.price.toFixed(1)}}</td>
        <td>{{fill.size.toLocaleString()}}</td>
        <td>{{formatTime(fill.timestamp)}}</td>
      </tr>
    </tbody>
  </table>
</div>
</template>

<script>
const moment = require('moment');
export default {
  data() {
    return {
      fills: [],
      useSignificantTrades: true
    };
  },
  mounted() {
    this.$bitmex.socket.$on('trade', data => {
      if (data.action == 'insert') {
        let fill = data.data[0];
        this.$store.commit('updateLastPrice', Number(fill.price));
        if (fill.size > 100000) fill.big = true;

        this.fills.unshift(fill);
      } else if (data.action == 'partial') {
        data.data.forEach(fill => {
          this.fills.push(fill);
        });
      }
    });
  },
  methods: {
    formatTime(timestamp) {
      return moment(timestamp).format('HH:mm:ss');
    },
    savePrefs() {
      this.$store.commit('setPreferences', this.preferences);
    }
  },
  watch: {
    fills() {
      if (this.fills.length > 100) {
        this.fills.length = 100;
      }
    }
  },
  computed: {
    preferences() {
      return this.$store.getters.preferences;
    }
  }
};
</script>

<style scoped>
.table {
  min-width: 227px;
}
.table td {
  padding: 0.1em 0.5em;
}
.fillbook {
  max-height: 880px;
  overflow-x: hidden;
  overflow-y: auto;
}
.buy {
  color: green;
}
.sell {
  color: red;
}
.bigOrder.buy {
  background: green;
  color: white;
}
.bigOrder.sell {
  background: red;
  color: white;
}
.significant-trades {
  max-width: 100%;
  height: 838px;
}
</style>
