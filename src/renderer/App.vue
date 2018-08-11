<template>
  <div id="app">
    <notifications />
    <div class="columns header">
      <div class="column">
            <ul class="nav">
              <li v-for="route in routes">
                  <router-link :to="route.path">{{route.name}}</router-link>
              </li>
              <li v-if="!connected" class="socket-err">Disconnected... connecting</li>
            </ul>
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
import { routes } from './routes';
export default {
  data() {
    return {
      routes: routes
    };
  },
  mounted() {
    this.$router.push('/');
  },
  computed: {
    connected() {
      return this.$store.state.connected;
    }
  }
};
</script>

<style>
body {
  padding: 10px;
}

.nav li {
  display: inline-block;
  margin-left: 5px;
}
.header {
  margin: 0;
  padding: 0;
}
.header .column {
  margin: 0;
  padding: 0;
}
.socket-err {
  color: red;
  float: right;
}
</style>
