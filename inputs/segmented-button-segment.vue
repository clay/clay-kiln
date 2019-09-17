<template>
  <button class="segmented-button-segment" type="button" :class="{ 'is-checked': option.checked }" :id="option.id" :ref="option.id" :name="name" :disabled="disabled" @click.stop.prevent="$emit('update', option.value)">
    <ui-icon v-if="option.hasMaterialIcon" :icon="option.icon"></ui-icon>
    <img v-else-if="option.hasImgIcon" class="segmented-button-img" :src="option.icon" :alt="option.text" />
    <span v-else class="segmented-button-text">{{ option.text }}</span>
    <ui-ripple-ink :trigger="option.id"></ui-ripple-ink>
    <ui-tooltip v-if="option.hasMaterialIcon || option.hasImgIcon" :trigger="option.id">{{ option.text }}</ui-tooltip>
  </button>
</template>

<script>
  import UiIcon from 'keen/UiIcon';
  import UiTooltip from 'keen/UiTooltip';
  import UiRippleInk from 'keen/UiRippleInk';

  export default {
    props: ['name', 'option', 'update', 'disabled'],
    data() {
      return {};
    },
    components: {
      UiIcon,
      UiTooltip,
      UiRippleInk
    }
  };
</script>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/animations';
  @import '../styleguide/typography';

  .segmented-button-segment {
    align-items: center;
    background-color: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    color: $text-color;
    cursor: pointer;
    display: flex;
    height: 36px;
    flex: 0 1 auto;
    justify-content: center;
    margin: 0;
    opacity: .4;
    outline: 0;
    padding: 0 8px;
    position: relative;
    transition: color $standard-time $toggle-curve;

    &:before {
      border-radius: inherit;
      color: inherit;
      content: '';
      height: 100%;
      left: 0;
      opacity: .12;
      position: absolute;
      top: 0;
      transition: $standard-time $toggle-curve;
      width: 100%;
    }

    &:first-child {
      border-bottom-left-radius: 2px;
      border-top-left-radius: 2px;
    }

    &:not(:last-child) {
      border-right: 1px solid transparent;
    }

    &:last-child {
      border-bottom-right-radius: 2px;
      border-top-right-radius: 2px;
    }

    &:hover:before,
    &:focus:before,
    &.is-checked:before {
      background-color: currentColor;
    }

    &.is-checked {
      opacity: 1;
    }

    .segmented-button-img {
      height: auto;
      min-height: 22px;
      width: 24px;
    }

    .segmented-button-text {
      @include type-button();

      height: auto;
      min-height: 14px;
    }
  }
</style>
