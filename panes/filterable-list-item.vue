<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/buttons';
  @import '../styleguide/typography';

  .filterable-list-item {
    align-items: center;
    border-bottom: 1px solid $pane-list-divider;
    display: flex;
    transition: 200ms border-bottom-color ease-out;

    &.focused {
      border-bottom-color: $save;
      transition: 200ms border-bottom-color ease-out;
    }

    &.active,
    &:active {
      border-bottom: 2px solid $save;
      transition: 200ms border-bottom-color ease-out;
    }

    button {
      appearance: none;
      background: transparent;
      cursor: pointer;

      &:focus {
        outline: none;
      }
    }

    &-btn {
      @include primary-text();

      border: none;
      flex-grow: 1;
      line-height: 1.4;
      padding: 15px 0;
      text-align: left;
    }

    &.selected &-btn {
      // some lists allow for denoting a "selected" item
      // e.g. spaces, component finder
      font-weight: 700;
    }

    &-drag {
      border: none;
      padding: 14px 17px 14px 0;
    }

    &-settings {
      border: none;
      padding: 14px 15px;
    }

    &-delete {
      border: none;
      border-left: 1px solid $pane-list-divider;
      padding: 14px 4px 14px 17px;
    }
  }
</style>

<template>
  <li class="filterable-list-item" :data-item-id="item.id" :class="{ focused: focused, active: active, selected: selected }">
    <button v-if="onReorder" type="button" class="filterable-list-item-drag" title="Drag to Reorder">
      <icon name="drag-grip"></icon>
    </button>
    <button
      type="button"
      class="filterable-list-item-btn"
      @click.stop="handleClick(item.id, item.title)"
      v-conditional-focus="focused"
      @keydown.down.stop="focusOnIndex(index + 1)"
      @keydown.up.stop="focusOnIndex(index - 1)"
      @keydown.enter.stop.prevent="onEnterDown"
      @keyup.enter.stop="onEnterUp">
      {{ item.title }}
    </button>
    <button v-if="onSettings" type="button" class="filterable-list-item-settings" title="Open Settings" @click.stop="onSettings(item.id)">
      <icon name="settings"></icon>
    </button>
    <button v-if="onDelete" type="button" class="filterable-list-item-delete" title="Remove from List" @click.stop="onDelete(item.id)">
      <icon name="delete"></icon>
    </button>
  </li>
</template>

<script>
  import icon from '../lib/utils/icon.vue';

  export default {
    props: ['item', 'index', 'onClick', 'onSettings', 'onDelete', 'onReorder', 'focused', 'active', 'selected', 'focusOnIndex', 'setActive'],
    data() {
      return {};
    },
    methods: {
      onEnterDown() {
        this.setActive(this.index);
      },
      onEnterUp() {
        this.setActive(this.index);
        this.onClick(this.item.id);
      },
      handleClick(id, title) {
        if (this.onClick) {
          return this.onClick(id, title);
        }
      }
    },
    components: {
      icon
    }
  };
</script>
