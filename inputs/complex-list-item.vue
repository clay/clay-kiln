<style lang="sass">
  @import '../styleguide/forms';
  @import '../styleguide/colors';
  @import '../styleguide/animations';
  @import '../styleguide/typography';

  .complex-list-item {
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

  .complex-list-item-hidden {
    height: 100px;
  }

  .complex-list-item-inner {
    @include form();
  }

  .complex-list-item + .complex-list-item {
    margin-top: 10px;
  }

  .complex-list-item-actions {
    margin-top: 10px;
    width: 100%;
  }

  .complex-list-item-actions-inner {
    align-items: center;
    display: flex;
    width: 100%;
  }

  .complex-list-item-actions-left {
    @include type-button();

    align-items: center;
    color: $text-alt-color;
    display: flex;
    flex: 0 0 auto;
    height: 36px;
  }

  .complex-list-item-actions-right {
    display: flex;
    flex: 1 0 auto;
    justify-content: flex-end;
  }
</style>

<template>
  <div class="complex-list-item" :class="{ 'is-expanded': isCurrentItem }" :ref="name" v-observe-visibility="visibilityChanged" @click.stop="onClick">
    <div v-if="isVisible" class="complex-list-item-inner">
      <field v-for="(field, fieldIndex) in fieldNames" :key="fieldIndex" :class="{ 'first-field': fieldIndex === 0 }" :name="name + '.' + field" :data="fields[field]" :schema="fieldSchemas[field]"></field>
      <div v-if="hasRequiredFields" class="required-footer">* Required fields</div>
      <transition name="complex-list-item-actions" appear mode="out-in" :css="false" @enter="enter" @leave="leave">
        <div v-if="isCurrentItem" class="complex-list-item-actions">
          <div class="complex-list-item-actions-inner ui-button-group">
            <span class="complex-list-item-actions-left">Item {{ index + 1 }}/{{ total }}</span>
            <div class="complex-list-item-actions-right ui-button-group">
              <ui-button buttonType="button" type="secondary" color="red" icon="delete" @click.stop.prevent="removeItem(index)">Remove</ui-button>
              <ui-button buttonType="button" type="secondary" color="accent" icon="add" @click.stop.prevent="addItemAndUnselect(index)">Add Another</ui-button>
            </div>
          </div>
        </div>
      </transition>
    </div>
    <div v-else class="complex-list-item-hidden"></div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { fieldProp } from '../lib/utils/references';
  import velocity from 'velocity-animate/velocity.min.js';
  import field from '../lib/forms/field.vue';
  import UiButton from 'keen/UiButton';

  export default {
    props: [
      'index',
      'total',
      'name',
      'data',
      'schema',
      'addItem',
      'removeItem',
      'currentItem'
    ],
    data() {
      return {
        isVisible: false
      };
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
      },
      visibilityChanged(isInViewport, entry) {
        const BUFFER = 500;

        if (isInViewport || entry.boundingClientRect.top < entry.rootBounds.bottom + BUFFER || entry.boundingClientRect.bottom < entry.rootBounds.top + BUFFER) {
          this.isVisible = true;
        } else {
          this.isVisible = false;
        }
      }
    },
    components: {
      field,
      UiButton
    }
  };
</script>
