<docs>
  # simple-list-item

  A component which represents a single item in the `simple-list` component. Functionality is derived from its parent.
</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/buttons';

  .simple-list-item {
    @include button-outlined($button-outline, $toolbar-icons);

    background-color: transparent;
    display: inline-block;
    flex: 0 0 auto;
    margin: 0 12px 12px 0;
    position: relative;
    user-select: none;
  }

  .simple-list-item.selected {
    border: 2px solid $save;
  }

  .simple-list-item.has-badge {
    border: 2px solid $published;

    .badge {
      background-color: $toolbar-icons;
      border: 2px solid $published;
      border-radius: 10px;
      display: block;
      font-size: 9px;
      font-weight: bold;
      height: 20px;
      line-height: 12px;
      padding: 2px;
      position: absolute;
      right: -6px;
      top: -9px;
    }
  }
</style>

<template>
  <button type="button"
    class="simple-list-item"
    :class="{ 'selected': isActive, 'has-badge': property }"
    @keydown.left="selectItem(index - 1)"
    @keydown.right="selectItem(index + 1)"
    @keydown.delete="removeItem"
    @click="selectItem(index)"
    v-conditional-focus="isActive">
    {{ value }}
    <span v-if="property" class="badge">{{badge}}</span>
  </button>
</template>

<script>
  export default {
    props: [
      'index',
      'focusIndex',
      'value',
      'selectItem',
      'removeItem',
      'badge',
      'property'
    ],
    data() {
      return {};
    },
    computed: {
      isActive() {
        return this.index === this.focusIndex;
      }
    },
    methods: {}
  };
</script>
