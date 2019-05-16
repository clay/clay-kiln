<template>
    <ui-icon-button
      buttonType="button"
      color="default"
      type="secondary"
      :ariaLabel="args.tooltip"
      :icon="args.icon || 'check_circle'"
      :loading="loading"
      :tooltip="args.tooltip"
      v-if="isShown"
      @click="$emit('abuttonclick')"
    />
</template>

<script>
  import UiIconButton from 'keen/UiIconButton';
  import { shouldBeRevealed } from '../lib/forms/field-helpers';
  import { revealProp } from '../lib/utils/references';

  export default {
    props: ['name', 'data', 'schema', 'args', 'initialFocus'],
    components: { UiIconButton },
    data() {
      return {
        loading: false,
        isShown: shouldBeRevealed(this.$store, this.args[revealProp], this.name)
      };
    }
  };
</script>
