<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .filterable-list-item {
    align-items: center;
    background-color: $list-bg;
    color: $list-bg-active;
    display: flex;
    padding: 0 16px;
    position: relative;
    transition: 200ms background-color ease-out;

    &:after {
      background-color: currentColor;
      content: '';
      height: 100%;
      left: 0;
      opacity: 0;
      pointer-events: none;
      position: absolute;
      top: 0;
      transition: opacity 600ms ease-out;
      user-select: none;
      width: 0%;
    }

    &.clickable:hover,
    &.clickable.focused {
      background-color: $list-bg-hover;
    }

    &.active:after {
      opacity: 0.4;
      transition: opacity 600ms ease-out;
      width: 100%;
    }

    &-drag,
    &-settings,
    &-delete {
      color: $text-alt-color;
    }

    &-btn {
      @include type-subheading();

      appearance: none;
      background: transparent;
      border: none;
      cursor: default;
      flex-grow: 1;
      height: 48px;
      padding: 0;
      text-align: left;
      vertical-align: middle;

      .clickable & {
        cursor: pointer;
      }

      &:focus {
        outline: none;
      }
    }

    &.selected &-btn {
      // some lists allow for denoting a "selected" item
      // e.g. spaces, component finder
      font-weight: bold;
    }

    &-delete {
      border-left: 1px solid $pane-list-divider;
    }
  }
</style>

<template>
  <li class="filterable-list-item" :data-item-id="item.id" :ref="item.id" :class="{ focused: focused, active: active, selected: selected, 'clickable': onClick }" @click.stop="handleClick(item.id, item.title)">
    <ui-icon-button v-if="onReorder" type="button" class="filterable-list-item-drag" tooltip="Drag to Reorder" icon="drag_handle"></ui-icon-button>
    <button
      type="button"
      class="filterable-list-item-btn"
      v-conditional-focus="focused"
      @keydown.down.stop.prevent="focusOnIndex(index + 1)"
      @keydown.up.stop.prevent="focusOnIndex(index - 1)"
      @keydown.enter.stop.prevent="onEnterDown"
      @keyup.enter.stop="onEnterUp">
      {{ item.title }}
    </button>
    <ui-ripple-ink v-if="onClick" ref="ripple" :trigger="item.id"></ui-ripple-ink>
    <ui-icon-button v-if="onSettings" type="button" class="filterable-list-item-settings" tooltip="Open Settings" icon="settings" @click.stop="onSettings(item.id)"></ui-icon-button>
    <ui-icon-button v-if="onDelete" type="button" class="filterable-list-item-delete" tooltip="Remove from List" icon="delete" @click.stop="onDelete(item.id)"></ui-icon-button>
  </li>
</template>

<script>
  import UiIconButton from 'keen/UiIconButton';
  import UiRippleInk from 'keen/UiRippleInk';

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
      UiIconButton,
      UiRippleInk
    }
  };
</script>
