<style lang="sass">
  @import '../../styleguide/layers';
  @import '../../styleguide/colors';

  .alert-container {
    @include toolbar-layer();

    left: 0;
    position: fixed;
    top: 64px;
    width: 100%;

    .ui-alert {
      @include toolbar-layer();

      background-color: $card-bg-color;
      box-shadow: $shadow-2dp;
      margin: 0 auto 8px;
      max-width: 768px;
    }
  }
</style>

<template>
  <div class="alert-container">
    <ui-alert v-for="(alert, index) in alerts" :key="index" :type="alert.type" :dismissible="!alert.permanent" @dismiss="dismissAlert(index)">
      <span v-html="alert.text"></span>
    </ui-alert>
    <!-- saves waiting for the CMS to be reachable again: they go through on their own -->
    <ui-alert v-if="heldSaves" class="kiln-held-saves" type="info" :dismissible="false">
      Your latest changes haven't saved yet. They'll save automatically as soon as you're connected again.
    </ui-alert>
  </div>
</template>

<script>
  import _ from 'lodash';
  import UiAlert from 'keen/UiAlert';

  export default {
    computed: {
      alerts() {
        return _.get(this.$store, 'state.ui.alerts');
      },
      heldSaves() {
        return _.get(this.$store, 'state.ui.heldSaves') > 0;
      }
    },
    methods: {
      dismissAlert(index) {
        this.$store.dispatch('removeAlert', index);
      }
    },
    components: {
      UiAlert
    }
  };
</script>
