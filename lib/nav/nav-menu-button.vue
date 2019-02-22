<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .nav-menu-button {
    @include type-button();

    align-items: center;
    background-color: $pure-black;
    border: none;
    border-radius: 0;
    color: $pure-white;
    cursor: pointer;
    display: flex;
    flex: 0 0 auto;
    font-weight: bold;
    height: 48px;
    justify-content: flex-start;
    outline: none;
    padding: 0 16px;
    position: relative;
    width: 100%;

    &.is-large {
      height: 56px;
    }

    &.is-selected:not(:hover) {
      background-color: $md-blue-grey-800;
    }

    &:hover {
      background-color: $md-blue-grey-900;
    }

    .ui-icon {
      margin-right: 8px;
    }
  }
</style>

<template>
  <button ref="button" type="button" class="nav-menu-button" :class="{ 'is-selected': isSelected, 'is-large': size === 'large' }" @click="onClick">
    <ui-icon v-if="icon" :icon="icon"></ui-icon>
    <span class="nav-menu-button-text"><slot></slot></span>
    <ui-ripple-ink trigger="button"></ui-ripple-ink>
  </button>
</template>

<script>
  import _ from 'lodash';
  import UiIcon from 'keen/UiIcon';
  import UiRippleInk from 'keen/UiRippleInk';

  export default {
    props: ['id', 'icon', 'size'],
    computed: {
      isSelected() {
        return _.get(this.$store, 'state.ui.currentDrawer') === this.id;
      }
    },
    methods: {
      onClick() {
        this.$emit('nav-click', this.id);
      }
    },
    components: {
      UiIcon,
      UiRippleInk
    }
  };
</script>
