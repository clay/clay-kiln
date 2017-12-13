<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  .autocomplete-item {
    @include type-body();

    appearance: none;
    background: transparent;
    cursor: pointer;
    display: block;
    padding: 8px 12px;
    text-align: left;
    top: 100%;
    width: 100%;

    &:hover {
      background-color: rgba($pure-black, .06);
    }
    &.selected {
      background-color: rgba($pure-black, 0.1);
    }
  }
</style>

<template>
  <button
    class="autocomplete-item"
    v-bind:class="{ 'selected': isActive }"
    type="button"
    @click.stop.prevent="select(value)">
    {{ value }}
  </button>
</template>

<script>
  export default {
    props: ['value', 'index', 'select', 'focusIndex'],
    data() {},
    computed: {
      isActive() {
        return this.index === this.focusIndex;
      }
    }
  };
</script>
