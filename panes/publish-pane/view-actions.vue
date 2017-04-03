<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';
  @import '../../styleguide/buttons';

  .view-actions {
    &-text {
      @include secondary-text();

      width: 100%;
    }

    &-btn {
      @include button-outlined($pane-border);

      height: auto;
      font-size: 16px;
      margin: 20px 0 0;
      padding: 15px 0;
      width: 100%;
    }
  }
</style>

<template>
  <div class="view-actions">
    <span class="view-actions-text">For more information, click <em>Edit Page.</em></span>
    <button
      type="button"
      class="view-actions-btn"
      @click.stop="onClick">Edit Page</button>
  </div>
</template>


<script>
  import toggleEdit from '../../lib/utils/toggle-edit';

  export default {
    data() {
      return {};
    },
    methods: {
      onClick() {
        toggleEdit();
      }
    }
  };
</script>
