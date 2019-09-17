<docs>
  # `checkbox-group`

  A group of checkboxes, allowing the user to toggle on or off related items. You can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components). [Uses Keen's UICheckboxGroup](https://josephuspaye.github.io/Keen-UI/#/ui-checkbox-group).

  ```yaml
      input: checkbox-group
      options:
        - foo (site1)
        - bar (not: site1)
        - baz (site1, site2)
  ```

  ### Checkbox Group Arguments

  * **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)
  * **help** - description / helper text for the field
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.requiredMessage** - will appear when required validation fails

  If you specify options as strings, the label for each will simply be the option converted to Start Case. If this behavior is run on a site with no available options, an error message will appear. Please use `_reveal` on the field to conditionally hide/show it based on site.

  ```yaml
  field1:
    _has:
      input: checkbox-group
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

  ### Checkbox Group Data Format

  Checkbox group formats its value as an **object**, where each option is a key with a `true` / `false` value. For example, the data for the options above (`foo`, `bar`, `baz-qux`) might look like:

  ```js
  {
    foo: true,
    bar: false,
    'baz-qux': true
  }
  ```
</docs>

<style lang="sass">
  @import '../styleguide/typography';

  .editor-no-options {
    @include type-body();

    color: $text-disabled-color;
  }
</style>

<template>
  <div v-if="hasOptions" class="checkbox-group">
    <ui-checkbox-group
    color="accent"
    :value="checkedArray"
    :options="options"
    :name="name"
    :label="label"
    :vertical="isVertical"
    :help="args.help"
    :error="errorMessage"
    :invalid="isInvalid"
    :disabled="disabled"
    v-dynamic-events="customEvents"
    @input="update"></ui-checkbox-group>
  </div>
  <span v-else class="editor-no-options">{{ label }}: No options available on current site.</span>
</template>

<script>
  import cid from '@nymag/cid';
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { filterBySite } from '../lib/utils/site-filter';
  import label from '../lib/utils/label';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import UiCheckboxGroup from 'keen/UiCheckboxGroup';
  import { DynamicEvents } from './mixins';

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args', 'disabled'],
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
      },
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
      },
      errorMessage() {
        return getValidationError(this.data, this.args.validate, this.$store, this.name);
      },
      isInvalid() {
        return !!this.errorMessage;
      }
    },
    methods: {
      update(newCheckedItems) {
        const newData = _.reduce(this.options, (obj, option) => {
          if (_.includes(newCheckedItems, option.value)) {
            obj[option.value] = true;
          } else {
            obj[option.value] = false;
          }
  
          return obj;
        }, {});

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: newData });
      }
    },
    components: {
      UiCheckboxGroup
    }
  };
</script>
