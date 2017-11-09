<docs>
  # checkbox-group

  A group of checkboxes, allowing the user to toggle on or off related items. You can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)

  ```yaml
      input: checkbox-group
      options:
        - foo (site1)
        - bar (not: site1)
        - baz (site1, site2)
  ```

  ## Arguments

  * **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)

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

  ### Shared Arguments

  This input shares certain arguments with other inputs:

  * **help** - description / helper text for the field
  * **validate** - an object that contains pre-publish validation rules:

  * **validate.required** - either `true` or an object that described the conditions that should make this field required

  Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

  * **validate.requiredMessage** - will appear when required validation fails

  ### Conditional Required Arguments

  * **field** to compare against (inside complex-list item, current form, or current component)
  * **operator** _(optional)_ to use for the comparison
  * **value** _(optional)_ to compare the field against

  If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

  Operators:

  * `===`
  * `!==`
  * `<`
  * `>`
  * `<=`
  * `>=`
  * `typeof`
  * `regex`
  * `empty` (only checks field data, no value needed)
  * `not-empty` (only checks field data, no value needed)
  * `truthy` (only checks field data, no value needed)
  * `falsy` (only checks field data, no value needed)

  _Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

  Note: labels are pulled from the field's `_label` property.
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
