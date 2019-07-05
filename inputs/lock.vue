<docs>
  # `lock`

  Appends a lock button to an input. The input will be locked until the user clicks the lock button. This provides a small amount of friction before editing important (and rarely-edited) fields, similar to macOS's system preferences.
</docs>

<template>
  <ui-icon-button
    buttonType="button"
    color="default"
    type="secondary"
    ariaLabel="Lock"
    :icon="icon"
    @click.stop.prevent="toggleLock"
    v-dynamic-events="customEvents"></ui-icon-button>
</template>

<script>
  import UiIconButton from 'keen/UiIconButton';
  import { DynamicEvents } from './mixins';

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        locked: true,
        icon: 'lock_outline'
      };
    },
    methods: {
      toggleLock() {
        if (this.locked) {
          // unlock!
          this.$emit('enable');
          this.locked = false;
          this.icon = 'lock_open';
        } else {
          // lock it again!
          this.$emit('disable');
          this.locked = true;
          this.icon = 'lock_outline';
        }
      }
    },
    mounted() {
      this.$emit('disable'); // should be disabled by default
    },
    components: {
      UiIconButton
    }
  };
</script>
