<docs>
  # site-specific-select

  A standard browser `<select>` element, allowing the user to select one of a few related options. Options are delineated by site, using the site slug.

  ## Arguments

  * **sites** _(required)_ an array of site options
  * **default** _(optional)_ an array of default options

  Each site should have a `slug` to match and an `options` array. Similar to the [select behavior](https://github.com/nymag/clay-kiln/blob/master/behaviors/select.md), options are an array of strings. The label for each option will simply be the option converted to Start Case.

  ```yaml
  field1:
    _has:
      fn: site-specific-select
      sites:
        -
          slug: site1
          options:
            - foo # looks like Foo
            - bar # looks like Bar
            - baz # looks like Baz
        -
          slug: site2
          options:
            - quz
            - quuz
  ```

  You may also specify `default` options that will be used if no site slug matches.

  ```yaml
  field1:
    _has:
      fn: site-specific-select
      sites:
        -
          slug: site1
          options:
            - foo # looks like Foo
            - bar # looks like Bar
            - baz # looks like Baz
      default:
        - quz
        - quuz
  ```
</docs>

<template>
  <div class="site-specific-select">
    <input-select v-if="currentSite" :name="name" :data="data" :schema="schema" :args="currentSite"></input-select>
    <input-select v-else :name="name" :data="data" :schema="schema" :args="{ options: defaultSite }"></input-select>
  </div>
</template>

<script>
  import _ from 'lodash';
  import select from './select.vue';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      currentSite() {
        const currentSlug = this.$store.state.site.slug;

        return _.find(this.args.sites, (site) => site.slug === currentSlug);
      },
      defaultSite() {
        return this.args.default;
      }
    },
    components: {
      'input-select': select
    },
    mounted() {
      console.warn('site-specific-select is deprecated and will be removed in the next major release! (as of kiln v3.5.0, the select behavior allows site-specific options)');
      // if no sites match and there are no default options, that's a programmer error
      if (!this.currentSite && !this.defaultSite) {
        throw new Error('No options specified for current site!');
      }
    },
    slot: 'main'
  };
</script>
