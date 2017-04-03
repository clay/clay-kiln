<style lang="sass">
  @import '../styleguide/colors';

  .view-publish-pane {
    padding: 17px;

    &-status {
      margin-bottom: 20px;
      padding-bottom: 17px;
      position: relative;

      &:after {
      border-top: 1px solid $pane-list-divider;
      content: '';
      left: -17px;
      position: absolute;
      bottom: 0;
      width: calc(100% + 34px);
      }
    }
  }

</style>

<template>
  <div class="view-publish-pane">
    <div class="view-publish-pane-status">
      <view-status></view-status>
    </div>
    <div class="view-publish-pane-actions">
      <view-actions></view-actions>
    </div>
  </div>
</template>


<script>
  import viewStatus from './publish-pane/view-status.vue';
  import viewActions from './publish-pane/view-actions.vue';

  export default {
    data() {
      return {};
    },
    components: {
      'view-status': viewStatus,
      'view-actions': viewActions
    }
  };
</script>
