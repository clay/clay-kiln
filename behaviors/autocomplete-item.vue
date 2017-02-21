<docs>
  # text

  Autocomplete
</docs>

<style lang="sass">
  .autocomplete-item {
    appearance: none;
    background: transparent;
    border: none;
    cursor: pointer;
    display: block;
    font-size: 12px;
    text-align: left;
    width: 100%;

    &.selected {
      background: blue;
      color: white;
    }

    &:hover {
      background: grey;
    }
  }
</style>

<template>
  <button
    class="autocomplete-item"
    v-bind:class="{ 'selected': isActive }"
    type="button"
    @click="select(value)">
    {{ value }}
  </button>
</template>

<script>
  import _ from 'lodash';

  export default {
    props: ['value', 'index', 'select', 'focusIndex'],
    data() {},
    computed: {
      isActive() {
        return this.index === this.focusIndex;
      }
    },
    methods: {}
  };
</script>
