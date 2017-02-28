<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/buttons';

  .kiln-pane-header {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    border-bottom: 1px solid $pane-border;
    justify-content: space-between;

    &-left {
      color: $pane-tab-active;
      font-size: 14px;
      font-weight: bold;
      padding-left: 17px;
    }

    &-right {
      &-close {
        @include icon-button($pane-tab-active, 14px);

        padding: 17px;
      }
    }
  }
</style>

<template>
  <div class="kiln-pane-header">
    <div class="kiln-pane-header-left">
      {{ title }}
    </div>
    <div class="kiln-pane-header-right">
      <button type="button" class="kiln-pane-header-right-close" @click="buttonClick"><icon :name="check"></icon></button>
    </div>
  </div>
</template>

<script>
  import icon from '../utils/icon.vue';

  /**
   * Returns a new array with only the desired
   * property as for each entry
   *
   * @param  {Array} content
   * @param  {String} property
   * @return {Array}
   */
  export default {
    props: ['title', 'buttonClick', 'check'],
    data() {
      return {};
    },
    components: {
      icon
    }
  };
</script>
