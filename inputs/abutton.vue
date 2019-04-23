<template>
    <ui-icon-button
    buttonType="button"
    color="default"
    type="secondary"
    :ariaLabel="args.tooltip"
    :loading="loading"
    :tooltip="args.tooltip"
    v-if="isShown"
    @click="$emit('abuttonclick')">
    <ui-icon>{{ args.icon || 'check_circle' }}</ui-icon>
  </ui-icon-button>
</template>

<script>
  import UiIcon from 'keen/UiIcon';
  import UiIconButton from 'keen/UiIconButton';
  import { shouldBeRevealed } from '../lib/forms/field-helpers';
  import { revealProp } from '../lib/utils/references';

  export default {
    props: ['name', 'data', 'schema', 'args', 'initialFocus'],
    components: { UiIcon, UiIconButton },
    data() {
      return {
        loading: false,
        isShown: shouldBeRevealed(this.$store, this.args[revealProp], this.name)
      };
    }
  };
</script>

<style>

</style>
