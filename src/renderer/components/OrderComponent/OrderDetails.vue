<template>
<div class="order-details">
  <div class="tabs is-toggle is-right is-small order-type-select">
    <ul>
      <li :class="{'is-active' : this.orderType == 'limit'}"><a v-on:click="setOrderType('limit')">Limit</a></li>
      <li :class="{'is-active': this.orderType == 'market'}"><a v-on:click="setOrderType('market')">Market</a></li>
    </ul>
  </div>
  <form v-on:submit.prevent="submit">
  <!-- Price -->
  <div class="field">
    <label for="price" class="label">Price</label>
    <div class="field has-addons">
      <price-input v-model="price" class="input control" :disabled="autoPrice || orderType == 'market'"></price-input>
      <a class="button control is-dark" v-on:click.prevent="toggleAutoPrice" v-if="orderType == 'limit'">Auto</a>
    </div>
    <div class="field" v-if="autoPrice && orderType !== 'market'">
      <div class="columns">
        <div class="column">
          <div class="field has-addons">
            <div class="control"><a class="button is-static">Trail limit</a></div>
            <div class="control is-expanded"><price-input v-model="trailLimit"></price-input></div>
            <div class="control"><a class="button is-static">$</a></div>
          </div>
        </div>
        <div class="column is-narrow">
          <div class="control"> 
              <label class="checkbox">
                <input type="checkbox" v-model="followQuote" />
                Trail
              </label>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Stop -->
  <div class="field">
    <label class="label">Stop</label>
    <div class="columns">
      <div class="column">
        <div class="field has-addons">
          <div class="control is-expanded">
            <price-input type="text" class="input" v-model="stop" v-on:input="onStopInput" />
          </div>
          <div class="control">
            <a class="button is-static">+/- $</a>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field has-addons">
          <div class="control is-expanded has-icons-right">
            <price-input type="text" v-model="stopPrice" v-on:input="onStopPriceInput"/>
            <span v-if="this.stopLocked" class="icon is-small is-right">
              <font-awesome-icon icon="lock" />
            </span>
          </div>
          <div class="control">
            <a class="button is-static">$</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Risk -->
  <div class="field">
    <label class="label">Risk</label>
    <div class="field">
      <div class="columns">
        <div class="column">
          <div class="field has-addons">
            <div class="control is-expanded">
              <price-input class="input" type="text" v-model="risk" v-on:input="onRiskInput" />
            </div>
            <div class="control"><a class="button is-static">XBT</a></div>
          </div>
        </div>
        <div class="column">
          <div class="field has-addons">
            <p class="control is-expanded"><price-input type="text" class="input" v-model="riskPercentage" v-on:input="onRiskPercentageInput" /></p>
            <p class="control"><a class="button is-static">%</a></p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Quantity -->
  <div class="field">
      <label class="label" for="quantity">Quantity</label>
      <div class="field">
        <div class="columns">
          <div class="column">
            <div class="field has-addons">
              <p class="control is-expanded has-icons-right">
                <input class="input" type="text" v-model="quantity" v-on:input="onQuantityInput" name="quantity" />
                    <span v-if="this.locked == 'quantity'" class="icon is-small is-right">
                      <font-awesome-icon icon="lock" />
                    </span>
              </p>
              <p class="control"><a class="button is-static">$</a></p>
            </div>
          </div>
          <div class="column">
            <div class="field has-addons">
              <p class="control is-expanded has-icons-right">
                <price-input type="text" class="input" v-model="totalPercentage" v-on:input="onTotalPercentageInput" name="totalPercentage" />
                  <span v-if="this.locked == 'totalPercentage'" class="icon is-small is-right">
                    <font-awesome-icon icon="lock" />
                  </span>
              </p>
              <p class="control"><a class="button is-static">%</a></p>
            </div>
          </div>
        </div>
      </div>
  </div>
  <!-- Options -->
  <div class="field" v-if="orderType == 'limit'">
    <label class="checkbox">Post only <input type="checkbox" v-model="postOnly" /></label>
  </div>
  <!-- Submit-->
  <div class="field">
    <button  class="button is-dark is-medium is-fullwidth" :class="{'is-loading' : this.submitting}" :disabled="this.submitting">{{title}}</button>
  </div>
</form>
<p class="cost">Order Value: {{cost}} ({{this.marginCost}} @ {{this.leverage}}x)</p>
</div>
</template>

