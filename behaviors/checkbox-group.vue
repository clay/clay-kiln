<docs>
  # checkbox-group

  A group of checkboxes, allowing the user to toggle on or off related items. You can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)

  ```yaml
      fn: checkbox-group
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
      fn: checkbox-group
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
  <div v-if="hasOptions" class="checkbox-group">
    <ui-checkbox-group :value="checkedArray" :options="options" :vertical="isVertical" @input="update"></ui-checkbox-group>
  </div>
  <span v-else class="editor-no-options">No options available on current site.</span>
</template>

<script>
  import cid from '@nymag/cid';
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { filterBySite } from '../lib/utils/site-filter';
  import UiCheckboxGroup from 'keen-ui/src/UiCheckboxGroup.vue';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isVertical: true
      };
    },
    computed: {
      checkedArray() {
        return _.reduce(this.data, (result, val, key) => {
          if (val) {
            return result.concat(key);
          } else {
            return result;
          }
        }, []);
      },
      options() {
        const currentSlug = _.get(this.$store, 'state.site.slug');

        return _.map(filterBySite(this.args.options, currentSlug), (option) => {
          if (_.isString(option)) {
            return {
              value: option,
              name: _.startCase(option),
              label: _.startCase(option),
              id: cid()
            };
          } else {
            return {
              value: option.value,
              name: option.name,
              label: option.name,
              id: cid()
            };
          }
        });
      },
      hasOptions() {
        return this.options.length;
      }
    },
    methods: {
      update(newCheckedItems) {
        const newData = _.reduce(_.cloneDeep(this.data), (obj, val, key) => {
          if (_.includes(newCheckedItems, key)) {
            return _.assign(obj, { [key]: true });
          } else {
            return _.assign(obj, { [key]: false });
          }
        }, {});

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: newData });
      }
    },
    components: {
      UiCheckboxGroup
    },
    slot: 'main'
  };
</script>
