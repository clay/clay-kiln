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

  If you specify options as strings, the label for each will simply be the option converted to Start Case.

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
  @import '../styleguide/inputs';
  @import '../styleguide/typography';

  .checkbox-group .checkbox-group-item {
    align-items: center;
    display: flex;
    margin: 0 0 10px;
    padding: 0;
    width: 100%;
  }

  .checkbox-group .checkbox-group-item:first-of-type {
    margin-top: 15px;
  }

  .checkbox-group input {
    @include checkbox();
  }

  .checkbox-group label {
    @include primary-text();

    cursor: pointer;
    flex: 1 0 auto;
    padding-left: 5px;
    vertical-align: baseline;
  }
</style>

<template>
  <div class="checkbox-group">
    <div class="checkbox-group-item" v-for="option in options">
      <input :name="option.name" type="checkbox" :id="option.id" :checked="data && data[option.value]" :value="option.value" @change="update" />
      <label :for="option.id">{{ option.name }}</label>
    </div>
  </div>
</template>

<script>
  import cid from '@nymag/cid';
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

        return _.map(filterBySite(this.args.options, currentSlug), (option) => {
          if (_.isString(option)) {
            return {
              value: option,
              name: _.startCase(option),
              id: cid()
            };
          } else {
            return {
              value: option.value,
              name: option.name,
              id: cid()
            };
          }
        });
      }
    },
    methods: {
      update(e) {
        const key = e.target.value,
          newData = { [key]: this.data ? !this.data[key] : true }; // toggle the check

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: _.assign({}, this.data, newData) });
      }
    },
    slot: 'main'
  };
</script>
