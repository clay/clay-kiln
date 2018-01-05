<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  .autocomplete-item {
    @include type-body();

    appearance: none;
    background: transparent;
    cursor: pointer;
    display: flex;
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

    .item-value {
      align-items: flex-start;
      flex: 1;
      line-height: 32px;
    }

    .item-actions {
      align-items: flex-end;
    }
  }
</style>

<template>
  <button
    class="autocomplete-item"
    v-bind:class="{ 'selected': isActive }"
    type="button"
    @click.stop.prevent="select(value)">
    <span class="item-value">{{value}}</span>
    <span class="item-actions">
      <ui-icon-button v-show="canDestroy" icon="delete" :tooltip="`Remove ${value} from list`" @click.stop="destroy(value)" color="default" size="small" type="secondary"></ui-icon-button>
    </span>
  </button>
</template>

<script>
  import UiIconButton from 'keen/UiIconButton';

  export default {
    props: ['value', 'index', 'select', 'focusIndex', 'create', 'destroy', 'data', 'destroy'],
    data() {},
    computed: {
      isActive() {
        return this.index === this.focusIndex;
      },
      canDestroy() {
        // only show the remove button if the schema allows it
        return this.data.allowDestroy;
      }
    },
    components: {
      UiIconButton
    }
  };
</script>
