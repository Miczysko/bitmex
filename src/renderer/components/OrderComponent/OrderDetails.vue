<template>
<div class="order-details">
  <div class="tabs is-toggle is-right is-small order-type-select">
    <ul>
      <li :class="{'is-active' : this.orderType == 'limit'}"><a v-on:click="setOrderType('limit')">Limit</a></li>
      <li :class="{'is-active': this.orderType == 'market'}"><a v-on:click="setOrderType('market')">Market</a></li>
    </ul>
  </div>
  <form v-on:submit.prevent="submit">
  <div class="field">
      <label class="label" for="quantity">Quantity</label>
      <input class="input" type="text" v-model="quantity" v-on:input="calculateCost" />
  </div>
  <div class="field" v-if="orderType == 'limit'">
    <label for="price" class="label">Limit Price</label>
    <div class="field has-addons">
      <price-input v-model="price" class="input control" :disabled="autoPrice"></price-input>
      <a class="button control is-dark" v-on:click.prevent="toggleAutoPrice">Auto</a>
    </div>
    <div class="field" v-if="autoPrice">
      <div class="field has-addons">
        <price-input v-model="followMax"></price-input>
          <label class="checkbox">
            <input type="checkbox" v-model="followQuote" />
            Follow best
        </label>
      </div>
    </div>
  </div>
  <div class="field">
    <label for="price" class="label">Stop ($ away from limit)</label>
    <price-input type="text" class="input" v-model="stop" />
  </div>
  <div class="field" v-if="orderType == 'limit'">
    <label class="checkbox">Post only <input type="checkbox" v-model="postOnly" /></label>
  </div>
  <div class="field">
    <button  class="button is-dark is-medium is-fullwidth" :class="{'is-loading' : this.submitting}" :disabled="this.submitting">{{title}}</button>
  </div>
</form>
</div>
</template>

<script>
import PriceInput from './../PriceInput';
export default {
  components: { PriceInput },
  props: ['title', 'side', 'submitting'],
  data() {
    return {
      postOnly: true,
      cost: 0,
      stop: 10,
      price: 0,
      quantity: 1,
      autoPrice: false,
      followQuote: false,
      followMax: 5,
      orderType: 'limit'
    };
  },
  mounted() {
    this.$eventBus.$on('bookPriceSelected', price => {
      if (this.side.toLowerCase() !== price.side.toLowerCase()) return;

      this.autoPrice = false;

      this.price = price.price;
    });

    this.$parent.$on('orderSubmitted', this.orderSubmitted);
  },
  methods: {
    submit() {
      if (this.submitting) return;

      if (this.orderType == 'limit') {
        this.placeLimitOrder();
      } else if (this.orderType == 'market') {
        this.placeMarketOrder();
      }
    },
    placeLimitOrder() {
      let data = {
        quantity: Number(this.quantity),
        price: Number(this.price),
        stop: Number(this.stop),
        post: this.postOnly
      };
      this.$emit('limitOrderSubmit', data);
    },
    placeMarketOrder() {
      let data = {
        quantity: Number(this.quantity),
        stop: Number(this.stop)
      };
      this.$emit('marketOrderSubmit', data);
    },
    toggleAutoPrice() {
      this.autoPrice = !this.autoPrice;
      if (this.autoPrice) {
        this.price = this.quote;
      }
    },
    calculateCost() {
      this.cost = this.quantity / this.price / 100;
    },
    orderSubmitted(order) {
      if (this.followQuote && this.autoPrice && this.orderType == 'limit') {
        order.followMax = this.followMax;
        order.originalPrice = this.price;
        order.stop = this.stop;
        this.$store.commit('addOrderToAutoUpdate', order);
      }
    },
    setOrderType(type) {
      this.orderType = type;
    }
  },
  computed: {
    quote() {
      return this.side == 'buy'
        ? this.$store.state.quote.bid.price
        : this.$store.state.quote.ask.price;
    }
  },
  watch: {
    quote() {
      if (this.autoPrice) {
        this.price = this.quote;
      }
    }
  }
};
</script>

<style scoped>
label {
  color: white;
}

.order-type-select {
  position: relative;
  margin: 0;
  margin-bottom: -23px;
}

.order-type-select a {
  color: white;
}

.order-type-select li.is-active a {
  background: #363636;
  border-color: #363636;
}

.order-type-select a:hover {
  background-color: #363636;
  border-color: #363636;
  z-index: 2;
}
</style>
