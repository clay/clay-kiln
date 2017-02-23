<docs>
  # text

  A one-line text input.

  ## Arguments

  * **type** _(optional)_ defaults to `text` if not defined
  * **required** _(optional)_ set input required (blocking)
  * **pattern** _(optional)_ required input pattern (blocking)
  * **minLength** _(optional)_ minimum number of characters required (blocking)
  * **maxLength** _(optional)_ maximum number of characters allowed (blocking)
  * **placeholder** _(optional)_ placeholder that will display in the input
  * **autocomplete** _(optional)_ enable/disable autocomplete on field (defaults to true)
  * **step** _(optional)_ define step increments (for number type)
  * **min** _(optional)_ define a minimum value (for number, date-related, and time-related types)
  * **max** _(optional)_ define a maximum value (for number, date-related, and time-related  type)
  * **autocapitalize** _(optional)_ enable/disable auto-capitalize on field (defaults to true). if set to "words" it will capitalize the first letter of each word

  _Note:_ All of the arguments marked `(blocking)` will block saving if the input is invalid.

  _Note:_ On recent mobile browsers, certain input types will have auto-capitalize disabled, e.g. emails.
</docs>

<style lang="sass">
  @import '../styleguide/inputs';

  .input-text {
    @include input();
  }
</style>

<template>
  <input
    class="input-text"
    :type="args.type || 'text'"
    :value="data"
    @input="update"
    :step="args.step"
    :min="supportsMinMax && args.min"
    :max="supportsMinMax && args.max"
    :autocomplete="args.autocomplete ? 'on' : 'off'"
    :autocapitalize="shouldCapitalize"
    :required="args.required"
    :pattern="args.pattern"
    :minLength="args.minLength"
    :maxLength="args.maxLength"
    :placeholder="args.placeholder"
  />
</template>

<script>
  import _ from 'lodash';
  import moment from 'moment';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { hasNativePicker, init as initPicker } from '../lib/utils/datepicker';
  import { setCaret, isFirstField } from '../lib/forms/field-helpers';

  const invalidTypes = [
      'button', // use other behaviors, e.g. segmented-button
      'checkbox', // use checkbox or checkbox-group behaviors
      'file', // use custom file uploading behaviors
      'hidden', // use specific hidden behaviors, e.g. component-ref
      'image', // unsupported
      'radio', // use segmented-button, radio, etc behaviors
      'reset', // unsupported form-level input
      'search', // unsupported, not needed for input
      'submit' // unsupported form-level input (i.e. we already have submit buttons)
    ],
    typesSupportingMinMax = [ // from https://www.w3.org/TR/html-markup/input.html
      'datetime',
      'datetime-local',
      'date',
      'month',
      'time',
      'week',
      'number',
      'range'
    ],
    dateTypes = [
      'datetime-local',
      'date',
      'time'
    ],
    firefoxDateFormat = 'YYYY-MM-DD hh:mm A',
    defaultDateFormat = 'YYYY-MM-DDThh:mm';

    /**
   * create a new date string in a given format. If no
   * value is passed in returns an empty string
   * @param  {string} value   A date string in a format supported by Moment
   * @param  {string} format  The format of the returned date string
   * @return {string}
   */
  function newMomentWithFormat(value, format) {
    // If value then instantiate with the value in proper format
    return value ? moment(value).format(format) : '';
  }

  function initDatePicker($el) {
    if (!hasNativePicker()) {
      // when instantiating, convert from the ISO format (what we save) to firefox's format (what the datepicker needs)
      $el.value = newMomentWithFormat($el.value, firefoxDateFormat);
      initPicker($el);
    } else {
      // Get proper value at instantiation
      $el.value = newMomentWithFormat($el.value, defaultDateFormat);
    }
  }

  function isDate(type) {
    return _.includes(dateTypes, type);
  }

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      // add min/max only if it exists and we're dealing with an input type that supports it
      supportsMinMax() {
        return _.includes(typesSupportingMinMax, this.args.type);
      },
      shouldCapitalize() {
        const cap = this.args.autocapitalize;

        // set this to the string of "autocapitalize",
        // or fall back to "on" / "off" if it's a boolean
        if (_.isString(cap)) {
          return cap;
        } else if (!!cap) {
          return 'on';
        } else {
          return 'off';
        }
      }
    },
    methods: {
      // every time the value of the input changes, update the store
      update(e) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: e.target.value });
      }
    },
    created() {
      if (_.includes(invalidTypes, this.args.type)) {
        throw new Error('Input type is invalid: ' + this.args.type);
      }
    },
    mounted() {
      if (isDate(this.args.type)) {
        // initialize datepicker if necessary
        initDatePicker(this.$el, this.$store, this.name);
      } else if (isFirstField(this.$el)) {
        const offset = _.get(this, '$store.state.ui.currentForm.initialOffset');

        this.$nextTick(() => {
          setCaret(this.$el, offset, this.data);
        });
      }
    },
    slot: 'main'
  };
</script>
