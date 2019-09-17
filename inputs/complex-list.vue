<docs>
  # `complex-list`

  An array of objects with arbitrary properties. Each property may have any inputs a field is allowed to have, including custom inputs. Complex-list is similar to [Angular's _transcluded directives_](https://nulogy.com/who-we-are/company-blog/articles/transclusion-in-angular/) or [Advanced Custom Fields' _repeater field_](https://www.advancedcustomfields.com/add-ons/repeater-field/), in that each item in the list is treated like a separate field. Like fields, items must also have `_label`, but may not have `_placeholder`.

  ### Complex List Arguments

  * **props** an array of objects, representing the fields in each item. Each item should have a name, defined by `prop: 'name'`, as well as `_label` and the input that item uses.
  * **collapse** a property that should be used as the title for items. If `collapse` is set, all but the current item will be collapsed, only displaying its title. This is useful for lists with lots of complicated items.
  * **filter** boolean determining if the items may be filtered. If `true`, will add a search box at the top of the list.
  * **enforceMaxlength** - boolean preventing user from adding items when list is at max length (`from validate.max`)

  ### Complex List Usage

  * When a complex-list is empty, it will display a `add` button to add the initial item
  * Items can be added by clicking the `add` button
  * When a complex-list is _not_ empty, the focused item will have actions it, with `add` and `remove` buttons
  * Items can be removed by clicking the `remove` button
  * Items can be reordered by clicking the up and down carets next to their location
  * If complex-list is filterable, typing in the search box will match all text inputs in the list items

  ```yaml
  links:
    _has:
      input: complex-list
      collapse: title
      filter: true
      props:
        -
          prop: url
          _label: URL
          _has:
            input: text
            type: url
        -
          prop: title
          _label: Title
          _has: text
  ```

  {% hint style="info" %}

  Complex lists don't have any of the common shared arguments, and don't display a field label.

  {% endhint %}

  ### Complex List Data Format

  Complex lists will always return an **array of objects**, where each object has the properties defined as `props` in the Schema.
</docs>

<template>
  <transition mode="out-in" name="hide-show" @after-enter="onResize">
    <div class="complex-list" v-if="items.length" v-click-outside="unselect">
      <ui-textbox v-if="isFilterable" type="text" label="Filter List"
        v-model.trim="query"
        :autofocus="true"
        :floatingLabel="true"></ui-textbox>
      <transition-group mode="out-in" name="hide-show" tag="div" class="complex-list-items" @after-enter="onListResize">
        <item v-for="(item, index) in matches"
          :index="index"
          :total="items.length"
          :originalItems="items"
          :name="name + '.' + index"
          :data="item"
          :schema="args"
          :key="`complex-list-items-${index}`"
          :isFiltered="isFiltered"
          :currentItem="currentItem"
          :isBelowMaxLength="isBelowMaxLength"
          :initialFocus="initialFocus"
          @current="onCurrentChange"
          @removeItem="removeItem"
          @moveItem="moveItem"
          @addItem="addItem"
          v-dynamic-events="customEvents">
        </item>
      </transition-group>
    </div>
    <ui-button v-else buttonType="button" color="accent" icon="add" :disabled="disabled" @click.stop.prevent="addItem(-1)">Add Items</ui-button>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import Fuse from 'fuse.js';
  import item from './complex-list-item.vue';
  import UiButton from 'keen/UiButton';
  import UiTextbox from 'keen/UiTextbox';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { DynamicEvents } from './mixins';

  /**
   * recursively build keys to filter by
   * @param  {object} schema
   * @param  {string} [path] used when recursing
   * @return {array}
   */

  function buildKeys(schema, path = '') {
    let keys = [];

    _.each(_.get(schema, '_has.props', []), (prop) => {
      const input = _.isString(prop._has) ? prop._has : _.get(prop, '_has.input'),
        key = path ? `${path}.${prop.prop}` : prop.prop;

      if (_.includes(['text', 'wysiwyg'], input)) {
        // text prop, add it to the keys
        keys.push(key);
      } else if (input === 'select' && !_.get(prop, '_has.multiple')) {
        // single select
        keys.push(key);
      } else if (input === 'complex-list') {
        keys.concat(buildKeys(prop, prop.prop));
      }
    });

    return keys;
  }

  /**
   * filter content by query
   * @param  {array} items
   * @param  {string} query
   * @param  {array} keys
   * @return {array}
   */
  function filterContent(items, query, keys) {
    const options = {
        shouldSort: false,
        tokenize: true,
        findAllMatches: true,
        threshold: 0.3,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: keys
      },
      fuse = new Fuse(items, options);

    return fuse.search(query);
  }

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args', 'initialFocus', 'disabled'],
    data() {
      return {
        currentItem: _.isArray(this.data) ? this.data.length - 1 : 0,
        query: ''
      };
    },
    computed: {
      items() {
        return _.isArray(this.data) ? this.data : []; // _index is the original index, used when filtered
      },
      keys() {
        return this.isFilterable ? buildKeys(this.schema) : [];
      },
      matches() {
        return this.query.length && this.isFilterable ? filterContent(this.items, this.query, this.keys) : this.items;
      },
      isFilterable() {
        return _.get(this.schema, '_has.filter');
      },
      isFiltered() {
        return this.query.length > 0;
      },
      maxlength() {
        return _.get(this.schema, '_has.validate.max', 0); // note: we assume 0 means no max length
      },
      hasEnforcedMaxlength() {
        return _.get(this.schema, '_has.enforceMaxlength', false);
      },
      isBelowMaxLength() {
        if (this.maxlength && this.hasEnforcedMaxlength) {
          return this.items.length < this.maxlength;
        } else {
          return true; // if there's no max length, or it's not enforced, don't worry about it!
        }
      }
    },
    methods: {
      updateFormData(items) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: items });
      },
      onListResize() {
        this.$root.$emit('resize-form'); // potentially resize the form (after transitioning elements)
      },
      onResize(el) {
        if (el && el.classList.contains('complex-list')) {
          this.$root.$emit('resize-form'); // resize the form because we've displayed the list
        }
      },
      addItem(index) {
        const props = _.map(_.get(this.args, 'props', []), item => item.prop),
          newObj = _.reduce(props, (obj, prop) => {
            obj[prop] = null;
  
            return obj;
          }, {});

        let items = _.cloneDeep(this.items);

        items.splice(index + 1, 0, newObj); // add new item after the specified index
        this.currentItem = index + 1; // select new item
        this.updateFormData(items); // save the data
      },
      removeItem(index) {
        let items = _.cloneDeep(this.items);

        items.splice(index, 1); // remove item at the specified index
        this.updateFormData(items);
      },
      moveItem({ index, direction }) {
        let items = _.cloneDeep(this.items),
          item = _.head(items.splice(index, 1));

        if (direction === 'up') {
          // up one
          items.splice(index - 1, 0, item);
          this.currentItem = index - 1;
        } else {
          // down one
          items.splice(index + 1, 0, item);
          this.currentItem = index + 1;
        }
        this.updateFormData(items); // save the data
      },
      unselect() {
        this.currentItem = null;
      },
      onCurrentChange(index) {
        this.currentItem = index;
      }
    },
    components: {
      item,
      UiButton,
      UiTextbox
    }
  };
</script>

<style lang="sass">
  @import '../styleguide/animations';

  .complex-list {
    margin: 0;
    width: 100%;

    > .ui-textbox {
      margin-bottom: 10px;
    }
  }

  .hide-show-enter,
  .hide-show-leave-to {
    opacity: 0;
  }

  .hide-show-enter-to,
  .hide-show-leave {
    opacity: 1;
  }

  .hide-show-enter-active,
  .hide-show-leave-active {
    transition: opacity $standard-time $standard-curve;
  }
</style>
