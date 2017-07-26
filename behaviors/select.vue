<docs>
  # select

  A standard browser `<select>` element, allowing the user to select one of a few related options.

  _Notes:_

  - no/empty option is pre-selected by default (you don't need to specify an empty option in the schema)
  - you can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)

  ```yaml
      fn: select
      options:
        - foo (site1)
        - bar (not: site1)
        - baz (site1, site2)
  ```

  ## Arguments

  * **options** _(required)_ an array of strings or objects (with `name`, `value`, and optionally `sites`)

  If you specify options as strings, the label for each will simply be the option converted to Start Case. If this behavior is run on a site with no available options, an error message will appear. Please use the `reveal` behavior to conditionally hide/show fields based on site.

  ```yaml
  field1:
    _has:
      fn: select
      options:
        - foo
        -
          name: Bar
          value: bar
        -
          name: Baz Qux
          value: baz-qux
          sites: site1, site2
  ```
</docs>

<style lang="sass">
  @import '../styleguide/inputs';
  @import '../styleguide/typography';

  .editor-select {
    @include select();
  }

  .editor-no-options {
    @include tertiary-text();
  }
</style>

<template>
  <select v-if="hasOptions" class="editor-select" :value="data" @change="update">
    <option v-for="option in options" :value="option.value">{{ option.name }}</option>
  </select>
  <span v-else class="editor-no-options">No options available on current site.</span>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { filterBySite } from '../lib/utils/site-filter';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      options() {
        const currentSlug = _.get(this.$store, 'state.site.slug');

        return [{
          value: null,
          name: 'None'
        }].concat(_.map(filterBySite(this.args.options, currentSlug), (option) => {
          if (_.isString(option)) {
            return {
              value: option,
              name: _.startCase(option)
            };
          } else {
            return {
              value: option.value,
              name: option.name
            };
          }
        }));
      },
      hasOptions() {
        return this.options.length > 1; // the first (blank) option is automatically added
      }
    },
    methods: {
      update(e) {
        const value = e.target.value;

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: value });
      }
    },
    slot: 'main'
  };
</script>
