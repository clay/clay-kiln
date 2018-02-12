<docs>
  # `select`

  An enhanced browser `<select>` element, allowing the user to select one (or more!) of a few related options. [Uses Keen's UISelect](https://josephuspaye.github.io/Keen-UI/#/ui-select).

  ### Select Arguments

  * **multiple** - allow multiple options to be selected. data will be an object with options as keys, similar to checkbox-group
  * **search** - allow users to type stuff in to filter options. Extremely useful for longer options lists
  * **excludeDefaultOption** - allow users to exclude the default option `None`, defaults to `false`.
  * **defaultOptionLabel** - allow users to rename the default option's label.
  * **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)
  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.requiredMessage** - will appear when required validation fails

  If you specify options as strings, the label for each will simply be the option converted to Start Case. If this behavior is run on a site with no available options, an error message will appear. Please use `_reveal` on the field to conditionally hide/show it based on site.

  ```yaml
  field1:
    _has:
      input: select
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

  > #### info::Usage Notes
  >
  > * no/empty option is pre-selected by default (you don't need to specify an empty option in the schema)
  > * you can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)
  >
  > ```yaml
  >     fn: select
  >     options:
  >       - foo (site1)
  >       - bar (not: site1)
  >       - baz (site1, site2)
  > ```
</docs>

<style lang="sass">
  @import '../styleguide/typography';

  .editor-no-options {
    @include type-body();

    color: $text-disabled-color;
  }
</style>

<template>
  <ui-select
    v-if="hasOptions"
    :name="name"
    :value="safeData"
    :options="options"
    :multiple="args.multiple"
    :hasSearch="args.search"
    :label="label"
    :floatingLabel="true"
    :help="args.help"
    :error="errorMessage"
    :invalid="isInvalid"
    iconPosition="right"
    @input="update">
    <attached-button slot="icon" :name="name" :data="data" :schema="schema" :args="args" @disable="disableInput" @enable="enableInput"></attached-button>
  </ui-select>
  <span v-else class="editor-no-options">{{ label }}: No options available on current site.</span>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { filterBySite } from '../lib/utils/site-filter';
  import label from '../lib/utils/label';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import UiSelect from 'keen/UiSelect';
  import attachedButton from './attached-button.vue';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isDisabled: false
      };
    },
    computed: {
      safeData() {
        const defaultValue = this.args.multiple ? [] : this.defaultOption;

        if (_.isString(this.data)) {
          return _.find(this.options, (option) => option.value === this.data) || defaultValue;
        } else if (_.isObject(this.data) && !_.isEmpty(this.data)) {
          return _.reduce(this.options, (safeArray, option) => {
            return this.data[option.value] === true ? [...safeArray, option] : safeArray;
          }, []);
        } else {
          return defaultValue;
        }
      },
      defaultOption() {
        return {
          value: null,
          label: this.args.defaultOptionLabel || 'None'
        };
      },
      options() {
        const {options: schemaOptions = [], excludeDefaultOption} = this.args,
          currentSlug = _.get(this.$store, 'state.site.slug'),
          options = _.map(filterBySite(schemaOptions, currentSlug), (option) => {
            if (_.isString(option)) {
              return {
                value: option,
                label: _.startCase(option)
              };
            } else {
              return {
                value: option.value,
                label: option.name
              };
            }
          });

        return excludeDefaultOption && !_.isEmpty(options) ? options : [this.defaultOption, ...options];
      },
      hasOptions() {
        return this.options.length > 0;
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
      update(option) {
        if (_.isArray(option)) {
          // set all existing options in data to false
          const newData = _.mapValues(_.cloneDeep(this.data), () => false);

          // for each of the selected options, set the related key in the data to true
          _.forEach(option, (o) => newData[o.value] = true);

          this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: newData });
        } else if (_.isObject(option)) {
          // single new checked option
          this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: option.value });
        }
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      }
    },
    components: {
      UiSelect,
      attachedButton
    }
  };
</script>
