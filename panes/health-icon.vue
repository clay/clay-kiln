<style lang="sass">
  @import '../styleguide/colors';

  .health-header-wrapper {
    align-items: flex-start;
    display: flex;
  }

  .health-icon {
    height: 22px;
    margin-right: 5px;
    width: auto;

    svg {
      width: auto;
      height: 22px;
    }

    &.valid svg {
      fill: $published;
    }

    &.warnings svg {
      fill: $scheduled;
    }

    &.errors svg {
      fill: $bright-error;
    }
  }

  .health-header {
    position: relative;
  }
</style>

<template>
  <div class="health-header-wrapper">
    <icon name="health-valid" v-if="icon === 'valid'" class="health-icon valid"></icon>
    <icon name="health-warnings" v-else-if="icon === 'warnings'" class="health-icon warnings"></icon>
    <icon name="health-errors" v-else-if="icon === 'errors'" class="health-icon errors"></icon>
    <span class="health-header pane-tab-title">Health</span>
  </div>
</template>

<script>
  import _ from 'lodash';
  import icon from '../lib/utils/icon.vue';

  export default {
    data() {
      return {};
    },
    computed: {
      icon() {
        const validation = this.$store.state.validation;

        if (!_.isEmpty(validation.errors)) {
          return 'errors';
        } else if (!_.isEmpty(validation.warnings)) {
          return 'warnings';
        } else {
          return 'valid';
        }
      }
    },
    components: {
      icon
    }
  };
</script>
