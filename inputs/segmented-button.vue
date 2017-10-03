<docs>
  # segmented-button

  A group of buttons allowing the user to select one of a few related options.

  ## Arguments

  * **options** - an array of options

  Each option should be an object with `icon`, `text`, and `value` properties. Icons will be displayed in the buttons, and text will be used for tooltips.

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
  @import '../styleguide/mixins';
  @import '../styleguide/typography';
  @import '../styleguide/colors';

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

    .segmented-button-input {
      align-items: flex-start;
      border: 1px solid $divider-color;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      flex-flow: row nowrap;
      float: left;
      margin: 10px 0;
    }

    .segmented-button-segment + .segmented-button-segment {
      border-left: 1px solid $divider-color;
    }

    &:hover:not(.is-disabled) {
      .ui-textbox__label-text {
        color: rgba(black, 0.75);
      }

      .segmented-button-input {
        border-color: rgba(black, .3);
      }

      .segmented-button-segment + .segmented-button-segment {
        border-color: rgba(black, .3);
      }
    }

    &.is-active:not(.is-disabled) {
      .segmented-button-input {
        border-color: $brand-primary-color;
        border-width: 2px;
        box-shadow: $popover-shadow;
      }

      .segmented-button-segment + .segmented-button-segment {
        border-color: $brand-primary-color;
        border-width: 2px;
      }

      .ui-textbox__label-text,
      .ui-icon {
        color: $brand-primary-color;
      }
    }

    &.has-floating-label {
      .ui-textbox__label-text {
        display: table;
      }
    }

    &.is-invalid:not(.is-disabled) {
      .ui-textbox__label-text,
      .ui-icon {
        color: $md-red;
      }

      .segmented-button-input {
        border-color: $md-red;
      }

      .segmented-button-segment + .segmented-button-segment {
        border-color: $md-red;
      }

      .ui-textbox__feedback {
        color: $md-red;
      }
    }

    &.is-disabled {
      .segmented-button-input {
        border-style: dotted;
        border-width: 2px;
        color: $text-disabled-color;
        cursor: default;
      }

      .segmented-button-segment + .segmented-button-segment {
        border-style: dotted;
        border-width: 2px;
      }

      .ui-icon {
        opacity: .6;
      }

      .ui-textbox__feedback {
        opacity: .8;
      }
    }
  }
</style>

<template>
  <div class="segmented-button has-label has-floating-label" :class="classes">
    <span class="ui-textbox__label">
      <div class="ui-textbox__label-text is-floating">{{ label }}</div>
      <div class="segmented-button-input">
        <segmented-button-segment v-for="option in options" :name="name" :option="option" :update="update"></segmented-button-segment>
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

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isActive: false,
        isTouched: false,
        isDisabled: false
      };
    },
    computed: {
      options() {
        const data = this.data,
          assetPath = _.get(this.$store, 'state.site.assetPath');

        return _.map(this.args.options, (option) => {
          const hasImgIcon = option.icon && _.head(option.icon) === '/',
            hasMaterialIcon = option.icon && _.head(option.icon) !== '/';

          return {
            id: cid(),
            value: option.value,
            hasMaterialIcon,
            hasImgIcon,
            icon: hasImgIcon ? `${assetPath}${option.icon}` : option.icon,
            text: option.text || option.value.split('-').map(_.startCase).join(' '),
            checked: option.value === data
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
      classes() {
        return [
          { 'is-active': this.isActive },
          { 'is-invalid': this.isInvalid },
          { 'is-touched': this.isTouched },
          { 'is-disabled': this.isDisabled }
        ];
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
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      }
    },
    components: {
      SegmentedButtonSegment
    }
  };
</script>
