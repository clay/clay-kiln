<docs>
  # complex-list-item

  A component which represents a single item in the `complex-list` component. Functionality is derived from its parent. Behaves similar to a field, as it transcludes other behaviors via the same "slot" mechanism that field uses.
</docs>

<style lang="sass">
  @import '../styleguide/forms';
  @import '../styleguide/colors';
  @import '../styleguide/buttons';

  .complex-list-item {
    @include form();

    border-bottom: 1px solid $selector-divider;
    padding-bottom: 20px;
    z-index: auto;
  }

  .complex-list-item:first-of-type {
    border-top: 1px solid $selector-divider;
    padding-top: 20px;
  }

  .complex-list-item + .complex-list-item {
    margin-top: 20px;
  }

  .complex-list-item-selector {
    border-top: 3px solid $mini-selector-color;
    left: 0;
    position: absolute;
    top: 100%;
    width: 100%;
    z-index: 2;
  }

  .complex-list-item-selector-menu {
    align-items: center;
    background: $selector-bg;
    border: 1px solid $mini-selector-color;
    border-top: none;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    position: absolute;
    top: 0;
    width: auto;

    &:before {
      border: 1px solid $mini-selector-border-padding;
      border-top: none;
      content: '';
      height: calc(100% + 2px);
      left: -2px;
      position: absolute;
      top: 0;
      width: calc(100% + 4px);
    }

    &:after {
      border-top: 1px solid $mini-selector-border-padding;
      content: '';
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: calc(100% + 2px);
    }
  }

  .complex-list-item-selector-button {
    @include icon-button($mini-selector-color, 18px);

    // note: 46px is width minus border
    flex: 0 0 46px;
    padding: 14px;
    z-index: 1;

    &.complex-list-item-selector-add {
      border-left: 1px solid $mini-selector-border-padding;
    }
  }
</style>

<template>
  <li class="complex-list-item" :ref="name">
    <field v-for="(field, fieldIndex) in fieldNames" :class="{ 'first-field': fieldIndex === 0 }" :name="name + '.' + field" :data="fields[field]" :schema="fieldSchemas[field]"></field>
    <transition name="selector-fade">
      <aside v-show="isCurrentItem" class="complex-list-item-selector" @click.stop>
        <div class="complex-list-item-selector-menu">
          <button type="button" class="complex-list-item-selector-button complex-list-item-selector-remove" title="Remove Item" @click.stop.prevent="removeItem(index)"><icon name="delete"></icon></button>
          <button type="button" class="complex-list-item-selector-button complex-list-item-selector-add" title="Add Item" @click.stop.prevent="addItem(index)"><icon name="add-icon"></icon></button>
        </div>
      </aside>
    </transition>
  </li>
</template>

<script>
  import _ from 'lodash';
  import field from '../lib/forms/field.vue';
  import icon from '../lib/utils/icon.vue';

  export default {
    props: [
      'index',
      'name',
      'data',
      'schema',
      'addItem',
      'removeItem'
    ],
    data() {
      return {
        isCurrentItem: false
      };
    },
    computed: {
      fieldNames() {
        return _.map(this.schema, (field) => field.prop); // names for all the fields in this item
      },
      fields() {
        return this.data; // data for all the fields in this item
      },
      fieldSchemas() {
        return _.reduce(this.schema, (obj, field) => {
          const fieldName = field.prop,
            fieldSchema = _.omit(field, ['prop']);

          obj[fieldName] = fieldSchema;
          return obj;
        }, {});
      }
    },
    methods: {
      focusChanged() {
        const activeEl = document.activeElement,
          el = this.$el;

        this.isCurrentItem = el.contains(activeEl);
      }
    },
    mounted() {
      document.addEventListener('focusin', this.focusChanged)
    },
    beforeDestroy() {
      document.removeEventListener('focusin', this.focusChanged)
    },
    components: {
      field,
      icon
    }
  };
</script>
