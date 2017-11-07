<docs>
  # timepicker

  A basic time picker. Uses native time inputs when available, but falls back to relatively-simple natural language parsing.

  ### Natural Language Parsing?

  On browsers without native time pickers, users may enter in the time without worrying about the format. The simple NLP engine can handle things like "10am", "4:15 PM", "13:00", and even "midnight".

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

<template>
  <ui-textbox
    type="time"
    placeholder="12:00 AM"
    v-model="timeValue"
    :invalid="isInvalid"
    :required="isRequired"
    :label="label"
    :help="timeHelp"
    :error="errorMessage"
    :disabled="isDisabled"
    iconPosition="right"
    @input="update">
    <component v-if="hasButton" slot="icon" :is="args.attachedButton.name" :name="name" :data="data" :schema="schema" :args="args.attachedButton" @disable="disableInput" @enable="enableInput"></component>
  </ui-textbox>
</template>

<script>
  import _ from 'lodash';
  import dateFormat from 'date-fns/format';
  import { parseDate as parseNaturalDate } from 'chrono-node';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import label from '../lib/utils/label';
  import logger from '../lib/utils/log';
  import UiTextbox from 'keen/UiTextbox';

  const log = logger(__filename);

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isDisabled: false,
        timeValue: ''
      };
    },
    computed: {
      timeHelp() {
        const parsed = parseNaturalDate(this.timeValue);

        if (parsed) {
          return `${this.args.help} (Parsed as ${dateFormat(parsed, 'h:mm A')})`;
        } else {
          return this.args.help;
        }
      },
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
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
      errorMessage() {
        const validationError = getValidationError(this.timeValue, this.args.validate, this.$store, this.name),
          parsed = parseNaturalDate(this.timeValue);

        if (validationError) {
          return validationError;
        } else if (!parsed) {
          return `${this.args.help} (Please enter a valid time)`;
        }
      },
      isInvalid() {
        return !!this.errorMessage;
      }
    },
    mounted() {
      this.timeValue = _.isString(this.data) ? dateFormat(this.data, 'h:mm A') : '';
    },
    methods: {
      // every time the value of the input changes, update the store
      update(val) {
        const parsed = parseNaturalDate(val);

        if (parsed) {
          this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: dateFormat(parsed, 'HH:mm') });
        }
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      }
    },
    components: _.merge(window.kiln.inputs, { UiTextbox }) // attached button
  };
</script>
