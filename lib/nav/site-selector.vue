<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .site-selector {
    max-width: 100vw;
    width: 500px;

    @media screen and (min-width: 600px) {
      max-width: calc(100vw - 200px);
    }
  }

  .site-selector-header {
    align-items: center;
    border-bottom: 1px solid $divider-color;
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
  }

  .site-selector-header-current {
    @include type-button();

    text-transform: uppercase;
  }

  .site-selector-body {
    column-count: 2;
    column-gap: 16px;
    display: block;
    padding: 16px;
  }
</style>

<template>
  <div class="site-selector">
    <div class="site-selector-header">
      <span class="site-selector-header-current">{{ selectedSite }}</span>
      <ui-button type="secondary" :color="multiSelectColor" @click="multiSelect">{{ multiSelectText }}</ui-button>
    </div>
    <div class="site-selector-body">
      <ui-checkbox v-for="site in sites" :key="site.slug" :label="site.name" :value="site.selected" @change="select(site.slug)"></ui-checkbox>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import UiButton from 'keen/UiButton';
  import UiCheckbox from 'keen/UiCheckbox';

  export default {
    props: ['sites', 'selectedSite'],
    computed: {
      allSitesSelected() {
        return _.every(this.sites, (site) => site.selected);
      },
      multiSelectColor() {
        return this.allSitesSelected ? 'red' : 'primary';
      },
      multiSelectText() {
        return this.allSitesSelected ? 'Select None' : 'Select All';
      }
    },
    methods: {
      multiSelect() {
        this.$emit('multi-select', !this.allSitesSelected);
      },
      select(slug) {
        this.$emit('select', slug);
      }
    },
    components: {
      UiButton,
      UiCheckbox
    }
  };
</script>
