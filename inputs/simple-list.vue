<docs>
  # simple-list

  An array of strings (or objects with a `text` property, if you add the `propertyName` argument). Useful for lists of items such as tags, keywords, or author names.

  ## Arguments

  * **propertyName** - appends double-click functionality to items in the list. The data will be an array of objects with `text` properties, as well as the value of this argument. e.g. `propertyName: bar` will make the data look like `[{ text: 'foo', bar: 'baz' }]`
  * **badge** - name of the icon (or a short string) that should be displayed in the simple list item when editing. Icon names can be anything from the [Material Design Icon Set](https://material.io/icons/), or you can use initials (it's recommended to use no more than two letters when using initials)
  * **allowRepeatedItems** - allow the same item more than once. defaults to false
  * **autocomplete** - object with autocomplete options. Currently this is just the key `list` where the value is the name of a list that Amphora knows about accessible via `/<site>/lists/<listName>`. Example:

  ```yaml
    -
      fn: simple-list
      autocomplete:
        list: authors
  ```

  ### Shared Arguments

  This input shares certain arguments with other inputs:

  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate** - an object that contains pre-publish validation rules:

  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.max** - maximum number of items that the field must not exceed

  Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

  * **validate.requiredMessage** - will appear when required validation fails
  * **validate.maxMessage** - will appear when maximum validation fails

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

  ## Usage

  * Type something and press <kbd>enter</kbd>, <kbd>tab</kbd>, or <kbd>,</kbd> (comma) to add it as an item
  * Delete items by clicking the `x` button or selecting them and pressing <kbd>backspace</kbd>
  * Select items using <kbd>→</kbd> / <kbd>←</kbd> or <kbd>tab</kbd> and <kbd>shift + tab</kbd>. You may select the last item in the list from the text input
  * Pressing <kbd>backspace</kbd> in an empty text input will select the last item in the list
  * If `propertyName` is defined, you can double-click items to set the "primary" item. This will add a badge to the primary item. Only one item may be "primary" at a time
  * Double-clikcing the "primary" item will unset it as the "primary" item

  ## Example

  ```yaml
  tags:
    _label: Tags
    _has:
      input: simple-list
      propertyName: featureRubric
      badge: FR # or, say, `star` if you want to use a material design icon
      autocomplete:
        list: tags
  ```
</docs>

<style lang="sass">
  .simple-list {
    .simple-list-items {
      align-items: center;
      display: flex;
      flex-flow: row wrap;
      height: auto;
      justify-content: flex-start;
    }

    .simple-list-items-wrapper {
      align-items: flex-start;
      display: inline-flex;
      flex: 0 0 auto;
      flex-flow: row wrap;
      justify-content: flex-start;
    }
  }
</style>

<template>
  <div class="simple-list ui-textbox has-label has-floating-label" :class="classes">
    <div class="ui-textbox__icon-wrapper" v-if="hasButton">
      <component :is="args.attachedButton.name" :name="name" :data="data" :schema="schema" :args="args.attachedButton" @disable="disableInput" @enable="enableInput"></component>
    </div>

    <div class="ui-textbox__content">
      <label class="ui-textbox__label">
        <div class="ui-textbox__label-text" :class="labelClasses">{{ label }}</div>
        <div class="simple-list-items ui-textbox__input">
          <transition-group name="list-items" tag="div" class="simple-list-items-wrapper">
            <simple-list-item v-for="(item, index) in items"
              :index="index"
              :data="item"
              key="index"
              :currentItem="currentItem"
              :propertyName="args.propertyName"
              :badge="args.badge"
              :disabled="isDisabled"
              @remove="removeItem"
              @select="selectItem"
              @dblclick.native="setPrimary(index)"></simple-list-item>
          </transition-group>
          <simple-list-input
            :items="items"
            :allowRepeatedItems="args.allowRepeatedItems"
            :autocomplete="args.autocomplete"
            :currentItem="currentItem"
            :disabled="isDisabled"
            @add="addItem"
            @select="selectItem"
            @focus="onFocus"
            @blur="onBlur"></simple-list-input>
        </div>
      </label>

      <div class="ui-textbox__feedback" v-if="hasFeedback || maxLength">
        <div class="ui-textbox__feedback-text" v-if="showError">{{ error }}</div>
        <div class="ui-textbox__feedback-text" v-else-if="showHelp">{{ args.help }}</div>
        <div class="ui-textbox__counter" v-if="maxLength">
            {{ valueLength + '/' + maxLength }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import label from '../lib/utils/label';
  import logger from '../lib/utils/log';
  import simpleListItem from './simple-list-item.vue';
  import simpleListInput from './simple-list-input.vue';

  const log = logger(__filename);

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isActive: false,
        isTouched: false,
        isDisabled: false,
        currentItem: null,
        type: 'strings'
      };
    },
    computed: {
      items() {
        if (!_.isEmpty(this.data) && _.isString(_.head(this.data))) {
          // array of strings! convert to array of objects internally, but save it back to the store as strings
          this.type = 'strings';
          return _.map(this.data, (item) => item.text);
        } else if (!_.isEmpty(this.data) && _.isObject(_.head(this.data))) {
          // array of objects!
          this.type = 'objects';
          return _.cloneDeep(this.data);
        } else if ((!this.data || _.isEmpty(this.data)) && !!this.args.propertyName) {
          // empty data, but we're using propertyName so we want an array of objects
          this.type = 'objects';
          return [];
        } else if ((!this.data || _.isEmpty(this.data)) && !this.args.propertyName) {
          // empty data, but no propertyName so we want an array of strings
          this.type = 'strings';
          return [];
        } else {
          log.error('Unknown data type!', { action: 'compute items', items: this.data });
        }
      },
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      maxLength() {
        return _.get(this.args, 'validate.max') || 0;
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
        return this.isTouched && getValidationError(this.items, this.args.validate, this.$store, this.name);
      },
      isInvalid() {
        return !!this.errorMessage;
      },
      isLabelInline() {
        return this.items.length === 0 && !this.isActive;
      },
      hasFeedback() {
        return this.args.help || this.error;
      },
      showError() {
        return this.isInvalid && this.error;
      },
      showHelp() {
        return !this.showError && this.args.help;
      },
      valueLength() {
        return this.items.length;
      },
      classes() {
        return [
          { 'ui-textbox--icon-position-right': this.hasButton },
          { 'is-active': this.isActive },
          { 'is-invalid': this.isInvalid },
          { 'is-touched': this.isTouched },
          { 'has-counter': this.maxLength },
          { 'is-disabled': this.isDisabled }
        ];
      },
      labelClasses() {
        return {
          'is-inline': this.isLabelInline,
          'is-floating': !this.isLabelInline
        };
      }
    },
    methods: {
      update(val) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      },
      onFocus() {
        this.isActive = true;
      },
      onBlur() {
        this.isActive = false;

        if (!this.isTouched) {
          this.isTouched = true;
        }
      },
      selectItem(index) {
        if (_.isNull(index) || index < 0 || index >= this.data.length) {
          this.currentItem = null; // out of range, select input
        } else {
          if (!this.data.length) {
            this.currentItem = null; // no items, select input
          } else {
            this.currentItem = index;
          }
        }
      },
      removeItem(index) {
        this.items.splice(index, 1);
        this.update(this.items);

        if (this.items.length) { // you always select before deleting
          this.selectItem(this.currentItem - 1);
        } else {
          this.currentitem = null;
        }
      },
      addItem(newItem) {
        this.items.push(newItem);
        this.update(this.items);
      },
      setPrimary(index) {
        const property = this.args.propertyName;

        if (property) {
          this.items = _.map(this.items, (item, i) => {
            if (i === index) {
              item[property] = true;
            } else {
              item[property] = false;
            }
          });
          this.update(this.items);
        }
      }
    },
    components: _.merge(window.kiln.inputs, { simpleListItem, simpleListInput }) // attached button
  };
</script>
