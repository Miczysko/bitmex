<template>
<div class="columns is-centered">
  <div class="column is-half">
    <h1 class="title is-4">Login</h1>
    <form v-on:submit.prevent="login">
      <div class="field"><label for="" class="label">Password</label><input type="password" v-model="password" class="input"></div>
      <div class="field"><button class="button is-dark is-fullwidth">Submit</button></div>
    </form>
  </div>
</div>
</template>

<script>
import { encrypt } from './../../lib/encrypt';
import Vue from 'vue';
const storage = require('electron-json-storage-sync');
export default {
  data() {
    return {
      password: ''
    };
  },
  methods: {
    login() {
      let encrypted = storage.get('auth.v2');
      if (encrypted.status) {
        let keys = encrypt.decrypt(encrypted.data, this.password);
        Vue.prototype.$auth = keys;
        this.$router.push('/');
      } else {
      }
    }
  }
};
</script>