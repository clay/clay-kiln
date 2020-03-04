<template>
  <div class="complex-list-item" :class="{ 'is-current': isCurrentItem, 'is-expanded': isExpanded }" :ref="name" v-observe-visibility="visibilityChanged" @click.stop="onClick" @focusin.stop="onFocus">
    <transition name="complex-list-item-collapse" appear mode="out-in">
      <div key="expanded-visible" v-if="isVisible && isExpanded" class="complex-list-item-inner">
        <field v-for="(field, fieldIndex) in fieldNames" :key="fieldIndex" :name="name + '.' + field" :data="fields[field]" :schema="fieldSchemas[field]" :initialFocus="initialFocus" :disabled="disabled"></field>
        <div v-if="hasRequiredFields" class="required-footer">* Required fields</div>
          <div class="complex-list-item-actions">
            <div class="complex-list-item-actions-inner ui-button-group">
              <div class="complex-list-item-actions-left ui-button-group">
                <ui-icon-button v-if="!isFirstItem && !isFiltered" buttonType="button" type="secondary" color="black" icon="keyboard_arrow_up" @click.stop.prevent="moveItem('up')" />
                <span class="complex-list-item-position">{{ originalIndex + 1 }}/{{ total }}</span>
                <ui-icon-button v-if="!isLastItem && !isFiltered" buttonType="button" type="secondary" color="black" icon="keyboard_arrow_down" @click.stop.prevent="moveItem('down')" />
              </div>
              <transition name="complex-list-item-actions" appear mode="out-in" :css="false" @enter="enter" @leave="leave">
                <div v-if="isCurrentItem" class="complex-list-item-actions-right ui-button-group">
                  <ui-button v-if="isFirstItem && !isFiltered && isBelowMaxLength" buttonType="button" type="secondary" color="accent" icon="arrow_upward" :disabled="disabled" @click.stop.prevent="addItemAndUnselect(-1)">Add Above</ui-button>
                  <ui-button buttonType="button" type="secondary" color="red" icon="delete" @click.stop.prevent="$emit('removeItem', originalIndex)" :disabled="disabled">Remove</ui-button>
                  <ui-button v-if="!isFiltered && isBelowMaxLength" buttonType="button" type="secondary" color="accent" icon="add" :disabled="disabled" @click.stop.prevent="addItemAndUnselect(originalIndex)">Add Below</ui-button>
                </div>
              </transition>
            </div>
          </div>
      </div>
      <div key="collapsed-visible" v-else-if="isVisible" class="complex-list-item-collapsed">
        <div class="complex-list-item-collapsed-index">{{ originalIndex + 1 }}/{{ total }}</div>
        <div class="complex-list-item-collapsed-title">{{ collapsedTitle }}</div>
        <div class="complex-list-item-collapsed-caret">
          <ui-icon-button buttonType="button" type="secondary" color="black" icon="keyboard_arrow_down"></ui-icon-button>
        </div>
      </div>
      <div key="invisisble" v-else class="complex-list-item-hidden"></div>
    </transition>
  </div>
</template>

<script>
  import _ from 'lodash';
  import 'intersection-observer'; // polyfill for safari
  import { fieldProp } from '../lib/utils/references';
  import velocity from 'velocity-animate/velocity.min.js';
  import field from '../lib/forms/field.vue';
  import UiButton from 'keen/UiButton';
  import UiIconButton from 'keen/UiIconButton';

  export default {
    props: [
      'index',
      'total',
      'name',
      'data',
      'schema',
      'isBelowMaxLength',
      'isFiltered',
      'disabled',
      'originalItems',
      'currentItem',
      'initialFocus'
    ],
    data() {
      return {
        isVisible: false
      };
    },
    computed: {
      isCollapsible() {
        return _.has(this.schema, 'collapse');
      },
      collapsedTitle() {
        return _.get(this.data, _.get(this.schema, 'collapse')) || 'New Item';
      },
      props() {
        return _.get(this, 'schema.props');
      },
      isCurrentItem() {
        return this.currentItem === this.index;
      },
      isExpanded() {
        return this.isCurrentItem || !this.isCollapsible;
      },
      isFirstItem() {
        return this.index === 0;
      },
      isLastItem() {
        return this.index + 1 === this.total;
      },
      fieldNames() {
        return _.map(this.props, field => field.prop); // names for all the fields in this item
      },
      fields() {
        return this.data; // data for all the fields in this item
      },
      fieldSchemas() {
        return _.reduce(this.props, (obj, field) => {
          const fieldName = field.prop,
            fieldSchema = _.omit(field, ['prop']);

          obj[fieldName] = fieldSchema;
  
          return obj;
        }, {});
      },
      hasRequiredFields() {
        // true if any of the fields in the current item have required validation
        return _.some(this.props, obj => _.has(obj, `${fieldProp}.validate.required`));
      },
      originalIndex() {
        return this.originalItems.indexOf(this.data);
      }
    },
    methods: {
      enter(el, done) {
        this.$nextTick(() => {
          velocity(el, 'fadeIn', { duration: 250, complete: done });
        });
      },
      moveItem(direction) {
        this.$emit('moveItem', { index: this.originalIndex, direction });
      },
      leave(el, done) {
        this.$nextTick(() => {
          velocity(el, 'fadeOut', { delay: 50, duration: 250, complete: done });
        });
      },
      addItemAndUnselect(id) {
        this.$emit('addItem', id);
        this.$emit('current', this.index + 1);
      },
      onClick() {
        this.$emit('current', this.index);
      },
      onFocus() {
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
      UiButton,
      UiIconButton
    }
  };
</script>

<style lang="sass">
  @import '../styleguide/forms';
  @import '../styleguide/colors';
  @import '../styleguide/animations';
  @import '../styleguide/typography';

  .complex-list-item {
    border: 1px solid $divider-color;
    border-radius: 2px;
    box-shadow: $shadow-2dp;
    padding: 16px 16px 0;
    transition: box-shadow 200ms $standard-curve;

    &:hover {
      box-shadow: $shadow-4dp;
    }

    &.is-current {
      box-shadow: $shadow-8dp;
    }
  }

  .complex-list-item-hidden {
    height: 100px;
  }

  .complex-list-item-collapsed {
    align-items: center;
    cursor: pointer;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    padding-bottom: 16px;
  }

  .complex-list-item-collapsed-index {
    @include type-subheading();

    color: $text-alt-color;
    flex: 0 0 auto;
  }

  .complex-list-item-collapsed-title {
    @include type-subheading();

    color: $text-color;
    flex: 0 1 100%;
    overflow: hidden;
    padding: 0 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .complex-list-item-collapsed-caret {
    flex: 0 0 auto;
  }

  .complex-list-item-inner {
    @include form();
  }

  .complex-list-item + .complex-list-item {
    margin-top: 10px;
  }

  .complex-list-item-actions {
    border-top: 1px solid $card-border-color;
    margin: 16px -16px 0;
    // account for outer padding
    padding: 8px 16px;
    width: calc(100% + 32px);
  }

  .complex-list-item-actions-inner {
    align-items: center;
    display: flex;
    justify-content: space-between;
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

  .complex-list-item-position {
    color: $text-alt-color;
    margin: 0 4px;
  }

  .complex-list-item-actions-right {
    display: flex;
    flex: 0 0 auto;
    justify-content: flex-end;
  }
</style>
