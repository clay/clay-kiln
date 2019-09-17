<docs>
  # `segmented-button`

  A group of buttons allowing the user to select one (or more!) of a few related options.

  ### Segmented Button Arguments

  * **multiple** - allow multiple things to be selected. `false` by default
  * **options** - an array of options
  * **help** - description / helper text for the field
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.requiredMessage** - will appear when required validation fails

  Each option should be an object with `icon`, `text`, and `value` properties. Icons will be displayed in the buttons, and text will be used for tooltips.

  ### Segmented Button Data Formats

  By default (when `multiple` is false or unset), this will return data as a **string** with the value of the selected option. If `multiple` is `true`, this will return an **object** where each option is a key with a `true` / `false` value. Note that the single-select mode is the same format as a `radio` input, and the multi-select mode is the same as a `checkbox-group`.
</docs>

<template>
  <div class="segmented-button has-label has-floating-label" :class="{ 'is-invalid': this.isInvalid }">
    <span class="ui-textbox__label">
      <div class="ui-textbox__label-text is-floating">{{ label }}</div>
      <div class="button-toggle" :class="{ 'is-selected': isSelected }">
        <segmented-button-segment
          v-for="(option, optionIndex) in options"
          :key="optionIndex"
          :name="name"
          :option="option"
          :disabled="disabled"
          @update="update"
          v-dynamic-events="customEvents"></segmented-button-segment>
      </div>
    </span>

    <div class="ui-textbox__feedback" v-if="hasFeedback">
      <div class="ui-textbox__feedback-text" v-if="showError">{{ error }}</div>
      <div class="ui-textbox__feedback-text" v-else-if="showHelp">{{ args.help }}</div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import cid from '@nymag/cid';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import label from '../lib/utils/label';
  import SegmentedButtonSegment from './segmented-button-segment.vue';
  import { DynamicEvents } from './mixins';

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args', 'disabled'],
    data() {
      return {};
    },
    computed: {
      multiple() {
        return this.args.multiple || false;
      },
      options() {
        const data = this.data,
          assetLocation = _.get(this.$store, 'state.site.assetHost') || _.get(this.$store, 'state.site.assetPath');

        console.log('options', this.args.options);

        return _.map(this.args.options, (option) => {
          const hasImgIcon = option.icon && _.head(option.icon) === '/',
            hasMaterialIcon = option.icon && _.head(option.icon) !== '/';

          return {
            id: cid(),
            value: option.value,
            hasMaterialIcon,
            hasImgIcon,
            icon: hasImgIcon ? `${assetLocation}${option.icon}` : option.icon,
            text: option.text || option.value.split('-').map(_.startCase).join(' '),
            checked: this.multiple ? data && data[option.value] === true : data === option.value
          };
        });
      },
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
      },
      error() {
        return getValidationError(this.data || '', this.args.validate, this.$store, this.name);
      },
      isInvalid() {
        return !!this.error;
      },
      isSelected() {
        return !!this.data && !_.isEmpty(this.data);
      },
      hasFeedback() {
        return this.args.help || this.error;
      },
      showError() {
        return this.isInvalid && this.error;
      },
      showHelp() {
        return !this.showError && this.args.help;
      }
    },
    methods: {
      update(val) {
        let newData;

        if (this.multiple) {
          newData = this.data ? _.cloneDeep(this.data) : {}; // this.data might be null if we're setting it for the first time
          newData[val] = !newData[val];
        } else if (this.data === val) {
          newData = null; // unselect
        } else {
          newData = val;
        }

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: newData });
      }
    },
    components: {
      SegmentedButtonSegment
    }
  };
</script>

<style lang="sass">
  @import '../styleguide/mixins';
  @import '../styleguide/typography';
  @import '../styleguide/colors';
  @import '../styleguide/animations';

  .segmented-button {
    align-items: flex-start;
    display: flex;
    flex-flow: row wrap;
    font-family: $font-stack;
    margin-bottom: 16px;

    .ui-textbox__label {
      @include clearfix();

      width: 100%;
    }

    .button-toggle {
      background-color: $card-bg-color;
      border-radius: 2px;
      cursor: pointer;
      display: flex;
      flex-flow: row nowrap;
      float: left;
      margin: 10px 0;
      transition: $standard-time $toggle-curve;
      will-change: background, box-shadow;

      &.is-selected {
        // raise toggle buttons when one is selected
        box-shadow: 0 1px 5px rgba(0, 0, 0, .2), 0 2px 2px rgba(0, 0, 0, .14), 0 3px 1px -2px rgba(0, 0, 0, .12);
      }
    }

    &.has-floating-label {
      .ui-textbox__label-text {
        display: table;
      }
    }

    &.is-invalid {
      .ui-textbox__label-text {
        color: $md-red;
      }

      .ui-textbox__feedback {
        color: $md-red;
      }
    }
  }
</style>
