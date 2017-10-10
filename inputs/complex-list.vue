<docs>
  # complex-list

  An array of objects with arbitrary properties. Each property may have any inputs a field is allowed to have, including custom inputs. Complex-list is similar to [Angular's _transcluded directives_](https://nulogy.com/who-we-are/company-blog/articles/transclusion-in-angular/) or [Advanced Custom Fields' _repeater field_](https://www.advancedcustomfields.com/add-ons/repeater-field/), in that each item in the list is treated like a separate field. Like fields, items must also have `_label`, but may not have `_placeholder`.

  ## Arguments

  * **props** an array of objects, represending the fields in each item. Each item should have a name, defined by `prop: 'name'`, as well as `_label` and the input that item uses.

  ## Usage

  * When a complex-list is empty, it will display a `add` button to add the initial item
  * Items can be added by clicking the `add` button
  * When a complex-list is _not_ empty, the focused item will have actions it, with `add` and `remove` buttons
  * Items can be removed by clicking the `remove` button
  * Items in a complex-list cannot be reordered, but can be added and removed from anywhere in the list.

  ## Example

  ```yaml
  links:
    _has:
      input: complex-list
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
</docs>

<style lang="sass">
  @import '../styleguide/animations';

  .complex-list {
    margin: 0;
    width: 100%;
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
    transition: opacity 300ms $standard-curve;
  }
</style>

<template>
  <transition mode="out-in" name="hide-show" @after-enter="onResize" @after-leave="onResize">
    <div class="complex-list" v-if="items.length">
      <transition-group mode="out-in" name="hide-show" tag="div" class="complex-list-items" @after-enter="onResize" @after-leave="onResize">
        <item v-if="items.length" v-for="(item, index) in items"
          :index="index"
          :name="name + '.' + index"
          :data="item"
          :schema="args.props"
          :key="index"
          :currentItem="currentItem"
          :addItem="addItem"
          :removeItem="removeItem"
          @current="onCurrentChange">
        </item>
      </transition-group>
    </div>
    <ui-button v-else buttonType="button" color="primary" icon="add" @click.stop.prevent="addItem(-1)">Add Items</ui-button>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import item from './complex-list-item.vue';
  import UiButton from 'keen/UiButton';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        currentItem: _.isArray(this.data) ? this.data.length - 1 : 0
      };
    },
    computed: {
      items() {
        return _.isArray(this.data) ? this.data : [];
      }
    },
    methods: {
      updateFormData(items) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: items });
      },
      onResize() {
        this.$emit('resize'); // potentially resize the form (after transitioning elements)
      },
      addItem(index) {
        const props = _.map(_.get(this.args, 'props', []), (item) => item.prop),
          newObj = _.reduce(props, (obj, prop) => {
            obj[prop] = null;
            return obj;
          }, {});

        let items = _.cloneDeep(this.items);

        items.splice(index + 1, 0, newObj); // add new item after the specified index
        this.updateFormData(items); // save the data
      },
      removeItem(index) {
        let items = _.cloneDeep(this.items);

        items.splice(index, 1); // remove item at the specified index
        this.updateFormData(items);
      },
      onCurrentChange(index) {
        this.currentItem = index;
      }
    },
    components: {
      item,
      UiButton
    }
  };
</script>
