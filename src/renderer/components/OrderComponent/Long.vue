<template>
  <main class="long">
      <order-details v-on:limitOrderSubmit="limit" v-on:marketOrderSubmit="market" title="Buy/Long" side="buy" :submitting="submitting"></order-details>
  </main>
</template>

<script>
import OrderDetails from './OrderDetails';

export default {
  components: { OrderDetails },
  data() {
    return {
      submitting: false
    };
  },
  methods: {
    limit(data) {
      this.submitting = true;
      this.$bitmex.placeOrder('Buy', data).then(res => {
        if (!res.ok) {
          this.$notify({
            type: 'error',
            title: 'Error placing order',
            text: res.data.error.message
          });
        } else {
          this.$notify({
            type: 'success',
            title: 'Placed Long',
            text:
              'Placed buy order for ' +
              data.quantity +
              ' contracts @ ' +
              data.price
          });
          let order = res.data.filter(o => o.ordType == 'Limit')[0];
          this.$emit('orderSubmitted', order);
        }
        this.submitting = false;
      });
    },
    market(data) {
      this.submitting = true;
      this.$bitmex.placeMarketOrder('Buy', data).then(res => {
        if (res.ok) {
          this.$notify({
            title: 'Success',
            type: 'success',
            text: 'Market bought ' + data.quantity + ' contracts'
          });
        } else {
          this.$notify({
            title: 'Error',
            type: 'error',
            message: res.data.error.message
          });
        }
        this.submitting = false;
      });
    }
  }
};
</script>

<style scoped>
.long {
  background: #8cbf26;
}
</style>

