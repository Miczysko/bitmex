<template>
<div class="columns is-centered">
  <div class="column is-half">
    <div class="notification is-primary">
      <p>Enter a strong randomly generated password, or at the very least something not used elsewhere. Keep it safe, but if you do lose it you'll 
        just have to generate new keys on bitmex and set them up here again.
      </p>
    </div>
    <div class="field">
      <label class="label">Password</label>
      <input type="password" v-model="password" class="input">
    </div>
    <div class="field">
      <label class="label">API key</label>
      <input type="text" class="input" v-model="key" />
    </div>
    <div class="field">
      <label class="label">API secret</label>
      <input type="text" class="input" v-model="secret"/>
    </div>
    <div class="field">
      <button class="button is-dark is-fullwidth" v-on:click="save" :disabled="submitting">Submit</button>
    </div>
    <hr />
    <h2 class="title is-4">Preferences</h2>
    <div class="field">
      <label class="label checkbox">
        Discounted fees
        <input type="checkbox" v-model="preferences.discounted" v-on:change="savePreferences" />
      </label>
    </div>
  </div>
</div>
</template>

<script>
const storage = require('electron-json-storage-sync');
import Vue from 'vue';
import Bitmex from './../../lib/bitmex-connector';
import { encrypt } from './../../lib/encrypt.js';
const crypto = require('crypto');

const algo = 'aes-256-ctr';

export default {
  data() {
    return {
      key: '',
      secret: '',
      password: '',
      submitted: false,
      submitting: false
    };
  },
  methods: {
    save() {
      this.submitting = true;

      let s = { key: this.key, secret: this.secret };
      const auth = encrypt.encrypt(JSON.stringify(s), this.password);
      const res = storage.set('auth.v2', auth);

      if (res.status) {
        this.submitting = false;
        this.submitted = true;
        Vue.prototype.$auth = null;
        this.$router.push('/');
      }
    },
    savePreferences() {
      this.$store.commit('setPreferences', this.preferences);
    }
  },
  computed: {
    preferences() {
      return this.$store.getters.preferences;
    }
  }
};
</script>
