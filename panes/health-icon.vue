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
      fill: $warning;
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
    <ui-icon icon="check_circle" v-if="icon === 'valid'" class="health-icon valid"></ui-icon>
    <ui-icon icon="warning" v-else-if="icon === 'warnings'" class="health-icon warnings"></ui-icon>
    <ui-icon icon="error" v-else-if="icon === 'errors'" class="health-icon errors"></ui-icon>
    <span class="health-header pane-tab-title">Health</span>
  </div>
</template>

<script>
  import _ from 'lodash';
  import UiIcon from 'keen-ui/src/UiIcon.vue';

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
      UiIcon
    }
  };
</script>
