<docs>
  # simple-list

  An array of objects with a `text` property that is a string to display in a list. Useful for tags, authors, keywords, etc.

  ## Arguments

  * **allowRepeatedItems** _(optional)_ allow the same item more than once. defaults to false

  * **autocomplete** _(optional)_ NEED TO DECIDE ON THE API

  * **propertyName** _(optional)_ appends double-click functionality to items in the list. Name of the property that is considered "primary"

  * **badge** _(optional)_ string to put in the badge if `propertyName` is defined. Defaults to property name

  ## Usage

  * Items may be added by clicking into the input, typing stuff, then pressing <kbd>enter</kbd>, <kbd>tab</kbd>, or <kbd>,</kbd> (comma).
  * Items may be deleted by selecting them (either by clicking them or navigating with the <kbd>→</kbd> and <kbd>←</kbd> then hitting <kbd>delete</kbd> or <kbd>backspace</kbd>.
  * Hitting <kbd>delete</kbd>, <kbd>backspace</kbd>, or <kbd>←</kbd> in the input will select the last item if the input is empty.
  * If `propertyName` is defined it will allow users to double-click items in a simple-list to select a "primary" item. It will also append a small badge to the "primary" item. Only one item may be "primary" at a time.
</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/buttons';
  @import '../styleguide/inputs';

  .simple-list {
    display: flex;
    flex-flow: row wrap;
    flex-grow: 1;
    margin: 10px 0;
  }

  .simple-list-input {
    position: relative;
  }

  .simple-list-items {
    display: flex;
    flex-flow: row wrap;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .simple-list-add {
    @include input-text();

    border: 0;
    display: inline-block;
    flex: 1 0 135px;
    height: 48px;
    min-width: 100px;
    outline: none;
    padding: 7px 11px 6px;
    width: auto;
  }

  .simple-list-add:invalid {
    border: 1px solid $bright-error;
  }

</style>

<template>
  <div class="simple-list">
    <ol class="simple-list-items">
      <li v-for="(item, index) in items">
          <item
            :index="index"
            :focusIndex="focusIndex"
            :value="item.text"
            key="index"
            :property="item[args.propertyName]"
            :badge="badgeOrPropertyName"
            :selectItem="selectItem"
            :removeItem="removeItem"
            @click="selectItem(index)"
            v-on:dblclick.native="onDoubleClick">
          </item>
      </li>
      <li>
        <div class="simple-list-input">
          <input
            type="text"
            class="simple-list-add"
            placeholder="Start Typing Here..."
            v-model="inputVal"
            @input="onChange"
            @keydown.enter="addItem"
            @keydown.tab="addItem"
            @keydown.comma="addItem"
            @keydown.delete="focusLastItem"
            @keydown.left="focusLastItem"
            @keydown.right="focusFirstItem"
            @keydown.down="autocompleteFocus(false)"
            @keydown.up.prevent="autocompleteFocus(true)"
            v-conditional-focus="focusOnInput"
          />
          <autocomplete
            v-if="args.autocomplete"
            :args="args.autocomplete"
            :query="inputVal"
            :select="autocompleteSelect"
            :focusIndex="autocompleteIndex"
            :updateFocusIndex="updateFocusIndex"
            :updateMatches="updateAutocompleteMatches">
          </autocomplete>
        </div>
      </li>
    </ol>
  </div>
</template>

<script>
  import _ from 'lodash';
  import item from './simple-list-item.vue';
  import autocomplete from './autocomplete.vue';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import conditionalFocus from '../directives/conditional-focus';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        focusIndex: null,
        inputVal: '',
        input: null,
        autocompleteIndex: null,
        autocompleteOptions: [],
        displayAutocomplete: true
      }
    },
    computed: {
      showAutocomplete() {
        return _.get(this.args, 'autocomplete', '') && this.displayAutocomplete;
      },
      badgeOrPropertyName() {
        return this.args.badge || this.args.propertyName;
      },
      items() {
        return _.isArray(this.data) ? _.cloneDeep(this.data) : [];
      },
      focusOnInput() {
        return _.isNull(this.focusIndex);
      }
    },
    methods: {
      updateFormData() {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: this.items });
      },
      onDoubleClick() {
        if (_.get(this.args, 'propertyName', '')) {
          this.items = _.map(this.items, (item, i) => {
            item[this.args.propertyName] = this.focusIndex === i;
            return item;
          });

          // Save
          this.updateFormData();
        }
      },
      onChange() {
        if (!this.displayAutocomplete) {
          this.displayAutocomplete = !this.displayAutocomplete;
        }
      },
      // Add an item to the array
      addItem(e) {
        if (this.inputVal) {
          // Prevent submitting the form by preventing default
          e.preventDefault();

          // If we have autocomplete and we've selected something
          // inside of the autocomplete dropdown...
          if (_.get(this.args, 'autocomplete', '') && _.isNumber(this.autocompleteIndex)) {
            this.inputVal = _.get(this.autocompleteOptions, this.autocompleteIndex, '');
            this.displayAutocomplete = false;
          } else {
            // Add item in
            this.items.push({
              text: this.inputVal
            });

            // Save data
            this.updateFormData();

            // Zero out values
            this.inputVal = '';
            this.focusIndex = null;
          }

          this.autocompleteIndex = null;
        }
      },
      // Remove the last item from the list
      // removeLastItem() {
      //   if (!this.inputVal && this.items.length) {
      //     this.items.splice(-1);
      //     // Update the data
      //     this.updateFormData();
      //   }
      // },
      // Focus on the first item in the list
      focusFirstItem() {
        if (this.items.length && !this.inputVal.length) {
          this.focusIndex = 0;
        }
      },
      // Focus on the last item in the list
      focusLastItem() {
        if (_.isNull(this.focusIndex) && !this.inputVal.length) {
          this.focusIndex = this.items.length - 1;
        }
      },
      // Directly select an item
      selectItem(index) {
        console.log(index);
        if (index < 0 || index >= this.items.length) {
          this.focusIndex = null;
        } else {
          if (!this.items.length) {
            this.focusIndex = null;
          } else {
            this.focusIndex = index;
          }
        }
      },
      // Remove an item
      removeItem() {
        // Remove the item
        this.items.splice(this.focusIndex, 1);
        // Update the form data
        this.updateFormData();

        if (this.items.length) {
          this.selectItem(this.focusIndex - 1);
        } else {
          this.focusIndex = null;
        }
      },
      updateAutocompleteMatches(options) {
        this.autocompleteOptions = options;
      },
      autocompleteSelect(value) {
        this.inputVal = value;
        this.displayAutocomplete = false;
        this.focusIndex = null;
      },
      autocompleteFocus(dir) {
        if (_.isNumber(this.autocompleteIndex)) {
          dir ? this.autocompleteIndex-- : this.autocompleteIndex++;
        } else {
          this.autocompleteIndex = dir ? -1 : 0;
        }
      },
      updateFocusIndex(val) {
        this.autocompleteIndex = val;
      }
    },
    components: {
      item,
      autocomplete
    },
    slot: 'main'
  };

  function atEndOfArray(index, length) {
    return (length - 2) === index;
  }
</script>
