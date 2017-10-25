<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/layers';
  @import '../../styleguide/cards';

  .add-component-modal {
    @include overlay-layer();
    @include card();

    // height is computed when rendering, so we can animate it
    display: block;
    height: auto;
    max-height: calc(100vh - 100px);
    max-width: 100vw;
    opacity: 0;
    position: fixed;
    transform: translateX(-50%);
    width: 600px;

    .add-component-header {
      align-items: center;
      background-color: $card-header-bg-color;
      border-top-left-radius: 2px;
      border-top-right-radius: 2px;
      box-shadow: 0 1px 1px rgba(0, 0, 0, .16);
      display: flex;
      height: 56px;
      justify-content: space-between;
      opacity: 0;
      // visually align the right buttons
      padding: 0 14px 0 24px;
      position: relative;
      width: 100%;
    }

    .add-component-header-title {
      @include type-title();

      margin: 0;
    }

    .add-component-header-actions {
      align-items: center;
      display: flex;
      justify-content: flex-end;
    }

    .add-component-close-divider {
      border-left: 1px solid $divider-color;
      height: 22px;
      margin-left: 10px;
      width: 10px;
    }

    .add-component-list {
      // fade this in after form opens
      display: block;
      height: 500px;
      opacity: 0;
      padding: 8px;
      position: relative;
      width: 100%;
    }
  }
</style>

