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

  .site-selector-body {
    column-count: 2;
    column-gap: 16px;
    display: block;
    padding: 16px;
  }

  .site-selector-footer {
    padding: 0 16px 16px;
    width: 100%;
  }
</style>

<template>
  <div class="site-selector">
    <div class="site-selector-body">
      <ui-checkbox v-for="site in sites" color="accent" :key="siteSlug(site)" :label="site.name" :value="site.selected" @change="select(siteSlug(site))"></ui-checkbox>
    </div>
    <div class="site-selector-footer">
      <ui-button type="secondary" :color="multiSelectColor" @click="multiSelect">{{ multiSelectText }}</ui-button>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import UiButton from 'keen/UiButton';
  import UiCheckbox from 'keen/UiCheckbox';

  export default {
    props: ['sites'],
    computed: {
      allSitesSelected() {
        return _.every(this.sites, site => site.selected);
      },
      multiSelectColor() {
        return this.allSitesSelected ? 'red' : 'accent';
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
      },
      siteSlug(site) {
        return site.subsiteSlug || site.slug;
      }
    },
    components: {
      UiButton,
      UiCheckbox
    }
  };
</script>
