<docs>
  # `simple-list`

  An array of strings (or objects with a `text` property, if you add the `propertyName` argument). Useful for lists of items such as tags, keywords, or author names.

  ### Simple List Arguments

  * **propertyName** - appends double-click functionality to items in the list. The data will be an array of objects with `text` properties, as well as the value of this argument. e.g. `propertyName: bar` will make the data look like `[{ text: 'foo', bar: 'baz' }]`
  * **badge** - name of the icon (or a two-character string) that should be displayed in the simple list item when editing. Icon names can be anything from the [Material Design Icon Set](https://material.io/icons/), or you can use two initials
  * **allowRepeatedItems** - allow the same item more than once. defaults to false
  * **ignoreComma** - do not listen for comma key input to deliminate list items. defaults to false
  * **autocomplete** - object with autocomplete options. The key `list`  is where the value is the name of a list that Amphora knows about accessible via `/<site>/_lists/<listName>`. The key `allowRemove` enables an X in the `autocomplete` that allows the user to remove that item from the autocomplete list. If the key `allowCreate` is set to true, Kiln will add the item to the list via the store.
  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.max** - maximum number of items that the field must not exceed
  * **validate.requiredMessage** - will appear when required validation fails
  * **validate.maxMessage** - will appear when maximum validation fails

  ```yaml
    -
      fn: simple-list
      autocomplete:
        list: authors
  ```

  ### Simple List Usage

  * Type something and press <kbd>enter</kbd>, <kbd>tab</kbd>, or <kbd>,</kbd> (comma) to add it as an item
  * Delete items by clicking the `x` button or selecting them and pressing <kbd>backspace</kbd>
  * Select items using <kbd>→</kbd> / <kbd>←</kbd> or <kbd>tab</kbd> and <kbd>shift + tab</kbd>. You may select the last item in the list from the text input
  * Pressing <kbd>backspace</kbd> in an empty text input will select the last item in the list
  * If `propertyName` is defined, you can double-click items to set the "primary" item. This will add a badge to the primary item. Only one item may be "primary" at a time
  * Double-clikcing the "primary" item will unset it as the "primary" item

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

  ### Simple List Data Format

  Simple List will format data as an **array of objects**, where each object has a `text` property. If the `propertyName` argument is set, each object will also have a property (denoted by the value of the `propertyName` argument) that will be a **boolean**. Only one of the objects (the "primary item") will have this custom property set to `true`.
</docs>

<template>
  <div class="simple-list ui-textbox has-label has-floating-label" :class="classes">
    <attached-button class="ui-textbox__icon-wrapper" :name="name" :data="data" :schema="schema" :args="args" @disable="disableInput" @enable="enableInput"></attached-button>

    <div class="ui-textbox__content">
      <label class="ui-textbox__label" @click.prevent>
        <div class="ui-textbox__label-text" :class="labelClasses">{{ label }}</div>
        <div class="simple-list-items ui-textbox__input">
          <transition-group name="list-items" tag="div" class="simple-list-items-wrapper">
            <simple-list-item v-for="(item, index) in items"
              :index="index"
              :data="item"
              :key="`simple-list-${index}`"
              :currentItem="currentItem"
              :propertyName="args.propertyName"
              :badge="args.badge"
              :disabled="isDisabled"
              @remove="removeItem"
              @select="selectItem"
              @dblclick.native="setPrimary(index)"
              v-dynamic-events="customEvents"></simple-list-item>
          </transition-group>
          <simple-list-input
            :items="items"
            :allowRepeatedItems="args.allowRepeatedItems"
            :autocomplete="args.autocomplete"
            :ignoreComma="args.ignoreComma"
            :currentItem="currentItem"
            :disabled="isDisabled"
            :isInitialFocus="initialFocus === name"
            @add="addItem"
            @select="selectItem"
            @focus="onFocus"
            @blur="onBlur"
            @resize="onResize"
            v-dynamic-events="customEvents"></simple-list-input>
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
  import attachedButton from './attached-button.vue';
  import { addListItem, getItemIndex, getProp} from '../lib/lists/helpers';
  import { DynamicEvents } from './mixins';

  const log = logger(__filename);

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args', 'initialFocus'],
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
          { 'ui-textbox--icon-position-right': this.args.attachedButton },
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
      onResize(additionalPixels) {
        this.$root.$emit('resize-form', additionalPixels);
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
        let countProperty, itemIndex, listName, stringProperty;

        this.items.push(newItem);
        this.update(this.items);

        // only add items to the list if the schema allows it
        if (this.args.autocomplete && this.args.autocomplete.allowCreate) {
          listName = this.args.autocomplete.list;

          return this.$store.dispatch('updateList', { listName: listName, fn: (items) => {
            // validate that the list has items with these properties
            stringProperty = getProp(items, 'text');
            countProperty = getProp(items, 'count');

            if (stringProperty && countProperty) {
              itemIndex = getItemIndex(items, newItem.text, 'text');

              if (itemIndex !== -1) {
                // increase count if the item already exists in the list
                items[itemIndex][countProperty]++;
                return items;
              } else {
                // add item to the list
                _.set(newItem, countProperty, 1);
                return addListItem(items, newItem);
              }
            } else if (_.isString(_.head(items))) {
              // if the list is just an array of strings, just add the string
              // property
              return addListItem(items, newItem.text);
            } else if (items.length === 0) {
              log.warn('The list is empty, unable to determine data structure. Adding item with default data structure.', { action: 'adding item to a list' });
              _.set(newItem, 'count', 1);
              return addListItem(items, newItem);
            }
          }});
        }
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
    components: {
      simpleListItem,
      simpleListInput,
      attachedButton
    }
  };
</script>

<style lang="sass">
  @import '../styleguide/animations';

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
      max-width: 100%;
    }

    .list-items-enter,
    .list-items-leave-to {
      opacity: 0;
    }

    .list-items-enter-to,
    .list-items-leave {
      opacity: 1;
    }

    .list-items-enter-active,
    .list-items-leave-active {
      transition: opacity $standard-time $standard-curve;
    }
  }
</style>
