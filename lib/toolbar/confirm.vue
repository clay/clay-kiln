<style lang="sass">
  @import '../../styleguide/layers';

  .kiln-confirm {
    @include confirm-layer();

    position: fixed;
  }
</style>

<template>
  <ui-confirm class="kiln-confirm" ref="uiConfirm" :title="title" :type="type" :confirmButtonText="button" @confirm="onConfirm" @close="closeConfirm">{{ text }}</ui-confirm>
</template>

<script>
  import _ from 'lodash';
  import UiConfirm from 'keen/UiConfirm';

  export default {
    computed: {
      hasConfirmation() {
        return !_.isNull(_.get(this.$store, 'state.ui.currentConfirm'));
      },
      title() {
        return _.get(this.$store, 'state.ui.currentConfirm.title') || 'Confirm Changes';
      },
      type() {
        return _.get(this.$store, 'state.ui.currentConfirm.type') || 'accent';
      },
      button() {
        return _.get(this.$store, 'state.ui.currentConfirm.button') || 'OK';
      },
      text() {
        return _.get(this.$store, 'state.ui.currentConfirm.text') || 'Do you want to confirm this?';
      }
    },
    watch: {
      hasConfirmation(val) {
        if (val) {
          this.$refs.uiConfirm.open();
        } else {
          this.$refs.uiConfirm.close();
        }
      }
    },
    methods: {
      onConfirm() {
        const fn = _.get(this.$store, 'state.ui.currentConfirm.onConfirm');

        if (fn) {
          return fn();
        }
      },
      closeConfirm() {
        this.$store.dispatch('closeConfirm');
      }
    },
    components: {
      UiConfirm
    }
  };
</script>
