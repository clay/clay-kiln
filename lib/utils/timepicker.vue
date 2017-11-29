<template>
  <ui-textbox
    type="time"
    placeholder="12:00 AM"
    v-model="timeValue"
    :invalid="isInvalid"
    :required="isRequired"
    :label="label"
    :help="help"
    :error="errorMessage"
    :disabled="isDisabled"
    iconPosition="right"
    @input="update">
    <component v-if="hasButton" slot="icon" :is="args.attachedButton.name" :name="name" :data="value" :schema="schema" :args="args.attachedButton" @disable="disableInput" @enable="enableInput"></component>
  </ui-textbox>
</template>

<script>
  import _ from 'lodash';
  import dateFormat from 'date-fns/format';
  import { parseDate as parseNaturalDate } from 'chrono-node';
  import { shouldBeRequired, getValidationError } from '../forms/field-helpers';
  import logger from './log';
  import UiTextbox from 'keen/UiTextbox';

  const log = logger(__filename);

  export default {
    props: ['value', 'label', 'help', 'name', 'schema', 'args'],
    data() {
      return {
        isDisabled: false,
        timeValue: ''
      };
    },
    computed: {
      isRequired() {
        return _.get(this, 'args.validate') ? _.get(this, 'args.validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name) : false;
      },
      hasButton() {
        const button = _.get(this, 'args.attachedButton');

        if (this.name && button && !_.get(window, `kiln.inputs['${button.name}']`)) {
          log.warn(`Attached button (${button.name}) for '${this.name}' not found!`, { action: 'hasButton', input: this.args });
          return false;
        } else if (button) {
          return true;
        } else {
          return false;
        }
      },
      errorMessage() {
        if (_.get(this, 'args.validate')) {
          const validationError = getValidationError(this.timeValue, this.args.validate, this.$store, this.name),
            parsed = parseNaturalDate(this.timeValue);

          if (validationError) {
            return validationError;
          } else if (!parsed) {
            return `${this.help} (Please enter a valid time)`;
          }
        }
      },
      isInvalid() {
        return !!this.errorMessage;
      }
    },
    mounted() {
      this.timeValue = !!this.value && _.isString(this.value) ? dateFormat(this.value, 'h:mm A') : '';
    },
    methods: {
      // every time the value of the input changes, update the store
      update(val) {
        const parsed = parseNaturalDate(val);

        if (parsed) {
          this.$emit('update', dateFormat(parsed, 'HH:mm'));
        }
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      }
    },
    components: _.assign({}, window.kiln.inputs, { UiTextbox }) // attached button
  };
</script>
