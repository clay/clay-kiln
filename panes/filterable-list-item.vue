<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/buttons';

  .filterable-list-item {
    align-items: center;
    border-bottom: 1px solid $pane-list-divider;
    display: flex;

    &.active {
      border-bottom-color: $save;
    }

    button {
      appearance: none;
      background: transparent;
      border: none;
      cursor: pointer;

      &:focus {
        outline: none;
      }
    }

    &-btn {
      flex-grow: 1;
      font-size: 14px;
      line-height: 1.4;
      padding: 15px 0;
      text-align: left;
    }

    &-delete {
      padding: 14px 17px;
    }

    &-settings {
      padding: 14px 15px;
    }
  }
</style>

<template>
  <li class="filterable-list-item" :data-item-id="item.id" :class="{ active : focused }">
    <button type="button" v-if="onReorder">
      <icon name="drag-grip"></icon>
    </button>
    <button
      type="button"
      class="filterable-list-item-btn"
      @click.stop="onClick(item.id)"
      v-conditional-focus="focused"
      @keydown.down.stop="focusOnIndex(index + 1)"
      @keydown.up.stop="focusOnIndex(index - 1)">
      {{ item.title }}
    </button>
    <button v-if="onSettings" type="button" class="filterable-list-item-settings" @click.stop="onSettings(item.id)">
      <icon name="settings"></icon>
    </button>
    <button v-if="onDelete" type="button" class="filterable-list-item-delete" @click.stop="onDelete(item.id)">
      <icon name="delete"></icon>
    </button>
  </li>
</template>

<script>
  import _ from 'lodash';
  import icon from '../lib/utils/icon.vue';
  import conditionalFocus from '../directives/conditional-focus';

  export default {
    props: ['item', 'index', 'onClick', 'onSettings', 'onDelete', 'onReorder', 'focused', 'focusOnIndex'],
    data() {
      return {}
    },
    components: {
      icon
    }
  };
</script>
