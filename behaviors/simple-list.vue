<docs>
  # text

  Simple list
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
            :property="item[args.propertyName]"
            :badge="badgeOrPropertyName"
            :changeFocus="changeFocus"
            :selectItem="selectItem"
            :removeItem="removeItem"
            v-on:dblclick.native="onDoubleClick">
          </item>
      </li>
    </ol>
    <div class="simple-list-input">
      <input
        type="text"
        class="simple-list-add"
        placeholder="Start Typing Here..."
        v-model="inputVal"
        @input="onChange"
        @keyup.enter="onEnter"
        @keydown.delete="removeLastItem"
        @keydown.left="focusItem"
        @keydown.down="autocompleteFocus(false)"
        @keydown.up.prevent="autocompleteFocus(true)"
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
  </div>
</template>

<script>
  import _ from 'lodash';
  import item from './simple-list-item.vue';
  import autocomplete from './autocomplete.vue';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        focusIndex: null,
        items: [],
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
      }
    },
    methods: {
      onDoubleClick() {
        if (_.get(this.args, 'propertyName', '')) {
          this.items = _.map(this.items, (item, i) => {
            item[this.args.propertyName] = this.focusIndex === i;
            return item;
          });

          console.log(this.items);
        }
      },
      onChange() {
        if (!this.displayAutocomplete) {
          this.displayAutocomplete = !this.displayAutocomplete;
        }
      },
      // Add an item to the array
      onEnter() {
        if (this.inputVal) {

          // If we have autocomplete and we've selected something
          // inside of the autocomplete dropdown...
          if (_.get(this.args, 'autocomplete', '') && _.isNumber(this.autocompleteIndex)) {
            this.inputVal = _.get(this.autocompleteOptions, this.autocompleteIndex, '');
            this.displayAutocomplete = false;
          } else {
            this.items.push({
              text: this.inputVal
            });

            // Update the store
            // this.$store.commit(UPDATE_FORMDATA, {path: this.name, data: this.items})

            // Zero out values
            this.inputVal = '';
            this.focusIndex = null;
          }

          this.autocompleteIndex = null;
        }
      },
      // Remove the last item from the list
      removeLastItem() {
        if (!this.inputVal && this.items.length) {
          this.items.splice(-1);
        }
      },
      // Focus on the last item in the list
      focusItem(dir = false) {
        if (!_.isNumber(this.focusIndex) && !this.inputVal.length) {
          let end = this.items.length - 1;

          this.focusIndex = end;
          this.$children[end].$el.focus();
        }
      },
      // When focused on an item, change the focus
      // based on keypress
      changeFocus(dir) {
        var length = this.items.length - 1;

        if (dir) {
          if (this.focusIndex === length) {
            this.focusOnInput();
          } else {
            this.focusIndex++;
          }
        } else {
          if (this.focusIndex) {
            this.focusIndex--;
          }
        }
      },
      // Focus on the input and set the
      // focusIndex to null
      focusOnInput() {
        this.focusIndex = null;
        this.input.focus();
      },
      // Directly select an item
      selectItem(index) {
        this.focusIndex = index;
        this.input.focus();
      },
      // Remove an item
      removeItem() {
        // Remove the item
        this.items.splice(this.focusIndex, 1);

        if (this.items.length) {
          this.changeFocus(false);

          let indexVal = this.focusIndex ? this.focusIndex : 1;
          this.$children[indexVal].$el.focus();
        } else {
          this.focusOnInput();
        }
      },
      updateAutocompleteMatches(options) {
        this.autocompleteOptions = options;
      },
      autocompleteSelect(value) {
        this.inputVal = value;
        this.displayAutocomplete = false;
        this.focusOnInput();
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
    mounted() {
      // Grab the reference to the input
      this.input = this.$el.querySelector('.simple-list-add');
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
