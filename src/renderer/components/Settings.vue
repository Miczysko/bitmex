<template>
<div class="columns">
  <div class="column">
    <div class="field">
      <label class="label">API key</label>
      <input type="text" class="input" v-model="key" v-on:change="save" />
    </div>
    <div class="field">
      <label class="label">API secret</label>
      <input type="text" class="input" v-model="secret" v-on:change="save"/>
    </div>
  </div>
</div>
</template>

<script>
const storage = require('electron-json-storage-sync');
import Vue from 'vue';
import Bitmex from './../../lib/bitmex-connector';
export default {
  data() {
    return {
      key: '',
      secret: ''
    };
  },
  methods: {
    save() {
      const auth = { key: this.key, secret: this.secret };
      const res = storage.set('auth', auth);

      if (res.status) {
        Vue.prototype.$auth = auth;
        Vue.prototype.$bitmex = new Bitmex(auth.key, auth.secret);
      }
    }
  },
  mounted() {
    const auth = storage.get('auth');
    if (auth.status) {
      this.key = auth.data.key;
      this.secret = auth.data.secret;
    }
  }
};
</script>
