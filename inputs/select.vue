<docs>
  # `select`

  An enhanced browser `<select>` element, allowing the user to select one (or more!) of a few related options. [Uses Keen's UISelect](https://josephuspaye.github.io/Keen-UI/#/ui-select).

  ### Select Arguments

  * **multiple** - allow multiple options to be selected. data will be an object with options as keys, similar to checkbox-group
  * **search** - allow users to type stuff in to filter options. Extremely useful for longer options lists
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
        if (_.isString(this.data)) {
          return _.find(this.options, (option) => option.value === this.data);
        } else if (_.isObject(this.data)) {
          return _.reduce(this.options, (safeArray, option) => {
            if (this.data[option.value] === true) {
              return safeArray.concat([option]);
            } else {
              return safeArray;
            }
          }, []);
        } else {
          return this.args.multiple ? [] : { value: null, label: 'None' };
        }
      },
      options() {
        const currentSlug = _.get(this.$store, 'state.site.slug');

        return [{
          value: null,
          label: 'None'
        }].concat(_.map(filterBySite(this.args.options, currentSlug), (option) => {
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
        }));
      },
      hasOptions() {
        return this.options.length > 1; // the first (blank) option is automatically added
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
          // new array of checked options
          const newData = _.reduce(_.cloneDeep(this.data), (obj, val, key) => {
            if (_.find(option, (item) => item.value === key)) {
              return _.assign(obj, { [key]: true });
            } else {
              return _.assign(obj, { [key]: false });
            }
          }, {});

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