<script>
import PriceInput from './../PriceInput';
import helpers from './../../../lib/helpers';
export default {
  components: { PriceInput },
  props: ['title', 'side', 'submitting'],
  data() {
    return {
      postOnly: true,
      cost: 0,
      stop: 10,
      stopPrice: 0,
      price: 0,
      quantity: 1,
      autoPrice: false,
      followQuote: false,
      trailLimit: 5,
      orderType: 'limit',
      totalPercentage: 0,
      riskPercentage: 1,
      risk: 0,
      locked: null,
      stopLocked: false
    };
  },
  mounted() {
    this.$eventBus.$on('bookPriceSelected', price => {
      if (this.side.toLowerCase() !== price.side.toLowerCase()) return;

      this.autoPrice = false;
      this.orderType = 'limit';

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
    onQuantityInput() {
      this.locked = 'quantity';
      this.calculateQuantityPercentage();
      this.calculateRisk();
      this.calculateRiskPercentage();
    },
    onTotalPercentageInput() {
      this.locked = 'totalPercentage';
      this.calculateQuantityFromTotalPercentage();
      this.calculateRisk();
      this.calculateRiskPercentage();
    },
    onRiskInput() {
      this.locked = null;
      this.calculateQuantityFromRisk();
      this.calculateQuantityPercentage();
      this.calculateRiskPercentage();
    },
    onRiskPercentageInput() {
      this.locked = null;
      this.calculateRiskFromPercentage();
      this.calculateQuantityFromRisk();
      this.calculateQuantityPercentage();
    },
    onStopInput() {
      this.stopLocked = false;
      this.calculateStopPrice();
    },
    onStopPriceInput() {
      this.stopLocked = true;
      this.calculateStop();
    },
    calculateQuantityFromTotalPercentage() {
      this.quantity = Math.round(
        this.wallet * (this.totalPercentage / 100) * this.price * this.leverage
      );
    },
    calculateQuantityFromRisk() {
      let stopPrice =
        this.side == 'buy'
          ? Number(this.price) - Number(this.stop)
          : Number(this.price) + Number(this.stop);
      let riskInUsd = this.risk * this.price;
      let stopPercentage =
        this.side == 'buy'
          ? Number(this.price) / Number(stopPrice) - 1
          : Number(stopPrice) / Number(this.price) - 1;
      stopPercentage = helpers.round(stopPercentage, 4);
      this.quantity = Math.round(riskInUsd / stopPercentage);
    },
    calculateQuantityPercentage() {
      this.totalPercentage =
        this.quantity / this.price / this.wallet / this.leverage * 100;
      this.totalPercentage = helpers.round(this.totalPercentage, 2);
    },
    calculateQuantity() {
      if (this.locked == 'quantity') {
        this.calculateQuantityPercentage();
        this.calculateRisk();
        this.calculateRiskPercentage();
      } else if (this.locked == 'totalPercentage') {
        this.calculateQuantityFromTotalPercentage();
        this.calculateRisk();
        this.calculateRiskPercentage();
      } else {
        this.calculateQuantityFromRisk();
        this.calculateQuantityPercentage();
      }
    },
    calculateRiskFromPercentage() {
      this.risk = helpers.round(this.wallet * (this.riskPercentage / 100), 8);
    },
    calculateRisk() {
      let stopPrice =
        this.side == 'buy'
          ? Number(this.price) - Number(this.stop)
          : Number(this.price) + Number(this.stop);
      let stopPercentage =
        this.side == 'buy'
          ? Number(this.price) / Number(stopPrice) - 1
          : Number(stopPrice) / Number(this.price) - 1;
      stopPercentage = helpers.round(stopPercentage, 4);
      this.risk = helpers.round(this.quantity * stopPercentage / this.price, 8);
    },
    calculateRiskPercentage() {
      this.riskPercentage = this.risk / this.wallet * 100;
      this.riskPercentage = helpers.round(this.riskPercentage, 2);
    },
    placeLimitOrder() {
      let execInstructions = this.postOnly ? 'ParticipateDoNotInitiate' : '';
      let data = {
        quantity: Number(this.quantity),
        price: Number(this.price),
        stop: Number(this.stop),
        execInst: execInstructions
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
    calculateTotal() {
      let baseCost = this.quantity / this.price;
      this.cost = helpers.round(baseCost, 8);
    },
    calculateStopPrice() {
      this.stopPrice =
        this.side == 'buy'
          ? this.price - this.stop
          : Number(this.price) + Number(this.stop);
    },
    calculateStopMove() {
      this.stop =
        this.side == 'buy'
          ? this.price - this.stopPrice
          : Number(this.stopPrice) - this.price;
    },
    calculateStop() {
      if (this.stopLocked) {
        this.calculateStopMove();
      } else {
        this.calculateStopPrice();
      }
    },
    orderSubmitted(order) {
      if (this.followQuote && this.autoPrice && this.orderType == 'limit') {
        order.trailLimit = this.trailLimit;
        order.originalPrice = this.price;
        order.stop = this.stop;
        this.$store.commit('addOrderToAutoUpdate', order);
      }
    },
    setOrderType(type) {
      this.orderType = type;
      if (this.orderType == 'market') {
        this.price = this.quote;
        this.calculateQuantity();
        this.calculateQuantityPercentage();
      }
    }
  },
  computed: {
    quote() {
      return this.side == 'buy'
        ? this.$store.state.quote.bid.price
        : this.$store.state.quote.ask.price;
    },
    wallet() {
      return this.$store.getters.walletTotalInXbt;
    },
    leverage() {
      return this.$store.state.position.leverage;
    },
    marginCost() {
      return helpers.round(this.cost / this.leverage, 8);
    }
  },
  watch: {
    quote() {
      if (this.autoPrice || this.orderType == 'market') {
        this.price = this.quote;
      }
    },
    price() {
      this.calculateQuantity();
      this.calculateTotal();
      this.calculateStop();
    },
    stop() {
      this.calculateQuantity();
      this.calculateStop();
    },
    leverage() {
      if (this.price == 0) return;

      this.calculateQuantity();
      this.calculateTotal();
    },
    quantity() {
      this.calculateTotal();
    },
    wallet() {
      this.calculateRiskFromPercentage();
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
.cost {
  color: #ffffff;
}
</style>
