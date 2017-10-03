<style lang="sass">
  .segmented-button-segment {
    align-items: center;
    display: flex;
    height: 38px;
    justify-content: center;
    padding: 4px 8px;
    width: 44px;

    input[type="radio"] {
      display: none;
    }

    .segmented-button-segment-label {
      display: block;
      cursor: pointer;
    }

    .segmented-button-segment-label img {
      height: auto;
      min-height: 22px;
      width: 24px;
    }
  }
</style>

<template>
  <div class="segmented-button-segment" :ref="option.id">
    <input type="radio" :name="name" :id="option.id" :checked="option.checked" :value="option.value" @change="update(option.value)" />
    <label class="segmented-button-segment-label" :class="{ checked: option.checked }" :for="option.id">
      <ui-icon v-if="option.hasMaterialIcon" :icon="option.icon"></ui-icon>
      <img v-else-if="option.hasImgIcon" :src="option.icon" :alt="option.text" />
      <ui-tooltip :trigger="option.id">{{ option.text }}</ui-tooltip>
    </label>
  </div>
</template>

<script>
  import UiIcon from 'keen/UiIcon';
  import UiTooltip from 'keen/UiTooltip';

  export default {
    props: ['name', 'option', 'update'],
    data() {
      return {};
    },
    components: {
      UiIcon,
      UiTooltip
    }
  };
</script>
