<style lang="sass">

  .publish-pane {
    padding: 17px;

    &-status {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid;
    }
  }

</style>

<template>
  <div class="publish-pane">
    <div class="publish-pane-status">
      <page-status></page-status>
    </div>
    <div class="publish-pane-actions">
      <page-actions></page-actions>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';
  import pageStatus from './publish-pane/page-status.vue';
  import pageActions from './publish-pane/page-actions.vue';

  export default {
    props: [],
    data() {
      return {}
    },
    methods: {},
    components: {
      'page-status': pageStatus,
      'page-actions': pageActions
    }
  };
</script>
