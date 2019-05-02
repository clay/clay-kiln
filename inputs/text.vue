<docs>
  # `text`

  A basic text input. Can be single line or multi-line. Uses the float label pattern. [Uses Keen's UITextbox](https://josephuspaye.github.io/Keen-UI/#/ui-textbox).

  ### Text Arguments

  * **type** - input type, which can match any native `<input type="">` or can be set to `multi-line` for a multi-line text area
  * **rows** - number of lines the textarea should have. to be used with `multi-line`
  * **step** - define step increments (for numberical inputs only)
  * **enforceMaxlength** - prevent user from typing more characters than the maximum allowed (`from validate.max`)
  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.min** - minimum number (for `type=numer`) or length (for other types) that the field must meet
  * **validate.max** - maximum number (for `type=number`) or length (for other types) that the field must not exceed
  * **validate.pattern** - regex pattern
  * **validate.requiredMessage** - will appear when required validation fails
  * **validate.minMessage** - will appear when minimum validation fails
  * **validate.maxMessage** - will appear when maximum validation fails
  * **validate.patternMessage** - will appear when pattern validation fails (very handy to set, as the default message is vague)

  ### Text Data Formats

  Most text inputs format data as a **string** of plaintext. If `type` is set to `number`, data will be a **number**.
</docs>

<template>
  <ui-textbox
    :key="myKey"
    :autosize="false"
    :value="value"
    :type="type"
    :multiLine="isMultiline"
    :rows="numOfRows"
    :invalid="isInvalid"
    :required="isRequired"
    :min="min"
    :max="max"
    :step="step"
    :maxlength="maxLength"
    :enforceMaxlength="args.enforceMaxlength"
    :label="label"
    :floatingLabel="true"
    :help="args.help"
    :error="errorMessage"
    :disabled="isDisabled"
    iconPosition="right"
    v-dynamic-events="customEvents"
    @input="update"
    @keydown-enter="closeFormOnEnter">
    <attached-button slot="icon" :name="name" :data="data" :schema="schema" :args="args" @disable="disableInput" @enable="enableInput" v-dynamic-events="customEvents"></attached-button>
  </ui-textbox>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { setCaret, shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import label from '../lib/utils/label';
  import UiTextbox from 'keen/UiTextbox';
  import attachedButton from './attached-button.vue';
  import logger from '../lib/utils/log';
  import { DynamicEvents } from './mixins';

  const validInputTypes = ['text', 'search', 'url', 'tel', 'password', 'multi-line'],
    log = logger(__filename);

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args', 'initialFocus'],
    data() {
      return {
        isDisabled: false,
        myKey: ''
      };
    },
    computed: {
      type() {
        return  this.args.type === 'multi-line' || !this.args.type ?
          'text' : this.args.type;
      },
      isMultiline() {
        return this.args.type === 'multi-line';
      },
      isNumerical() {
        return _.includes(['number', 'range'], this.args.type);
      },
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      min() {
        return this.isNumerical ? _.get(this.args, 'validate.min') : 0;
      },
      max() {
        return this.isNumerical ? _.get(this.args, 'validate.max') : 0;
      },
      step() {
        return this.args.step ? this.args.step.toString() : 'any';
      },
      maxLength() {
        return !this.isNumerical ? _.get(this.args, 'validate.max') : 0;
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
      },
      errorMessage() {
        const validationData = this.isNumerical && _.isNumber(this.data) ?
          parseFloat(this.data) : this.data;

        return getValidationError(validationData, this.args.validate, this.$store, this.name);
      },
      isInvalid() {
        return !!this.errorMessage;
      },
      numOfRows() {
        return _.get(this, 'args.rows', 2);
      },
      value() {
        return this.data === null || typeof this.data === 'undefined' ? '' : String(this.data);
      }
    },
    methods: {
      // every time the value of the input changes, update the store
      update(val) {

        if (this.isNumerical) {
          const n = parseFloat(val);

          val = Number.isNaN(n) ? '' : n;
        } else if (_.isString(val)) {
          // remove 'line separator' and 'paragraph separator' characters from text inputs
          // (not visible in text editors, but get added when pasting from pdfs and old systems)
          val = val.replace(/(\u2028|\u2029)/g, '');
        }

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      },
      closeFormOnEnter(e) {
        if (!this.isMultiline || e.metaKey || e.ctrlKey) {
          // close form when hitting enter in text fields
          this.$store.dispatch('unfocus');
        }
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      }
    },
    mounted() {
      if (this.initialFocus === this.name) {

        this.$nextTick(() => {

          // validate input type
          if (!validInputTypes.includes(this.type)) {
            log.error(`Input must be on of type: ${validInputTypes.toString()}.
            Received: ${this.type}`);
            return;
          }
          setCaret(this.$el, _.get(this, '$store.state.ui.currentForm.initialOffset'), this.data);
        });
      }
    },
    components: {
      UiTextbox,
      attachedButton
    }
  };
</script>
