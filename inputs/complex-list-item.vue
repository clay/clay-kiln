<docs>
  # complex-list-item

  A component which represents a single item in the `complex-list` input. Functionality is derived from its parent. Behaves similar to a field, as it transcludes other inputs via the same mechanism that field uses.
</docs>

<style lang="sass">
  @import '../styleguide/forms';
  @import '../styleguide/colors';
  @import '../styleguide/animations';

  .complex-list-item {
    @include form();

    border: 1px solid $divider-color;
    border-radius: 2px;
    box-shadow: $shadow-2dp;
    padding: 16px;
    transition: all 200ms $standard-curve;

    &:hover {
      box-shadow: $shadow-4dp;
    }

    &.is-expanded {
      box-shadow: $shadow-8dp;
    }
  }

  .complex-list-item + .complex-list-item {
    margin-top: 10px;
  }

  .complex-list-item-actions {
    justify-content: space-between;
    margin-top: 10px;
    width: 100%;
  }
</style>

<template>
  <div class="complex-list-item" :class="{ 'is-expanded': isCurrentItem }" :ref="name" @click.stop="onClick">
    <field v-for="(field, fieldIndex) in fieldNames" :class="{ 'first-field': fieldIndex === 0 }" :name="name + '.' + field" :data="fields[field]" :schema="fieldSchemas[field]"></field>
    <div v-if="hasRequiredFields" class="required-footer">* Required fields</div>
    <transition name="complex-list-item-actions" appear mode="out-in" :css="false" @enter="enter" @leave="leave">
      <div v-if="isCurrentItem" class="complex-list-item-actions ui-button-group">
        <ui-button buttonType="button" type="secondary" color="red" icon="delete" @click.stop.prevent="removeItem(index)">Remove Item</ui-button>
        <ui-button buttonType="button" type="secondary" color="primary" icon="add" @click.stop.prevent="addItemAndUnselect(index)">Add Item</ui-button>
      </div>
    </transition>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { fieldProp } from '../lib/utils/references';
  import velocity from 'velocity-animate';
  import field from '../lib/forms/field.vue';
  import UiButton from 'keen/UiButton';

  export default {
    props: [
      'index',
      'name',
      'data',
      'schema',
      'addItem',
      'removeItem',
      'currentItem'
    ],
    data() {
      return {};
    },
    computed: {
      isCurrentItem() {
        return this.currentItem === this.index;
      },
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
      },
      hasRequiredFields() {
        // true if any of the fields in the current item have required validation
        return _.some(this.schema, (obj) => _.has(obj, `${fieldProp}.validate.required`));
      }
    },
    methods: {
      enter(el, done) {
        this.$nextTick(() => {
          velocity(el, 'slideDown', { duration: 375, complete: done });
        });
      },
      leave(el, done) {
        this.$nextTick(() => {
          velocity(el, 'slideUp', { delay: 50, duration: 375, complete: done });
        });
      },
      addItemAndUnselect(id) {
        this.addItem(id);
        this.$emit('current', this.index + 1);
      },
      onClick() {
        this.$emit('current', this.index);
      }
    },
    components: {
      field,
      UiButton
    }
  };
</script>
