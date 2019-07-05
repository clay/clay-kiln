<docs>
  # `radio`

  A group of radio buttons, allowing the user to select one of a few related options. You can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components). [Uses Keen's UIRadioGroup](https://josephuspaye.github.io/Keen-UI/#/ui-radio-group).

  ```yaml
      input: radio
      options:
        - foo (site1)
        - bar (not: site1)
        - baz (site1, site2)
  ```

  ### Radio Arguments

  * **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)
  * **help** - description / helper text for the field
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.requiredMessage** - will appear when required validation fails

  If you specify options as strings, the label for each will simply be the option converted to Start Case. If this behavior is run on a site with no available options, an error message will appear. Please use `_reveal` on the field to conditionally hide/show it based on site.

  ```yaml
  field1:
    _has:
      input: radio
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

  ### Radio Data Format

  Radio will return a **string** with the `value` of the selected `option`.
</docs>

<style lang="sass">
  @import '../styleguide/typography';

  .editor-no-options {
    @include type-body();

    color: $text-disabled-color;
  }
</style>

<template>
  <div v-if="hasOptions" class="editor-radios">
    <ui-radio-group
    color="accent"
    :name="name"
    :value="data || ''"
    :label="label"
    :options="options"
    :vertical="isVertical"
    :help="args.help"
    :error="errorMessage"
    :invalid="isInvalid"
    @input="update"
    v-dynamic-events="customEvents"></ui-radio-group>
  </div>
  <span v-else class="editor-no-options">{{ label }}: No options available on current site.</span>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { filterBySite } from '../lib/utils/site-filter';
  import label from '../lib/utils/label';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import UiRadioGroup from 'keen/UiRadioGroup';
  import { DynamicEvents } from './mixins';

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isVertical: true // todo: allow setting this in the args
      };
    },
    computed: {
      options() {
        const currentSlug = _.get(this.$store, 'state.site.slug'),
          data = this.data;

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
      update(val) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      }
    },
    components: {
      UiRadioGroup
    }
  };
</script>
