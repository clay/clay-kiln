<docs>
  # autocomplete-item

  Individual autocomplete item, used by `autocomplete` (which is itself used by `simple-list`).
</docs>

<style lang="sass">
  @import '../styleguide/colors';

  .autocomplete-item {
    appearance: none;
    background: transparent;
    border: none;
    cursor: pointer;
    display: block;
    font-size: 13px;
    padding: 5px 10px;
    text-align: left;
    width: 100%;

    &.selected {
      background: $save;
      color: #FFFFFF;
    }

    &:hover {
      background: $placeholder-background;
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
