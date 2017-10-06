<docs>
  # select

  An enhanced browser `<select>` element, allowing the user to select one (or more!) of a few related options.

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

  * **multiple** - allow multiple options to be selected. data will be an object with options as keys, similar to checkbox-group
  * **search** - allow users to type stuff in to filter options. Extremely useful for longer options lists
  * **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)

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

  ### Shared Arguments

  This input shares certain arguments with other inputs:

  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
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
    @include type-caption();

    font-style: italic;
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
    <component v-if="hasButton" slot="icon" :is="args.attachedButton.name" :name="name" :data="data" :schema="schema" :args="args.attachedButton" @disable="disableInput" @enable="enableInput"></component>
  </ui-select>
  <span v-else class="editor-no-options">{{ label }}: No options available on current site.</span>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { filterBySite } from '../lib/utils/site-filter';
  import label from '../lib/utils/label';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import logger from '../lib/utils/log';
  import UiSelect from 'keen/UiSelect';

  const log = logger(__filename);

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
      hasButton() {
        const button = _.get(this, 'args.attachedButton');

        if (button && !_.get(window, `kiln.inputs['${button.name}']`)) {
          log.warn(`Attached button (${button.name}) for '${this.name}' not found!`, { action: 'hasButton', input: this.args });
          return false;
        } else if (button) {
          return true;
        } else {
          return false;
        }
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
        const val = option.value;

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      }
    },
    components: _.merge(window.kiln.inputs, { UiSelect }) // attached button
  };
</script>
