<docs>
  # complex-list

  An array of objects with arbitrary properties. Each property may have any behaviors a field is allowed to have, including custom behaviors. Complex-list is similar to [Angular's _transcluded directives_](https://nulogy.com/who-we-are/company-blog/articles/transclusion-in-angular/) or [Advanced Custom Fields' _repeater field_](https://www.advancedcustomfields.com/add-ons/repeater-field/), in that each item in the list is treated like a separate field. Items may also have `_label`, but may not have `_display` or `_placeholder`.

  ## Arguments

  * **props** an array of objects, represending the fields in each item. Each item should have a name, defined by `prop: 'name'`, as well as any `_label` or behaviors it needs.

  ## Usage

  * When a complex-list is empty, it will display a plus button, styled similarly to components' mini-selector.
  * Items can be added by clicking the plus button.
  * When a complex-list is _not_ empty, the focused item will have a mini-selector below it, with add and remove buttons
  * Items can be removed by clicking the trashcan button.
  * Items in a complex-list cannot be reordered, but can be added and removed from anywhere in the list.
</docs>

<style lang="sass">
  @import '../styleguide/buttons';
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  .complex-list {
    margin-top: 10px;
    width: 100%;
  }

  .complex-list-items {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .complex-list-add {
    @include button-outlined($mini-selector-color, $mini-selector-border-padding);

    align-items: center;
    display: flex;
    flex-flow: row nowrap;
    height: auto;
    justify-content: center;
  }

  .complex-list-add-icon {
    @include icon-button($mini-selector-color, 18px);

    padding: 0;
  }

  .complex-list-add-text {
    @include input-label();

    color: $mini-selector-color;
    line-height: 13px;
    margin-left: 10px;
  }
</style>

<template>
  <div class="complex-list">
    <ul class="complex-list-items">
      <item v-for="(item, index) in items"
        :index="index"
        :name="name + '.' + index"
        :data="item"
        :schema="args.props"
        key="index"
        :addItem="addItem"
        :removeItem="removeItem">
      </item>
      <button v-if="items.length === 0" class="complex-list-add" title="Add Item" @click.stop.prevent="addItem(-1)"><icon name="add-icon" class="complex-list-add-icon"></icon><span class="complex-list-add-text">Add Items</span></button>
    </ul>
  </div>
</template>

<script>
  import _ from 'lodash';
  import item from './complex-list-item.vue';
  import icon from '../lib/utils/icon.vue';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      items() {
        return _.isArray(this.data) ? _.cloneDeep(this.data) : [];
      }
    },
    methods: {
      updateFormData() {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: this.items });
      },
      addItem(index) {
        const props = _.map(_.get(this.args, 'props', []), (item) => item.prop),
          newObj = _.reduce(props, (obj, prop) => {
            obj[prop] = null;
            return obj;
          }, {});

        this.items.splice(index + 1, 0, newObj); // add new item after the specified index
        this.updateFormData(); // save the data
      },
      removeItem(index) {
        this.items.splice(index, 1); // remove item at the specified index
        this.updateFormData();
      },
    },
    components: {
      item,
      icon
    },
    slot: 'main'
  };
</script>
