<style lang="sass">
  @import '../styleguide/typography';
  @import '../styleguide/colors';
  @import '../styleguide/animations';

  .simple-list-item {
    @include kiln-copy();

    align-items: center;
    background-color: $chip-bg-color;
    border: none;
    border-radius: 16px;
    color: $text-color;
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 13px;
    height: 32px;
    justify-content: center;
    margin: 5px 5px 5px 0;
    padding: 0;
    transition: all $standard-time $standard-curve;
    user-select: none;
    white-space: nowrap;

    &:focus {
      outline: none;
    }

    &:hover:not(.is-disabled) {
      background-color: $chip-bg-color--focus;
    }

    &:active:not(.is-disabled),
    &.is-current:not(.is-disabled) {
      box-shadow: $chip-shadow;
    }

    .primary-badge {
      background-color: $chip-badge-bg-color;
      border-radius: 50%;
      color: $chip-badge-color;
      display: none;
      line-height: 32px;
      height: 32px;
      margin-right: -4px;
      overflow: hidden;
      text-align: center;
      vertical-align: middle;
      width: 32px;
      font-variation-settings: 'FILL' 0,'wght' 400, 'GRAD' 0, 'opsz' 48

      &.is-text {
        color: $pure-white;
        font-weight: bold;
      }
    }

    &.is-primary .primary-badge {
      display: block;
    }

    .item-text {
      align-items: center;
      cursor: inherit;
      display: flex;
      padding: 0 12px;
      user-select: none;
      white-space: nowrap;
    }

    .simple-list-remove {
      align-items: center;
      background-color: $chip-delete-color;
      border: none;
      border-radius: 50%;
      color: $chip-bg-color;
      cursor: inherit;
      display: flex;
      height: 20px;
      justify-content: center;
      margin-right: 6px;
      padding: 0 0 0 1px;
      transition: background-color $standard-time $standard-curve, color $standard-time $standard-curve;
      width: 20px;

      .ui-icon {
        font-size: 14px;
      }
    }

    &.is-disabled {
      background-color: lighten($chip-bg-color, 10%);
      color: $text-disabled-color;

      .simple-list-remove {
        background-color: $text-disabled-color;
      }
    }

    .badge-enter,
    .badge-leave-to {
      opacity: 0;
    }

    .badge-enter-to,
    .badge-leave {
      opacity: 1;
    }

    .badge-enter-active,
    .badge-leave-active {
      transition: opacity $standard-time $standard-curve;
    }
  }
</style>

<template>
  <div class="simple-list-item"
    :class="classes"
    tabindex="0"
    @keydown.left="selectItem(index - 1)"
    @keydown.shift.tab="selectItem(index - 1)"
    @keydown.right="selectItem(index + 1)"
    @keydown.tab.prevent="selectItem(index + 1)"
    @keydown.delete.prevent="removeItem"
    @click.stop.prevent="selectItem(index)"
    v-conditional-focus="isCurrentItem">
    <transition name="badge">
      <ui-icon v-if="hasIcon && isPrimary" :icon="badge" class="primary-badge"></ui-icon>
      <span v-else-if="isPrimary" class="primary-badge is-text">{{ badge }}</span>
    </transition>
    <span class="item-text">{{ data.text }}</span>
    <button type="button" class="simple-list-remove" @click.stop.prevent="removeItem"><ui-icon icon="close"></ui-icon></button>
  </div>
</template>

<script>
  import _ from 'lodash';
  import UiIcon from 'keen/UiIcon';

  export default {
    props: ['index', 'data', 'currentItem', 'propertyName', 'badge', 'disabled'],
    data() {
      return {};
    },
    computed: {
      isPrimary() {
        return _.get(this.data, this.propertyName) === true;
      },
      isCurrentItem() {
        return this.currentItem === this.index;
      },
      hasIcon() {
        // determine if the badge is a material design icon
        // note: we assume any string over two characters is supposed to be an icon
        return this.badge && this.badge.length > 2;
      },
      classes() {
        return [
          { 'is-disabled': this.disabled },
          { 'is-primary': this.isPrimary },
          { 'is-current': this.isCurrentItem }
        ];
      }
    },
    methods: {
      selectItem(index) {
        this.$emit('select', index);
      },
      removeItem() {
        this.$emit('remove', this.index);
      }
    },
    components: {
      UiIcon
    }
  };
</script>
