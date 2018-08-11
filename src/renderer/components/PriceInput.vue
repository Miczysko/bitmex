<template>
<input type="text" class="input" v-bind:value="value" v-on:input="update($event.target.value)" v-on:click="select($event)"/>
</template>

<script>
export default {
  props: {
    value: {
      default: 0
    }
  },
  methods: {
    update(v) {
      this.$emit('input', v.replace(',', '.'));
    },
    select(e) {
      e.target.select();
    }
  }
};
</script>