<template>
  <transition name="overlay-fade-resize" appear mode="out-in" :css="false" @enter="enter" @leave="leave">
    <div class="add-component-modal" v-if="hasAddComponentModal" :style="{ top: modalTop, left: modalLeft }" @click.stop>
      <div class="add-component-header">
        <h2 class="add-component-header-title">Add Component</h2>
        <div class="add-component-header-actions">
          <ui-icon-button v-if="isFuzzy" type="secondary" color="black" icon="search" :tooltip="fuzzyTitle" @click.stop="fuzzyAdd"></ui-icon-button>
          <div class="add-component-close-divider"></div>
          <ui-icon-button color="black" type="secondary" icon="close" ariaLabel="Close" tooltip="Close (ESC)" @click.stop="close"></ui-icon-button>
        </div>
      </div>
      <div class="add-component-list">
        <filterable-list :content="loaded ? components : preloadComponents" label="Find Component" help="Or pick from your most used components" :onClick="itemClick"></filterable-list>
      </div>
    </div>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { mapState } from 'vuex';
  import velocity from 'velocity-animate/velocity.min.js';
  import { getItem, updateArray } from '../utils/local';
  import label from '../utils/label';
  import { getComponentName } from '../utils/references';
  import { OPEN_ADD_COMPONENT } from './mutationTypes';
  import UiIconButton from 'keen/UiIconButton';
  import filterableList from '../utils/filterable-list.vue';

  function openAllComponents() {
    // go directly to opening a new modal, rather than calling the
    // openAddComponent action (which already determined the config for this)
    this.$store.commit(OPEN_ADD_COMPONENT, {
      currentURI: this.config.currentURI,
      parentURI: this.config.parentURI,
      path: this.config.path,
      available: this.config.allComponents
    });
  }

  export default {
    data() {
      return {
        modalTop: '50vh',
        loaded: false
      };
    },
    computed: mapState({
      hasAddComponentModal: (state) => !_.isNull(state.ui.currentAddComponentModal),
      config: (state) => state.ui.currentAddComponentModal || {},
      modalLeft: (state) => {
        const val = _.get(state, 'ui.currentAddComponentModal.pos.x');

        if (val) {
          const doc = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            isInsideViewport = val > 320 && val < doc - 320; // 20px of space on either side, otherwise we center the form

          return isInsideViewport ? `${val / doc * 100}vw` : '50vw';
        } else {
          return '50vw';
        }
      },
      isFuzzy() {
        return this.config.isFuzzy;
      },
      fuzzyTitle() {
        return this.config.isFuzzy ? 'View All Components' : null;
      },
      fuzzyAdd() {
        return this.config.isFuzzy ? openAllComponents.bind(this) : null;
      },
      // get the list of all components, so we can calculate height of the pane synchronously
      // (before the actual components() loads from the store)
      preloadComponents() {
        return _.map(this.config.available, (component) => {
          return {
            id: component,
            title: label(component)
          };
        });
      }
    }),
    asyncComputed: {
      components() {
        const parentName = getComponentName(this.config.parentURI),
          path = this.config.path,
          available = _.map(this.config.available, (component) => {
            return {
              id: component,
              title: label(component)
            };
          });

        return getItem(`addcomponents:${parentName}.${path}`).then((sortList) => {
          sortList = sortList || []; // initialize if it doesn't exist
          const sortedComponents = _.intersectionWith(sortList, available, (val, otherVal) => {
              return _.isObject(val) && _.isObject(otherVal) && val.name === otherVal.id;
            }),
            unsortedComponents = _.differenceWith(available, sortList, (val, otherVal) => {
              return val.id === otherVal.name;
            });

          this.loaded = true; // switch to the sorted list
          return _.map(sortedComponents, (component) => {
            return {
              id: component.name,
              title: label(component.name)
            };
          }).concat(unsortedComponents);
        });
      }
    },
    methods: {
      enter(el, done) {
        const posY = _.get(this.$store, 'state.ui.currentAddComponentModal.pos.y'),
          docHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        this.$nextTick(() => {
          const headerEl = find(el, '.add-component-header'),
            innerEl = find(el, '.add-component-list'),
            finalHeight = el.clientHeight,
            halfFinalHeight = finalHeight / 2;

          if (!posY) {
            // set top position of form once we know how tall it should be,
            // to prevent overflowing the top/bottom of the viewport
            this.modalTop = `${docHeight / 2 - halfFinalHeight}px`;
          } else {
            const heightPlusMargin = finalHeight / 2 + 20,
              isInsideViewport = posY > heightPlusMargin && posY < docHeight - heightPlusMargin;

            this.modalTop = isInsideViewport ? `${posY - halfFinalHeight}px` : `${docHeight / 2 - halfFinalHeight}px`;
          }
          el.style.height = '100px'; // animate from 100px to auto height (auto)
          el.style.width = '100px'; // animate from 100px to auto width (600px)
          velocity(el, { opacity: 1 }, { duration: 100 });
          velocity(el, { width: 600 }, { duration: 180 });
          velocity(headerEl, { opacity: 1 }, { delay: 225, duration: 50 });
          velocity(innerEl, { opacity: 1 }, { delay: 225, duration: 50 });
          velocity(el, { height: finalHeight }, { delay: 35, duration: 240, complete: () => {
            // set the height to auto, so forms can grow if the fields inside them grow
            // (e.g. adding complex-list items)
            // el.style.height = 'auto';
            el.style.maxHeight = `calc(100vh - ${this.modalTop})`;
            done();
          } });
        });
      },
      leave(el, done) {
        const headerEl = find(el, '.add-component-header'),
          innerEl = find(el, '.add-component-list');

        velocity(el, { width: 100 }, { delay: 55, duration: 220 });
        velocity(el, { height: 100 }, { duration: 220 });
        velocity(headerEl, { opacity: 0 }, { duration: 50 });
        velocity(innerEl, { opacity: 0 }, { duration: 50 });
        velocity(el, { opacity: 0 }, { delay: 120, duration: 100, complete: done });
      },
      close() {
        this.$store.dispatch('closeAddComponent');
      },
      itemClick(id) {
        const self = this,
          parentName = getComponentName(self.config.parentURI),
          path = self.config.path;

        return updateArray(`addcomponents:${parentName}.${path}`, { name: id })
          .then(() => {
            return self.$store.dispatch('addComponents', {
              currentURI: self.config.currentURI,
              parentURI: self.config.parentURI,
              path,
              components: [{ name: id }]
            })
              .then((newEl) => self.$store.dispatch('select', newEl))
              .then(() => self.$nextTick(() => self.close()));
          });
      }
    },
    components: {
      UiIconButton,
      'filterable-list': filterableList
    }
  };
</script>
