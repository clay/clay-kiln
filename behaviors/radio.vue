<docs>
  # radio

  A group of radio buttons, allowing the user to select one of a few related options. You can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)

  ```yaml
      fn: radio
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
      fn: radio
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
  @import '../styleguide/typography';

  .editor-no-options {
    @include tertiary-text();
  }
</style>

<template>
  <div v-if="hasOptions" class="editor-radios">
    <ui-radio-group :name="name" :value="data" :options="options" :vertical="isVertical" @input="update"></ui-radio-group>
  </div>
  <span v-else class="editor-no-options">No options available on current site.</span>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { filterBySite } from '../lib/utils/site-filter';
  import UiRadioGroup from 'keen/UiRadioGroup';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isVertical: true // todo: allow setting this in the args
      };
    },
    computed: {
      options() {
        const currentSlug = _.get(this.$store, 'state.site.slug'),
          data = this.data;;

        return _.map(filterBySite(this.args.options, currentSlug), (option) => {
          if (_.isString(option)) {
            return {
              value: option,
              label: _.startCase(option),
              checked: option === data
            };
          } else {
            return {
              value: option.value,
              label: option.name,
              checked: option.value === data
            };
          }
        });
      },
      hasOptions() {
        return this.options.length;
      }
    },
    methods: {
      update(val) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      }
    },
    components: {
      UiRadioGroup
    },
    slot: 'main'
  };
</script>
