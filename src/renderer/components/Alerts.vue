<template>
  <div class="column">
    <h1 class="title is-6">Alerts</h1>
    <div class="columns">
      <div class="column">
        <form>
          <div class="field has-addons">
            <price-input type="text" class="input" v-model="newAlert"></price-input><button class="control is-dark button" v-on:click.prevent="setAlert">Set</button>
          </div>
        </form>
      </div>
      <div class="column">
        <table class="table is-fullwidth is-bordered">
          <thead>
            <tr>
              <th>Type</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in alerts">
              <td>{{alert.type}}</td>
              <td>{{alert.price}}</td>
              <td><button class="button is-dark" v-on:click="removeAlert(alert.id)">Remove</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
const notifier = require('node-notifier');
const uniqid = require('uniqid');
const storage = require('electron-json-storage');
import PriceInput from './PriceInput';
export default {
  components: {
    PriceInput
  },
  data() {
    return {
      alerts: [],
      newAlert: 0
    };
  },
  methods: {
    setAlert() {
      this.alerts.push({
        price: this.newAlert,
        type: this.newAlert > this.last ? '>=' : '<=',
        id: uniqid()
      });
    },
    removeAlert(id) {
      let i = this.alerts.findIndex(a => a.id == id);
      if (i !== -1) {
        this.alerts.splice(i, 1);
      }
    },
    fireAlert(alert) {
      notifier.notify({
        title: 'Bitmex Price Alert!',
        message: 'Price ' + alert.type + ' than ' + alert.price
      });
      this.removeAlert(alert.id);
    },
    saveAlerts() {
      storage.set('alerts', this.alerts, err => {});
    }
  },
  computed: {
    last() {
      return this.$store.state.lastPrice;
    }
  },
  watch: {
    last() {
      this.alerts.forEach(alert => {
        if (alert.type === '>=') {
          if (this.last >= alert.price) {
            this.fireAlert(alert);
          }
        } else if (alert.type === '<=') {
          if (this.last <= alert.price) {
            this.fireAlert(alert);
          }
        }
      });
    },
    alerts() {
      this.saveAlerts();
    }
  },
  mounted() {
    storage.has('alerts', (err, hasKey) => {
      if (err) {
      } else if (hasKey) {
        storage.get('alerts', (err, data) => {
          if (err) {
          } else {
            this.alerts = data;
          }
        });
      }
    });
  }
};
</script>
