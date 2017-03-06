<style lang="sass">
  @import '../../styleguide/panes';

  .pane-tabs-titles-list {
    @include pane-tab-list();
  }
</style>

<template>
  <ul class="pane-tabs-titles-list">
    <li v-for="(tab, index) in tabs" ref="tab">
      <button type="button" class="pane-tabs-titles-list-trigger" :class="{ 'active' : isActive(index) }" @click.stop="selectTab(index)">
        <span v-html="tab"></span>
      </button>
    </li>
  </ul>
</template>


<script>
  import _ from 'lodash';

  export default {
    props: ['tabs', 'activeIndex', 'selectTab'],
    data() {
      return {
        activeTab: 0
      };
    },
    computed: {},
    mounted() {},
    methods: {
      isActive(index) {
        return this.activeIndex === index;
      }
    }
  };
</script>
