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

    .kiln-collab-reload {
      margin-left: 12px;
    }
  }
</style>

<template>
  <div class="alert-container">
    <ui-alert v-for="(alert, index) in alerts" :key="index" :type="alert.type" :dismissible="!alert.permanent" @dismiss="dismissAlert(index)">
      <span v-html="alert.text"></span>
    </ui-alert>
    <!-- real-time collaboration couldn't catch up on changes this tab may have missed -->
    <ui-alert v-if="collabStale" class="kiln-collab-stale" type="warning" :dismissible="false">
      <span>Collaboration was interrupted — reload to make sure you have the latest changes.</span>
      <ui-button class="kiln-collab-reload" type="secondary" color="primary" size="small" @click="reload">Reload</ui-button>
    </ui-alert>
  </div>
</template>

<script>
  import _ from 'lodash';
  import UiAlert from 'keen/UiAlert';
  import UiButton from 'keen/UiButton';

  export default {
    computed: {
      alerts() {
        return _.get(this.$store, 'state.ui.alerts');
      },
      collabStale() {
        return !!_.get(this.$store, 'state.collab.stale');
      }
    },
    methods: {
      dismissAlert(index) {
        this.$store.dispatch('removeAlert', index);
      },
      reload() {
        window.location.reload();
      }
    },
    components: {
      UiAlert,
      UiButton
    }
  };
</script>
